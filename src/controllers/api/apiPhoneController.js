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
import countries from "../../utils/staticDB/countries.js";

// ENV

const controller = {
  createPhone: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/phone",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let phoneObjToDB = generatePhoneObject(req.body);

      if (phoneObjToDB.default) {
        await db.Phone.update(
          {
            default: 0,
          },
          {
            where: {
              users_id: phoneObjToDB.users_id,
            },
          }
        );
      }
      let createdPhone = getDeepCopy(await insertPhoneToDB(phoneObjToDB));

      if (!createdPhone)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: systemMessages.phoneMsg.createFailed });
      createdPhone.country = countries.find(
        (country) => country.id == createdPhone.countries_id
      );
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/phone",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.phoneMsg.createSuccesfull,
        phone: createdPhone,
      });
    } catch (error) {
      console.log(`Falle en apiPhoneController.createPhone`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updatePhone: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Traigo errores
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/user",
            method: "PUT",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      // Datos del body
      let phoneObjToDB = generatePhoneObject(req.body);
      phoneObjToDB.id = id;
      if (phoneObjToDB.default) {
        await db.Phone.update(
          {
            default: 0,
          },
          {
            where: {
              users_id: phoneObjToDB.users_id,
            },
          }
        );
      }

      await updatePhoneFromDB(phoneObjToDB, phoneObjToDB.id);
      let updatedPhone = await getPhonesFromDB(phoneObjToDB.id);
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/phone",
          method: "PUT",
          redirect: "/user/phone",
        },
        ok: true,
        msg: systemMessages.phoneMsg.updateSuccesfull,
        updatedPhone,
      });
    } catch (error) {
      console.log(`Falle en apiPhoneController.updatePhone`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyPhone: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      // Lo borro de db
      let response = destroyPhoneFromDB(id);
      if (!response)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: systemMessages.phoneMsg.destroyFailed });
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/phone",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.phoneMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiPhoneController.destroyPhone`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
};

export default controller;

let phoneIncludeArray = ["user"];
export async function insertPhoneToDB(obj) {
  try {
    //Lo creo en db
    let createdPhone = await db.Phone.create(obj);
    return createdPhone || undefined;
  } catch (error) {
    console.log(`Falle en insertPhoneToDB`);
    console.log(error);
    return undefined;
  }
}
export async function updatePhoneFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.Phone.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updatePhoneToDB`);
    console.log(error);
    return undefined;
  }
}
export async function destroyPhoneFromDB(id) {
  try {
    if (!id) return undefined;

    //Lo borro de db
    await db.Phone.destroy({
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updatePhoneToDB`);
    console.log(error);
    return undefined;
  }
}
export async function getUserPhonesFromDB(id = undefined) {
  try {
    if (!id) return [];
    let phones = await db.Phone.findAll({
      where: {
        users_id: id,
      },
      include: phoneIncludeArray,
    });
    phones = getDeepCopy(phones);
    phones.forEach((phone) => setPhoneKeysToReturn(phone));
    return phones;
  } catch (error) {
    console.log(`Falle en getUserPhonesFromDB`);
    console.log(error);
    return [];
  }
}

export function generatePhoneObject(phone) {
  // objeto para armar la phone
  let { users_id, countries_id, phone_number, defaultPhone } = phone;

  let dataToDB = {
    id: uuidv4(),
    users_id,
    countries_id,
    phone_number,
    default: defaultPhone,
  };
  return dataToDB;
}

export async function getPhonesFromDB(id = undefined) {
  try {
    let phoneToReturn, phonesToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      phoneToReturn = await db.Phone.findByPk(id, {
        include: phoneIncludeArray,
      });
      if (!phoneToReturn) return null;
      phoneToReturn = phoneToReturn && getDeepCopy(phoneToReturn);
      setPhoneKeysToReturn(phoneToReturn);
      return phoneToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      phonesToReturn = await db.Phone.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: phoneIncludeArray,
      });
      if (!phonesToReturn || !phonesToReturn.length) return null;
      phonesToReturn = getDeepCopy(phonesToReturn);
    }

    // Condición si id es undefined
    else if (id === undefined) {
      phonesToReturn = await db.Phone.findAll({
        include: phoneIncludeArray,
      });
      if (!phonesToReturn || !phonesToReturn.length) return null;
      phonesToReturn = getDeepCopy(phonesToReturn);
    }
    phonesToReturn.forEach((phone) => setPhoneKeysToReturn(phone));
    return phonesToReturn;
  } catch (error) {
    console.log("Falle en getPhonesFromDB");
    console.error(error);
    return null;
  }
}

function setPhoneKeysToReturn(phone) {
  deleteSensitiveUserData(phone.user);
  phone.country = countries.find(
    (dbCountry) => dbCountry.id == phone.countries_id
  );
}
