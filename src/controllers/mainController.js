import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../database/models/index.js";
import getDeepCopy from "../utils/helpers/getDeepCopy.js";
import { getBrandsLogos } from "./api/apiBrandController.js";
import { getProductsFromDB } from "./api/apiProductController.js";
import sizes from "../utils/staticDB/sizes.js";
import {
  getDropImages,
  getDropsFromDB,
  setDropLaunchDateString,
} from "./api/apiDropController.js";
import clearUserSession from "../utils/helpers/clearUserSession.js";
import { disableCreatedOrder, getOneOrderFromDB, getOrdersFromDB } from "./api/apiOrderController.js";
import { captureMercadoPagoPayment } from "./api/apiPaymentController.js";
import sendOrderMails from "../utils/helpers/sendOrderMails.js";
import { markCouponAsUsed, unmarkCouponAsUsed } from "./api/apiCouponController.js";
import { clearUserCart } from "./api/apiCartController.js";
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
  brandProductList: async (req, res) => {
    let { brandId } = req.params;
    // Los pido asi porque unicamente son para pintar los botones
    let brandFromDB = await db.Brand.findByPk(brandId, {
      include: ["files"],
    });
    brandFromDB = getDeepCopy(brandFromDB);
    await getBrandsLogos([brandFromDB]);
    // return res.send([brandFromDB]);
    return res.render("brandProductList", { brandFromDB });
  },
  dropList: async (req, res) => {
    let { id } = req.params;
    if (!id) return res.redirect("/tienda");
    // Los pido asi porque unicamente son para pintar los botones
    let dropFromDB = await db.Drop.findByPk(id, {
      include: ["files"],
    });
    dropFromDB = getDeepCopy(dropFromDB);
    setDropLaunchDateString(dropFromDB);
    await getDropImages(dropFromDB);
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
    const { payment_id, preference_id } = req.query;
  
    if (!payment_id) {
      console.log("⚠️ No se proporcionó payment_id");
      return res.redirect("/cart");
    }
  
    let orderFromDb;
    try {
      console.log(`🔍 Buscando orden con preference_id: ${preference_id}`);
  
      orderFromDb = await getOneOrderFromDB({
        entity_payments_id: preference_id,
      });
  
      if (!orderFromDb) {
        console.warn("⚠️ No se encontró una orden con ese preference_id");
        return res.redirect(`/cancelar-orden?token=${payment_id}`);
      }
  
      console.log(`📦 Orden encontrada: ID ${orderFromDb.id}, estado actual: ${orderFromDb.order_statuses_id}`);
  
      // Evaluar el estado actual de la orden
      switch (orderFromDb.order_statuses_id) {
        case 5: // Pendiente de Pago → continuar con procesamiento
          console.log("✅ Orden pendiente de pago, se procede a capturar el pago");
          break;
  
        case 1:
        case 2:
        case 3:
        case 4:
          console.log("ℹ️ La orden ya fue procesada previamente. Redirigiendo a post-compra.");
          return res.redirect(
            `/post-compra?orderId=${orderFromDb.tra_id}&shippingTypeId=${orderFromDb.shipping_types_id}&paymentTypeId=${orderFromDb.payment_types_id}`
          );
  
        case 6:
        default:
          console.warn("❌ La orden está cancelada o en un estado inválido para procesar pago");
          return res.redirect("/cart");
      }
  
      console.log(`💰 Intentando capturar pago con Mercado Pago (payment_id: ${payment_id})`);
  
      const paymentResponse = await captureMercadoPagoPayment(payment_id);
  
      if (!paymentResponse || paymentResponse.status !== "approved") {
        console.error(`❌ Pago no aprobado. Estado recibido: ${paymentResponse?.status}`);
        return res.redirect(`/cancelar-orden/${orderFromDb.id}`);
      }
  
      console.log("✅ Pago aprobado por Mercado Pago");
      await markCouponAsUsed(orderFromDb);
      const updatedStatus = orderFromDb.shipping_types_id === 1 ? 2 : 3;
      console.log(`📦 Nuevo estado asignado a la orden: ${updatedStatus === 2 ? "Pendiente de envío" : "Pendiente de recolección"}`);
  
      await db.Order.update(
        {
          order_statuses_id: updatedStatus,
          entity_payments_id: payment_id,
        },
        {
          where: { id: orderFromDb.id },
        }
      );
  
      console.log(`📝 Orden actualizada en la base de datos con payment_id: ${payment_id}`);
  
      orderFromDb.order_statuses_id = updatedStatus;
  
      await sendOrderMails(orderFromDb);
      console.log("📧 Mails de confirmación enviados correctamente");
  
      if (orderFromDb.users_id) await clearUserCart(orderFromDb.users_id);
  
      console.log("➡️ Redirigiendo a post-compra");
      return res.redirect(
        `/post-compra?orderId=${orderFromDb.tra_id}&shippingTypeId=${orderFromDb.shipping_types_id}&paymentTypeId=${orderFromDb.payment_types_id}`
      );
    } catch (error) {
      console.error("❌ Error al capturar el pago:", error);
      return res.redirect(`/cancelar-orden?preference_id=${preference_id}`);
    }
  },  
  cancelOrder: async (req, res) => {
    try {
      console.log("📍 Entrando a cancelOrder con query:", req.query);
  
      let { preference_id } = req.query;
      if (!preference_id) return res.redirect("/");
  
      let entityPaymentID = preference_id;
  
      // PAYPAL
      const orderCreatedToDisable = await getOneOrderFromDB({
        entity_payments_id: entityPaymentID,
      });
  
      if (orderCreatedToDisable) {
        await disableCreatedOrder(orderCreatedToDisable.id);
        await unmarkCouponAsUsed(orderCreatedToDisable);
      }
  
      return res.redirect("/");
    } catch (error) {
      console.error("❌ Error capturing PayPal payment:", error);
      return res.redirect("/");
    }
  },  
  logout: (req, res) => {
    let pathToReturn = req.session.returnTo;
    clearUserSession(req, res);
    return res.redirect(`${pathToReturn}`);
  },
  dobleuso: (req, res) => {
    return res.render("dobleuso");
  },
};

export default controller;
