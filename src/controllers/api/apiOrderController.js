import db from "../../database/models/index.js";
// Librerias
import Sequelize from "sequelize";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { fileURLToPath } from "url";
// way to replace __dirname in es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// UTILS
import systemMessages from "../../utils/staticDB/systemMessages.js";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";

import countries from "../../utils/staticDB/countries.js";
import provinces from "../../utils/staticDB/provinces.js";
import sendCodesMail from "../../utils/helpers/sendverificationCodeMail.js";
import ordersStatuses from "../../utils/staticDB/ordersStatuses.js";
import {
  generateAddressObject,
  getAddresesFromDB,
  getUserAddressesFromDB,
  insertAddressToDB,
} from "./apiAddressController.js";

import { getProductsFromDB } from "./apiProductController.js";
import { getVariationsFromDB } from "./apiVariationsController.js";
import generateRandomNumber from "../../utils/helpers/generateRandomNumber.js";
import {
  generatePhoneObject,
  getPhonesFromDB,
  getUserPhonesFromDB,
  insertPhoneToDB,
} from "./apiPhoneController.js";
import { getMappedErrors } from "../../utils/helpers/getMappedErrors.js";
import currencies from "../../utils/staticDB/currencies.js";
import { paymentTypes } from "../../utils/staticDB/paymentTypes.js";
import { shippingTypes } from "../../utils/staticDB/shippingTypes.js";
import { handleCreateMercadoPagoOrder } from "./apiPaymentController.js";
import { MercadoPagoConfig } from "mercadopago";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import { deleteSensitiveUserData } from "./apiUserController.js";
import { getSettingsFromDB } from "./apiSettingController.js";
import sendOrderMails from "../../utils/helpers/sendOrderMails.js";
import { markCouponAsUsed, unmarkCouponAsUsed } from "./apiCouponController.js";
import { clearUserCart } from "./apiCartController.js";

// Agrega credenciales
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  // sandbox: !process.env.NODE_ENV == "production",
});
// ENV
const webTokenSecret = process.env.JSONWEBTOKEN_SECRET;

