import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../database/models/index.js";
import getDeepCopy from "../utils/helpers/getDeepCopy.js";
import { getBrandsLogos } from "./api/apiBrandController.js";
import { getProductsFromDB } from "./api/apiProductController.js";
import sizes from "../utils/staticDB/sizes.js";
import { getDropImages, getDropsFromDB, setDropLaunchDateString } from "./api/apiDropController.js";
import clearUserSession from "../utils/helpers/clearUserSession.js";
// Obtener la ruta absoluta del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../utils/staticDB/countries.js");
const controller = {
  index: (req, res) => {
    return res.render("index");
  },
  productList: async (req, res) => {
    // Los pido asi porque unicamente son para pintar los botones
    let dropsFromDB = await db.Drop.findAll({
      order: [["name", "ASC"]],
    });
    // Obtengo las brands con su logo
    let brandsFromDB = await db.Brand.findAll({
      include: ["files"],
    });
    brandsFromDB = getDeepCopy(brandsFromDB);
    await getBrandsLogos(brandsFromDB);
    return res.render("productList", { dropsFromDB, brandsFromDB });
  },
  dropList: async (req, res) => {
    let {id} = req.params;
    if(!id)return res.redirect('/tienda')
    // Los pido asi porque unicamente son para pintar los botones
    let dropFromDB = await db.Drop.findByPk(id, {
      include: ['files']
    });
    dropFromDB = getDeepCopy(dropFromDB);
    setDropLaunchDateString(dropFromDB)
    await getDropImages(dropFromDB)
    // return res.send(dropFromDB);
    return res.render("dropDetail", { dropFromDB });
  },
  cart: (req, res) => {
    return res.render("cart");
  },
  userVerification: (req, res) => {
    return res.render("userEmailVerify");
  },
  productDetail: async (req, res) => {
    try {
      let { id } = req.params;
      let productFromDB = await getProductsFromDB({ id, withImages: true });
      // return res.send(productFromDB);
      return res.render("productDetail", { sizes, productFromDB });
    } catch (error) {
      console.log("FALLE EN mainController.productDetail");
      return res.send(error);
    }
  },
  userProfile: (req, res) => {
    return res.render("userProfile");
  },
  aboutUs: async (req, res) => {
    try {
      return res.render("aboutUs");
    } catch (error) {
      console.log(`Error in about us: ${error}, redirecting...`);
      return res.redirect("/");
    }
  },
  faq: async (req, res) => {
    try {
      return res.render("faq");
    } catch (error) {
      console.log(`Error in faq: ${error}, redirecting...`);
      return res.redirect("/");
    }
  },
  contact: async (req, res) => {
    try {
      return res.render("contact");
    } catch (error) {
      console.log(`Error in contact: redirecting...`);
      console.log(error);
      return res.redirect("/");
    }
  },
  postOrder: (req, res) => {
    return res.render("postOrder");
  },
  completePayment: async (req, res) => {
    const queryParams = req.query;
    const { token, payment_id } = queryParams; // payment_id mercado pago, token para paypal
    if (!token && !payment_id) {
      console.log("Either the token or the payment id were not provided");
      return res.redirect("/cart");
    }

    let orderFromDb;
    let paymentResponse;
    const checkedPaymentId = token ?? payment_id;
    try {
      if (token) {
        orderFromDb = await getOneOrderFromDB({ entity_payment_id: token });
        if (!orderFromDb) {
          console.error("Orden no encontrada en la base de datos");
          return res.redirect("/cart");
        }
        paymentResponse = await capturePaypalPayment(token);
        if (!paymentResponse || !paymentResponse.status) {
          console.error(
            "Error inesperado en la captura de pago de PayPal",
            paymentResponse
          );

          return res.redirect(`/cancelar-orden?token=${checkedPaymentId}`);
        }
        if (paymentResponse.status === "COMPLETED") {
          let updatedStatus = orderFromDb.shipping_type_id == 1 ? 2 : 3;
          // ✅ Marcar la orden como pagada en tu base de datos
          await db.Order.update(
            {
              order_status_id: updatedStatus, //2 es pendiente de envio, 3 de recoleccion
            },
            {
              where: {
                id: orderFromDb.id,
              },
            }
          );
          orderFromDb.order_status_id = updatedStatus;
          // Envio el mail para el usuario y a nosotros
          await sendOrderMails(orderFromDb);
          return res.redirect(
            `/post-compra?orderId=${orderFromDb.tra_id}&shippingTypeId=${orderFromDb.shipping_type_id}`
          );
        } else {
          // ❌ Manejar error de pago
          res.redirect(`/cancelar-orden?token=${checkedPaymentId}`); //Redirijo para cancelar la orden
        }
      } else {
        const { preference_id } = queryParams;
        orderFromDb = await getOneOrderFromDB({
          entity_payment_id: preference_id,
        });
        if (!orderFromDb) {
          return res.redirect(`/cancelar-orden?token=${checkedPaymentId}`);
        }
        let updatedStatus = orderFromDb.shipping_type_id == 1 ? 2 : 3;
        paymentResponse = await captureMercadoPagoPayment(payment_id);
        if (!paymentResponse) {
          return res.redirect(`/cancelar-orden/${orderFromDb.id}`);
        }
        // ✅ Marcar la orden como pagada en tu base de datos
        await db.Order.update(
          {
            order_status_id: updatedStatus,
            entity_payment_id: payment_id,
          },
          {
            where: {
              id: orderFromDb.id,
            },
          }
        );
        orderFromDb.order_status_id = updatedStatus;
      }
      await sendOrderMails(orderFromDb);
      // Borro los temp items si es que viene usuario loggeado
      if (orderFromDb.user_id) {
        await db.TempCartItem.destroy({
          where: {
            user_id: orderFromDb.user_id,
          },
        });
      }
      return res.redirect(
        `/post-compra?orderId=${orderFromDb.tra_id}&shippingTypeId=${orderFromDb.shipping_type_id}`
      );
    } catch (error) {
      console.error("Error capturing entity payment payment:", error);
      console.error(error);
      return res.redirect(`/cancelar-orden?token=${token}`); //Redirijo para cancelar la orden
    }
  },
  cancelOrder: async (req, res) => {
    try {
      let { token, preference_id } = req.query;
      if (!token && !preference_id) return res.redirect("/");
      let entityPaymentID = token || preference_id;
      //PAYPAL
      const orderCreatedToDisable = await getOneOrderFromDB({
        entity_payment_id: entityPaymentID,
      });
      if (orderCreatedToDisable) {
        await disableCreatedOrder(orderCreatedToDisable.id);
      }
      return res.redirect("/");
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      console.error(error);
      return res.redirect("/");
    }
  },
  logout: (req, res) => {
    let pathToReturn = req.session.returnTo;
    clearUserSession(req,res)
    return res.redirect(`${pathToReturn}`);
  },
};

export default controller;
