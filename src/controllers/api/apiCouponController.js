import db from "../../database/models/index.js";
// Librerias
import Sequelize from "sequelize";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validationResult } from "express-validator";
// way to replace __dirname in es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// UTILS
import systemMessages from "../../utils/staticDB/systemMessages.js";
import capitalizeFirstLetterOfEachWord from "../../utils/helpers/capitalizeFirstLetterOfString.js";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";

import provinces from "../../utils/staticDB/provinces.js";

import { getMappedErrors } from "../../utils/helpers/getMappedErrors.js";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import { deleteSensitiveUserData } from "./apiUserController.js";
import couponPrefix from "../../utils/staticDB/couponPrefix.js";


// ENV

const controller = {
  getUserCoupons: async (req, res) => {
    try {
      const { users_id } = req.query;
  
      if (!users_id) {
        return res.status(400).json({ ok: false, msg: "Falta users_id" });
      }
  
      const reservedCoupons = await db.CouponUsage.findAll({
        where: {
          users_id: users_id,
          used_at: null, // si querés incluir los usados, podés quitar esto
        },
        include: ["coupon"],
      });
  
      const data = reservedCoupons.map((entry) => ({
        id: entry.coupon.id,
        code: entry.coupon.code,
        discount_percent: entry.coupon.discount_percent,
      }));
  
      return res.status(200).json({ ok: true, data });
    } catch (err) {
      console.log("Error in getUserCoupons:", err);
      return res
        .status(500)
        .json({ ok: false, msg: "Error interno del servidor" });
    }
  },  
  getCoupons: async (req, res) => {
    try {
      const coupons = await db.Coupon.findAll({
        order: [["createdAt", "DESC"]],
        include: ['usages']
      });

      res.status(200).json({
        ok: true,
        data: coupons
      });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  validateCouponCode: async (req, res) => {
    try {
      const { code, users_id } = req.query;

      if (!code || !users_id) {
        let msgToReturn = "Faltan parámetros";
        if(!users_id) msgToReturn = "Debes estar registrado para utilizar cupones";
        return res.status(400).json({ ok: false, msg: msgToReturn });
      }

      const coupon = await db.Coupon.findOne({
        where: {
          code: code.toUpperCase().trim(),
          expires_at: {
            [db.Sequelize.Op.or]: [null, { [db.Sequelize.Op.gt]: new Date() }],
          },
        },
      });

      if (!coupon) {
        return res
          .status(404)
          .json({ ok: false, msg: "Cupón no válido o expirado" });
      }
      //Si ya se uso mas veces de lo que se establecio
      if (
        coupon.usage_limit !== null &&
        coupon.usage_count >= coupon.usage_limit
      ) {
        return res
          .status(400)
          .json({ ok: false, msg: "Este cupón ya alcanzó su límite de uso" });
      }
      // Si el usuario ya lo uso
      const usage = await db.CouponUsage.findOne({
        where: {
          coupons_id: coupon.id,
          users_id: users_id,
        },
      });

      if (usage && usage.used_at) {
        return res.status(400).json({ ok: false, msg: "Ya usaste este cupón" });
      }

      // Si es para primera compra y el usuario ya hizo una, podrías validar eso acá si querés
      // const hasPreviousOrders = await db.Order.count({ where: { users_id: userId } });

      return res.status(200).json({
        ok: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          discount_percent: coupon.discount_percent,
        },
      });
    } catch (err) {
      console.log("Error in validateCouponCode:", err);
      return res
        .status(500)
        .json({ ok: false, msg: "Error interno del servidor" });
    }
  },
  createCoupon: async (req, res) => {
    try {
      const {
        discount_percent,
        prefix_id,
        prefix,
        expires_at,
        usage_limit,
      } = req.body;

      if (!discount_percent) {
        return res.status(400).json({
          ok: false,
          msg: "Falta el campo obligatorio: discount_percent",
        });
      }
      const prefixFromDB = couponPrefix.find(pref=>pref.id == prefix_id)?.name || prefix;
      const code = await generateCouponCode({ prefix: prefixFromDB });

      const newCoupon = await db.Coupon.create({
        id: uuidv4(),
        code,
        discount_percent: parseFloat(discount_percent),
        expires_at: expires_at || null,
        usage_limit: usage_limit || null,
        created_by_admin: true,
        is_first_purchase_only: false,
      });
      const couponToReturn = await db.Coupon.findByPk(newCoupon.id,{
        include: ['usages']
      });
      return res.status(201).json({
        ok: true,
        msg: "Cupón creado correctamente",
        coupon: couponToReturn,
      });
    } catch (error) {
      console.error("❌ Error al crear cupón:", error);
      return res
        .status(500)
        .json({ ok: false, msg: "Error interno del servidor" });
    }
  },
  destroyCoupon: async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({ ok: false });
      }
  
      const response = await destroyCouponFromDB(id);
  
      if (!response) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      }
  
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/coupon",
          method: "DELETE",
        },
        ok: true,
        msg: "Cupón eliminado correctamente", // podés usar systemMessages si tenés
        redirect: "/",
      });
    } catch (error) {
      console.log("Fallo en apiCouponController.destroyCoupon");
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  }
  
};

export default controller;

export async function generateCouponCode({
  prefix = "",
  length = 6,
  maxAttempts = 5,
}) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const fullCode = prefix + code;

    const existing = await db.Coupon.findOne({
      where: { code: fullCode },
    });

    if (!existing) {
      return fullCode;
    }
  }

  throw new Error(
    "No se pudo generar un código único de cupón después de varios intentos."
  );
}

export async function createWelcomeCoupon(userId) {
  const code = await generateCouponCode({ prefix: "WELCOME-" });

  // Crear el cupón
  const newCoupon = await db.Coupon.create({
    id: uuidv4(),
    code,
    discount_percent: 15, // Ajustá si querés otro valor
    is_first_purchase_only: true,
    created_by_admin: false,
    usage_limit: 1,
  });

  // Reservar cupón para el usuario, sin marcarlo como usado aún
  await db.CouponUsage.create({
    id: uuidv4(),
    coupons_id: newCoupon.id,
    users_id: userId,
    used_at: null,
  });

  return newCoupon;
}

export async function markCouponAsUsed(order) {
  const { coupons_id, users_id } = order;

  if (!coupons_id || !users_id) return;

  await db.CouponUsage.update(
    { used_at: new Date() },
    {
      where: {
        coupons_id,
        users_id,
      },
    }
  );

  await db.Coupon.increment("usage_count", {
    where: { id: coupons_id },
  });

  console.log(
    `🎟️ Cupón ${coupons_id} marcado como usado por el usuario ${users_id}`
  );
}

export async function unmarkCouponAsUsed(order) {
  const { coupons_id, users_id } = order;

  if (!coupons_id || !users_id) return;

  await db.CouponUsage.update(
    { used_at: null },
    {
      where: {
        coupons_id,
        users_id,
      },
    }
  );

  await db.Coupon.decrement("usage_count", {
    where: {
      id: coupons_id,
      usage_count: { [db.Sequelize.Op.gt]: 0 }, // solo si es mayor a 0
    },
  });

  console.log(
    `↩️ Cupón ${coupons_id} desmarcado como usado para el usuario ${users_id}`
  );
}


async function destroyCouponFromDB(id) {
  const deleted = await db.Coupon.destroy({ where: { id } });
  return deleted > 0;
}