const controller = {
  getOrders: async (req, res) => {
    try {
      let { limit, offset, orders_id, userLoggedId } = req.query;
      limit = (limit && parseInt(limit)) || undefined;
      offset = (limit && parseInt(req.query.offset)) || 0;
      orders_id = orders_id || undefined;
      userLoggedId = userLoggedId || undefined;

      let ordersFromDB = await getOrdersFromDB({
        id: orders_id,
        limit,
        offset,
        users_id: userLoggedId,
      });

      // Mando la respuesta
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          path: "/api/order/",
          method: "GET",
        },
        ok: true,
        orders: ordersFromDB,
      });
    } catch (error) {
      console.log(`Falle en apiOrderController.getOrders`);
      console.log(error);
      return res.status(500).json({ error });
    }
  },
  createOrder: async (req, res) => {
    let orderDataToDB;
    try {
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        //Si hay errores en el back...
        //Para saber los parametros que llegaron..
        let { errorsParams, errorsMapped } = getMappedErrors(errors);

        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/order",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError.es,
        });
      }
      let {
        variations,
        users_id,
        first_name,
        last_name,
        email,
        dni,
        phoneObj,
        billingAddress,
        shippingAddress,
        payment_types_id,
        shipping_types_id,
        variationsFromDB, //Del middleware
        coupons_id,
      } = req.body;

      // Si esta logueado y no tenia los nros y direcciones armadas...
      if (!billingAddress.id && users_id) {
        let billingAddressObjToDB = generateAddressObject(billingAddress);
        billingAddressObjToDB.users_id = users_id; //Si hay usuario loggeado lo agrego a esta
        let createdAddress = await insertAddressToDB(billingAddressObjToDB);
        if (!createdAddress)
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
        billingAddress.id = billingAddressObjToDB.id; //lo dejo seteado asi despues puedo acceder
      } else if (billingAddress?.id) {
        //Si vino el id, busco la address y la dejo desde db porlas
        billingAddress = await getAddresesFromDB(billingAddress.id);
      }
      if (shipping_types_id == 1) {
        // Envío a domicilio
        if (shippingAddress && !shippingAddress?.id && users_id) {
          let shippingAddressObjToDB = generateAddressObject(shippingAddress);
          shippingAddressObjToDB.users_id = users_id; //Si hay usuario lo agrego a esta
          let createdAddress = await insertAddressToDB(shippingAddressObjToDB);
          if (!createdAddress)
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
          shippingAddress.id = shippingAddressObjToDB.id; //lo dejo seteado asi despues puedo acceder
        } else if (shippingAddress && shippingAddress?.id) {
          //Si vino el id, busco la address y la dejo desde db porlas
          shippingAddress = await getAddresesFromDB(shippingAddress.id);
        }
      }

      if (!phoneObj?.id && users_id) {
        let phoneObjToDB = generatePhoneObject({
          ...phoneObj,
          users_id: users_id,
        });
        let createdPhone = await insertPhoneToDB(phoneObjToDB);
        if (!createdPhone)
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      } else if (phoneObj?.id) {
        phoneObj = await getPhonesFromDB(phoneObj.id);
      }

      // Armo el objeto del pedido
      const randomString = generateRandomNumber(10);
      orderDataToDB = {
        id: uuidv4(),
        tra_id: randomString,
        users_id: users_id,
        first_name,
        last_name,
        email,
        dni,
        phoneObj, //{}
        billingAddress,
        shippingAddress,
        order_statuses_id: 5, //Aca es pendiente de pago
        shipping_types_id,
        payment_types_id,
      };
      createOrderEntitiesSnapshot(orderDataToDB); //Funcion que saca "foto" de las entidades

      // Tema total price
      let orderTotalPrice = 0;
      // armo los orderItems
      let orderItemsToDB = [];
      const settingsFromDB = await getSettingsFromDB();
      const dolarPrice =
        settingsFromDB.find((dbSetting) => dbSetting.setting_types_id == 1)
          ?.value || undefined;

      // Verifico cupón
      let coupon = null;
      if (coupons_id && users_id) {
        console.log(
          "🔎 Validando cupón:",
          coupons_id,
          "para usuario:",
          users_id
        );

        coupon = await db.Coupon.findOne({
          where: {
            id: coupons_id,
            expires_at: {
              [db.Sequelize.Op.or]: [
                null,
                { [db.Sequelize.Op.gt]: new Date() },
              ],
            },
          },
          include: {
            model: db.CouponUsage,
            as: "usages",
            where: { users_id },
            required: false,
          },
        });

        if (!coupon) {
          console.warn("❌ Cupón no encontrado o expirado");
          return res
            .status(400)
            .json({ ok: false, msg: "Cupón inválido o no aplicable" });
        }

        console.log("✅ Cupón encontrado:", coupon.code);
        console.log(
          "📊 Uso actual:",
          coupon.usage_count,
          "/",
          coupon.usage_limit
        );

        const usage = coupon?.usages[0];
        if (usage?.used_at) {
          console.warn("⚠️ El usuario ya usó este cupón:", usage.used_at);
          return res
            .status(400)
            .json({ ok: false, msg: "Este cupón ya fue utilizado" });
        }

        if (
          coupon.usage_limit !== null &&
          coupon.usage_count >= coupon.usage_limit
        ) {
          console.warn("⛔️ Cupón alcanzó su límite de usos");
          return res.status(400).json({ ok: false, msg: "Cupón agotado" });
        }

        console.log("🟢 Cupón válido y disponible para este usuario");
      }

      // Voy por las variaciones para restar stock
      variations.forEach((variation) => {
        // 1. Extraigo datos básicos de la variación del carrito
        let { quantityRequested, id } = variation;
      
        // 2. Busco la variación real desde DB (para validar stock y datos)
        const variationFromDB = variationsFromDB.find((v) => v.id == id);
        quantityRequested = parseInt(quantityRequested);
      
        // 3. Resto el stock disponible de la variación en DB
        variationFromDB.quantity -= quantityRequested;
      
        // 4. Preparo los datos del ítem de la orden
        const orderItemName = variationFromDB.product?.name;
        const orderItemQuantity = quantityRequested;
        const isDobleUso = variationFromDB.product?.is_dobleuso;
      
        // 5. Obtengo el precio base del producto en USD (sin descuento aplicado)
        const basePriceUSD = parseFloat(variationFromDB.product?.price);
        if (!basePriceUSD || isNaN(basePriceUSD)) {
          throw new Error(`Precio inválido para el producto ${orderItemName || "sin nombre"}`);
        }
      
        // 6. Aplico descuento del producto (si tiene)
        const productDiscountPercent = variationFromDB.product.discount || 0;
        let priceAfterProductDiscount = basePriceUSD;
        if (productDiscountPercent > 0) {
          priceAfterProductDiscount *= (1 - productDiscountPercent / 100);
        }
      
        // 7. Aplico descuento del cupón SOLO si el producto NO es dobleuso
        const couponDiscountPercent = coupon && !isDobleUso ? coupon.discount_percent : 0;
        let finalPriceUSD = priceAfterProductDiscount;
        if (couponDiscountPercent > 0) {
          finalPriceUSD *= (1 - couponDiscountPercent / 100);
        }
      
        // 8. Convierto el precio final a pesos y redondeo a 2 decimales
        const finalPrice = Math.round(finalPriceUSD * dolarPrice * 100) / 100;
      
        // 9. Armo el objeto del item para guardar en DB
        const orderItemData = {
          id: uuidv4(),
          order_id: orderDataToDB.id,
          variations_id: variationFromDB.id,
          name: orderItemName,
          price: finalPrice,
          quantity: orderItemQuantity,
          color: variationFromDB.color?.name,
          size: variationFromDB.size?.size,
          // Guardo los descuentos como snapshot
          discount: productDiscountPercent,
          coupon_discount: couponDiscountPercent,
          is_dobleuso: isDobleUso
        };
      
        // 10. Agrego el item al array para hacer bulkCreate más adelante
        orderItemsToDB.push(orderItemData);
      });
      
      //Aca ya reste a las variaciones el stock, mapeo y dejo solo id y stock para luego hacer el bulkupdate de eso nomas
      variationsFromDB = variationsFromDB.map((variationFromDB) => ({
        id: variationFromDB.id,
        quantity: variationFromDB.quantity,
      }));
      // Hasta aca ya arme todo. (BillingAddress - Order - OrderItem - ShippingAddress) ==> Tengo que insertar en la DB

      orderItemsToDB.forEach((item) => {
        orderTotalPrice += parseFloat(item.price) * parseInt(item.quantity);
      });
      // Dejo seteado el total
      orderDataToDB.total = orderTotalPrice;
      // Si tiene cupon entonces modifica el total
      if (coupon) {
        orderDataToDB.coupons_id = coupon.id; // <-- hago snapshot del cupon
        orderDataToDB.coupons_code = coupon.code; // <-- hago snapshot del cupon
        orderDataToDB.coupons_discount_percent = coupon.discount_percent; // <-- hago snapshot del cupon
      }

      // Hago los insert en la base de datos
      let orderCreated = await db.Order.create(
        {
          ...orderDataToDB,
          // Esto es para hacer un create dircetamente
          orderItems: orderItemsToDB,
        },
        {
          include: ["orderItems"],
        }
      );

      //Si la orden se creo ok, hago el bulkupdate de las variations
      variationsFromDB.length &&
        (await db.Variation.bulkCreate(variationsFromDB, {
          updateOnDuplicate: ["quantity"],
        }));

      // Aca genero el url de paypal o de mp dependiendo que paymentTypeVino
      let paymentURL, paymentOrderId;

      if (payment_types_id == 1) {
        // Pago con MP
        const mercadoPagoOrderResult = await handleCreateMercadoPagoOrder(
          orderItemsToDB,
          mpClient
        );
        // id es el id de la preferencia
        // init_point a donde hay que redirigir
        const { init_point, id } = mercadoPagoOrderResult;
        paymentURL = init_point;
        paymentOrderId = id;
        if (!paymentURL || !paymentOrderId)
          throw new Error("Could not generate mercado pago order");
        orderDataToDB.entity_payments_id = paymentOrderId;
        // Le actualizo el paypal_order_id en db
        await db.Order.update(
          { entity_payments_id: paymentOrderId },
          { where: { id: orderDataToDB.id } }
        );
      } else {
        // EFECTIVO || TRANSFERENCIA
        paymentOrderId = null;
        paymentURL = `/post-compra?orderId=${orderDataToDB.tra_id}&shippingTypeId=${orderDataToDB.shipping_types_id}&paymentTypeId=${orderDataToDB.payment_types_id}`;
        const orderToSendEmails = await getOrdersFromDB({
          id: orderDataToDB.id,
        });
        // Si tiene cupon, entonces aca ya se uso ==> Lo tildo como usado
        if (orderToSendEmails.coupons_id && users_id) {
          await markCouponAsUsed(orderToSendEmails);
        }
        await sendOrderMails(orderToSendEmails);
        console.log("📧 Mails de confirmación enviados correctamente");
        if (orderToSendEmails.users_id)
          await clearUserCart(orderToSendEmails.users_id);
      }

      // Mando la respuesta
      return res.status(200).json({
        meta: {
          status: 200,
        },
        ok: true,
        msg: systemMessages.orderMsg.create,
        //Si paga con tarjetas lo tengo que redirigir, sino le pongo false y termina ahi
        url: paymentURL,
        orderTraID: orderDataToDB.tra_id,
      });
    } catch (error) {
      console.log(`Falle en apiOrderController.createOrder`);
      console.log(error);
      // aca dio error, tengo que cancelar la compra si es que se creo
      const disableResponse = await disableCreatedOrder(orderDataToDB.id);
      // Intento desmarcar cupón si se había marcado como usado
      if (orderDataToDB?.coupons_id && orderDataToDB?.users_id) {
        const usage = await db.CouponUsage.findOne({
          where: {
            coupons_id: orderDataToDB.coupons_id,
            users_id: orderDataToDB.users_id,
            used_at: { [db.Sequelize.Op.ne]: null },
          },
        });

        if (usage) {
          await unmarkCouponAsUsed(orderDataToDB);
        }
      }
      return res.status(500).json({ error });
    }
  },
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        console.log("No order id provided to update");
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      }

      const {
        body: { order_statuses_id },
      } = req;

      const orderFromDB = await getOrdersFromDB({ id: orderId });
      if (!orderFromDB)
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
        });
      if (order_statuses_id == 6) {
        //La quiere anular
        const disableResponse = await disableCreatedOrder(orderId);
        // Desmarco el cupon que uso
        await unmarkCouponAsUsed(orderFromDB);
      } else {
        //Esto es para ver si estaba cancelada y ahora la quiere
        const wasCanceled = orderFromDB.order_statuses_id == 6;
        let stockWasDiscounted = true;
        if (wasCanceled) {
          stockWasDiscounted = await discountStockFromDB(orderFromDB); //Le saco los items de stock
        }
        if (!stockWasDiscounted)
          return res.status(HTTP_STATUS.CONFLICT.code).json({
            ok: false,
            msg: "No se puede modificar ya que no hay stocks de algunos productos",
          });
        //Aca es simplemente una modificacion
        await db.Order.update(
          { order_statuses_id },
          {
            where: {
              id: orderId,
            },
          }
        );
      }

      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
      });
    } catch (error) {
      console.log(`error in updateOrderStatus: ${error}`);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        data: null,
      });
    }
  },
  orderPaymentFailed: async (req, res) => {
    try {
      const { orderTraID } = req.params;
      if (!orderTraID) {
        console.log("No order id provided to update");
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      }
      const orderFromDB = await getOneOrderFromDB({ tra_id: orderTraID });
      if (!orderFromDB)
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
        });
      //Aca la anulo
      let responseObj = await checkOrderPaymentExpiration(orderFromDB);
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        orderWasCanceled: responseObj?.type == 1,
        orderWasFulfilled: responseObj?.type == 2,
        tra_id: orderFromDB.tra_id,
      });
    } catch (error) {
      console.log(`error in orderPaymentFailed: ${error}`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        data: null,
      });
    }
  },
};

