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



export function getTokenFromUrl(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams.get("token"); // Obtiene el valor del parámetro 'token'
}

export async function handleCreateMercadoPagoOrder(orderItemsToDb, mpClient, discount_percent = 0) {
  try {
    let body = {
      items: [],
      back_urls: {
        success: process.env.BASE_URL + 'completar-pago',
        failure: process.env.BASE_URL + 'cancelar-orden',
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
      const originalPrice = Number(item.price);
      const discountedPrice = discount_percent > 0
        ? Number((originalPrice * (1 - discount_percent / 100)).toFixed(2))
        : originalPrice;
      const mercadoPagoItemObject = {
        title: item.name,
        quantity: Number(item.quantity),
        unit_price: discountedPrice,
        // currency_id: "ARS",
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