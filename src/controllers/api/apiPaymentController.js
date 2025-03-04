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
import axios from "axios";
import { log } from "console";
import { Preference } from "mercadopago";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
// way to replace __dirname in es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const controller = {};

export default controller;

async function generatePaypalAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
    method: "POST",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET_ID,
    },
  });
  return response.data.access_token;
}

export async function createPaypalOrder(order) {
  const accessToken = await generatePaypalAccessToken();
  let itemsTotal = 0;
  const itemsArray = order.orderItemsToDb?.map((orderItem) => {
    itemsTotal += parseFloat(orderItem.price) * parseInt(orderItem.quantity);
    return {
      name: orderItem.eng_name,
      description: "",
      unit_amount: {
        currency_code: "USD",
        value: parseFloat(orderItem.price) /* Valor unitario*/,
      },
      quantity: orderItem.quantity,
      category: "",
      sku: orderItem.sku,
    };
  });

  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          items: itemsArray,
          amount: {
            currency_code: "USD",
            value: order.total, //Total de compra
            breakdown: {
              item_total: { currency_code: "USD", value: itemsTotal }, //Solo productos
              shipping: { currency_code: "USD", value:  (order.total - itemsTotal)}, //Solo shipping
            },
          },
        },
      ],
      application_context: {
        return_url: process.env.BASE_URL + "/completar-pago",
        cancel_url: process.env.BASE_URL + "/cancelar-orden",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "neotango",
      },
    }),
  });
  return (
    response?.data?.links?.find((link) => link.rel === "approve")?.href ||
    undefined
  );
}

export async function capturePaypalPayment(paypalOrderId) {
  const accessToken = await generatePaypalAccessToken();
  const response = await axios({
    url:
      process.env.PAYPAL_BASE_URL +
      `/v2/checkout/orders/${paypalOrderId}/capture`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export function getTokenFromUrl(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams.get("token"); // Obtiene el valor del parámetro 'token'
}

export async function handleCreateMercadoPagoOrder(orderItemsToDb, mpClient) {
  try {
    let body = {
      items: [],
      back_urls: {
        success: process.env.BASE_URL + '/completar-pago',
        failure: process.env.BASE_URL + '/cancelar-orden',
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }, // Eliminar pagos en efectivo
          { id: "atm" }, // Eliminar pagos por transferencias
        ],
      },
    };
    orderItemsToDb.forEach((item) => {
      const mercadoPagoItemObject = {
        title: item.es_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        currency_id: "ARS",
      };
      body.items.push(mercadoPagoItemObject);
    });
    const preference = new Preference(mpClient);
    const result = await preference.create({ body });
    return result;
  } catch (error) {
    console.log("error in mercadopago create");
    console.log(error);
  }
}

export async function captureMercadoPagoPayment(paymentId){
  try {
    const paymentResponseData = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    })
    console.log('payment mercadopago')
    console.log(paymentResponseData.data)
    return paymentResponseData.data;
  } catch (error) {
    console.log(`Error in captureMercadoPagoPayment`)
    console.log(error);
    return null;
  }
}