export default controller;

let orderIncludeArray = [
  "user",
  {
    association: "orderItems",
    include: ["variation"],
  },
];

export async function getOrdersFromDB({ id, limit, offset, users_id }) {
  try {
    let orderToReturn, ordersToReturn;
    if (typeof id === "string") {
      orderToReturn = await db.Order.findByPk(id, {
        include: orderIncludeArray,
        order: [
          ["createdAt", "DESC"], // ASC para orden ascendente, DESC para descendente
        ],
      });
      if (!orderToReturn) return null;
      orderToReturn = orderToReturn && getDeepCopy(orderToReturn);
      setOrderKeysToReturn(orderToReturn);
      return orderToReturn;
    }
    // Condición si id es un array
    else if (Array.isArray(id)) {
      ordersToReturn = await db.Order.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: orderIncludeArray,
        order: [
          ["createdAt", "DESC"], // ASC para orden ascendente, DESC para descendente
        ],
      });
    } else if (users_id) {
      //Aca busco por ordenes de un user
      ordersToReturn = await db.Order.findAll({
        where: {
          users_id: users_id,
        },
        include: orderIncludeArray,
        order: [
          ["createdAt", "DESC"], // ASC para orden ascendente, DESC para descendente
        ],
      });
    }
    // Condición si id es undefined
    else if (id === undefined) {
      ordersToReturn = await db.Order.findAll({
        include: orderIncludeArray,
        order: [
          ["createdAt", "DESC"], // ASC para orden ascendente, DESC para descendente
        ],
      });
    }

    if (!ordersToReturn || !ordersToReturn.length) return [];
    ordersToReturn = getDeepCopy(ordersToReturn);
    ordersToReturn?.forEach((orderToReturn) => {
      setOrderKeysToReturn(orderToReturn);
    });

    return ordersToReturn;
  } catch (error) {
    console.log(`Falle en getOrders`);
    return console.log(error);
  }
}
export async function getOneOrderFromDB(searchCriteria) {
  try {
    if (!searchCriteria || Object.keys(searchCriteria).length === 0)
      return null;

    let orderToReturn = await db.Order.findOne({
      where: searchCriteria, // Permite búsqueda dinámica
      include: orderIncludeArray,
    });

    if (!orderToReturn) return null;

    orderToReturn = getDeepCopy(orderToReturn);
    setOrderKeysToReturn(orderToReturn);

    return orderToReturn;
  } catch (error) {
    console.error(`Falle en getOrderFromDB:`, error);
    console.error(error);
    return null; // No retornar console.log, sino null
  }
}

