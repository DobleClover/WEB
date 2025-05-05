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
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";

import { getMappedErrors } from "../../utils/helpers/getMappedErrors.js";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import minDecimalPlaces from "../../utils/helpers/minDecimalPlaces.js";

// ENV

const controller = {
  getSettings: async (req, res) => {
    try {
      let { settings_id } = req.query;
      settings_id = settings_id || undefined;
      let settingsFromDB = await getSettingsFromDB(settings_id);

      // Mando la respuesta
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          path: "/api/setting/",
          method: "GET",
        },
        ok: true,
        data: settingsFromDB,
      });
    } catch (error) {
      console.log(`Falle en apiSettingController.getSettings`);
      console.log(error);
      return res.status(500).json({ error });
    }
  },
  updateSetting: async (req, res) => {
    try {
      // Traigo errores
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/setting",
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
      const dbSetting = await getSettingsFromDB(id);
      if (!dbSetting) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Moneda no encontrada",
        });
      }
      // let settingObjToDB = generateSettingObject(req.body);
      // settingObjToDB.id = id;
      let { value } = req.body;
      await updateSettingFromDB({ value }, id);
      console.log("🟢 setting actualizado con éxito:") ;

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/setting",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.settingMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiSettingController.updateSetting`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroySetting: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      const dbSetting = await getSettingsFromDB(id);
      if (!dbSetting) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "setting no encontrado",
        });
      }
      // Lo borro de db
      let response = await destroySettingFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();

      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/setting",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.settingMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiSettingController.destroySetting`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
};

export default controller;

let settingIncludeArray = [];

export async function insertSettingToDB(obj) {
  try {
    //Lo creo en db
    let createdSetting = await db.Setting.create(obj);
    return createdSetting || undefined;
  } catch (error) {
    console.log(`Falle en insertSettingToDB`);
    console.log(error);
    return undefined;
  }
}
export async function updateSettingFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.Setting.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateSettingFromDB`);
    console.log(error);
    return undefined;
  }
}
export async function destroySettingFromDB(id) {
  try {
    if (!id) return undefined;

    //Lo borro de db
    await db.Setting.destroy({
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en destroySettingFromDB`);
    console.log(error);
    return undefined;
  }
}

export async function getSettingsFromDB(id = undefined) {
  try {
    let settingsToReturn, settingToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      settingToReturn = await db.Setting.findByPk(id, {
        include: settingIncludeArray,
      });
      if (!settingToReturn) return null;
      settingToReturn = settingToReturn && getDeepCopy(settingToReturn);
      await setSettingKeysToReturn(settingToReturn);
      return settingToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      settingsToReturn = await db.Setting.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: settingIncludeArray,
      });
      if (!settingsToReturn || !settingsToReturn.length) return null;
      settingsToReturn = getDeepCopy(settingsToReturn);
    }
    // Condición si id es undefined
    else {
      settingsToReturn = await db.Setting.findAll({
        include: settingIncludeArray,
      });
      if (!settingsToReturn || !settingsToReturn.length) return null;
      settingsToReturn = getDeepCopy(settingsToReturn);
    }
    for (let i = 0; i < settingsToReturn.length; i++) {
      const setting = settingsToReturn[i];
      setSettingKeysToReturn(setting);
    }
    return settingsToReturn;
  } catch (error) {
    console.log("Falle en getSettingsFromDB");
    console.error(error);
    return null;
  }
}

async function setSettingKeysToReturn(setting) {
  setting.value = minDecimalPlaces(parseFloat(setting.value));
  return;
}

function generateSettingObject(obj) {
  // objeto para armar la address
  let { name, price, setting } = obj;

  let dataToDB = {
    id: uuidv4(),
    name: name.trim(),
    price: parseFloat(price),
    setting: setting.trim(),
  };
  return dataToDB;
}