//Esta funcion toma el objeto y le hace una "foto" de las entidades que luego pueden cambiar
//En db necesitamos almacenar los datos que perduren, ej si se cambia la address tiene que
//salir la misma que se compro no puede salir la actualizada, mismo con nombre de item,phone,etc
function createOrderEntitiesSnapshot(obj) {
  let { billingAddress, shippingAddress, phoneObj, shipping_types_id } = obj;
  let billingAddressProvinceName = provinces?.find(
    (dbProvince) => dbProvince.id == billingAddress.provinces_id
  )?.name;
  let shippingAddressProvinceName =
    shipping_types_id == 1
      ? provinces?.find(
          (dbProvince) => dbProvince.id == shippingAddress?.provinces_id
        )?.name
      : null;
  //Creo el snapshot de billingAddress
  obj.billing_address_street = billingAddress.street || "";
  obj.billing_address_detail = billingAddress.detail || "";
  obj.billing_address_city = billingAddress.city || "";
  obj.billing_address_province = billingAddressProvinceName || "";
  obj.billing_address_zip_code = billingAddress.zip_code || "";
  obj.billing_address_label = billingAddress.label || "";
  //Mismo con shippingAddress
  const shippingAddressNotRequired = shipping_types_id == 2; //Retiro por local
  obj.shipping_address_street = shippingAddressNotRequired
    ? null
    : shippingAddress.street || "";
  obj.shipping_address_detail = shippingAddressNotRequired
    ? null
    : shippingAddress.detail || "";
  obj.shipping_address_city = shippingAddressNotRequired
    ? null
    : shippingAddress.city || "";
  obj.shipping_address_province = shippingAddressNotRequired
    ? null
    : shippingAddressProvinceName || "";
  obj.shipping_address_zip_code = shippingAddressNotRequired
    ? null
    : shippingAddress.zip_code || "";
  obj.shipping_address_label = shippingAddressNotRequired
    ? null
    : shippingAddress.label || "";
  //Ahora creo el de phone
  let phoneCode = countries?.find(
    (count) => count.id == phoneObj.countries_id
  )?.code;
  obj.phone_code = phoneCode;
  obj.phone_number = phoneObj.phone_number;
  // Eliminar las propiedades que mande
  delete obj.billingAddress;
  delete obj.shippingAddress;
  delete obj.phoneObj;
}

function setOrderKeysToReturn(order) {
  order.orderStatus = ordersStatuses.find(
    (status) => status.id == order.order_statuses_id
  );
  order.paymentType = paymentTypes.find(
    (payType) => payType.id == order.payment_types_id
  );
  order.shippingType = shippingTypes.find(
    (shipType) => shipType.id == order.shipping_types_id
  );

  order.orderItemsPurchased = order.orderItems.reduce((acum, item) => {
    return acum + item.quantity;
  }, 0);
  order.orderItemsPurchasedPrice = order.orderItems.reduce((acum, item) => {
    return acum + parseInt(item.quantity) * parseFloat(item.price || 0);
  }, 0);
  order.shippingCost = parseFloat(order.total) - order.orderItemsPurchasedPrice;
  deleteSensitiveUserData(order.user);
}

const restoreStock = async (dbOrder) => {
  try {
    if (dbOrder.orderItems && dbOrder.orderItems.length > 0) {
      const OrderItemsToRestore = dbOrder.orderItems.map((orderItem) => ({
        id: orderItem.variations_id,
        quantity: orderItem.quantity,
      }));
      for (const item of OrderItemsToRestore) {
        await db.Variation.increment("quantity", {
          by: item.quantity, // Aumenta el stock en x
          where: { id: item.id }, // Filtra por el ID del producto
        });
      }
      console.log("Stock restaurado correctamente");
    }
  } catch (error) {
    console.error("Error restaurando stock:", error);
  }
};
export const discountStockFromDB = async (dbOrder) => {
  try {
    if (dbOrder.orderItems && dbOrder.orderItems.length > 0) {
      const orderItemsToRestore = dbOrder.orderItems.map((orderItem) => ({
        id: orderItem.variations_id,
        quantity: orderItem.quantity,
      }));

      let variationsToFetch = orderItemsToRestore.map(
        (variation) => variation.id
      );
      let variationsFromDB = await getVariationsFromDB(variationsToFetch);

      // Verificar si todos los productos tienen stock suficiente
      const canDiscountAll = orderItemsToRestore.every((item) => {
        const variation = variationsFromDB.find((v) => v.id === item.id);
        return variation && variation.quantity >= item.quantity;
      });

      if (!canDiscountAll) {
        console.error("Stock insuficiente para uno o más productos.");
        return false;
      }

      // Descontar stock
      for (const item of orderItemsToRestore) {
        await db.Variation.decrement("quantity", {
          by: item.quantity, // Resta el stock
          where: { id: item.id }, // Filtra por el ID del producto
        });
      }

      console.log("Stock descontado correctamente");
      return true;
    }
  } catch (error) {
    console.error("Error descontando stock:", error);
  }
};

export async function disableCreatedOrder(orderID) {
  try {
    let orderFromDB = await getOrdersFromDB({ id: orderID });
    if (!orderFromDB || orderFromDB.order_statuses_id == 6) return false;
    //La deshabilito
    await db.Order.update(
      {
        order_statuses_id: 6,
      },
      {
        where: {
          id: orderID,
        },
      }
    );

    await restoreStock(orderFromDB);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function checkOrderPaymentExpiration(order) {
  // Suponiendo que order.createdAt es una cadena de fecha en formato ISO
  const createdAt = new Date(order.createdAt);
  const now = new Date();

  // Calcular la diferencia en minutos
  const diffMinutes = (now - createdAt) / (1000 * 60);

  // Si han pasado más de 20 minutos, deshabilitar la orden
  if (diffMinutes > 20) {
    await disableCreatedOrder(order.id);
    return { type: 1 }; //1 es para cancelacion
  }
  return false;
}
