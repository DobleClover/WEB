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

// ENV

const controller = {
  getDrops: async (req, res) => {
    try {
      let { drops_id } = req.query;
      drops_id = drops_id || undefined;

      let dropsFromDB = await getDropsFromDB(drops_id);

      // Mando la respuesta
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          path: "/api/color/",
          method: "GET",
        },
        ok: true,
        colors: dropsFromDB,
      });
    } catch (error) {
      console.log(`Falle en apiColorController.getColors`);
      console.log(error);
      return res.status(500).json({ error });
    }
  },
  createColor: async (req, res) => {
    try {
      console.log(req.body);
      
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/color",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let colorObjToDB = generateDropObject(req.body);
      // Si llega por default entonces actualizo todas las otras
      let createdColor = await insertDropToDB(colorObjToDB);

      if (!createdColor)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/color",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.colorMsg.createSuccesfull,
        color: createdColor,
      });
    } catch (error) {
      console.log(`Falle en apiColorController.createColor`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updateColor: async (req, res) => {
    try {
      // Traigo errores
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/color",
            method: "PUT",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let colorObjToDB = generateDropObject(req.body);

      await updateDropFromDB(colorObjToDB, colorObjToDB.id);

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/color",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.colorMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateColor`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyColor: async (req, res) => {
    try {
      let { id } = req.body;
      // Lo borro de db
      let response = await destroyDropFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/color",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.colorMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiAddressController.destroyColor`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
};

export default controller;

let dropIncludeArray = ["products"];
export async function insertDropToDB(obj) {
  try {
    //Lo creo en db
    let createdDrop = await db.Drop.create(obj);
    return createdDrop || undefined;
  } catch (error) {
    console.log(`Falle en insertDropToDB`);
    console.log(error);
    return undefined;
  }
}
export async function updateDropFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.Drop.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateDropFromDB`);
    console.log(error);
    return undefined;
  }
}
export async function destroyDropFromDB(id) {
  try {
    if (!id) return undefined;

    //Lo borro de db
    await db.Drop.destroy({
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en destroyDropFromDB`);
    console.log(error);
    return undefined;
  }
}

export function generateDropObject(obj) {
  // objeto para armar la address
  let { id, name, active, unique } = obj;

  let dataToDB = {
    id: id ? id : uuidv4(),
    name: name.trim().toLowerCase(),
    active: active || false,
    unique: unique || false,
  };
  return dataToDB;
}

export async function getDropsFromDB(id = undefined) {
  try {
    let colorsToReturn, colorToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      colorToReturn = await db.Drop.findByPk(id, {
        include: dropIncludeArray,
      });
      if (!colorToReturn) return null;
      colorToReturn = colorToReturn && getDeepCopy(colorToReturn);
      setDropKeysToReturn(colorToReturn);
      return colorToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      colorsToReturn = await db.Drop.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: dropIncludeArray,
      });
      if (!colorsToReturn || !colorsToReturn.length) return null;
      colorsToReturn = getDeepCopy(colorsToReturn);
    }
    // Condición si id es undefined
    else {
      colorsToReturn = await db.Drop.findAll({
        include: dropIncludeArray,
      });
      if (!colorsToReturn || !colorsToReturn.length) return null;
      colorsToReturn = getDeepCopy(colorsToReturn);
    }
    colorToReturn?.forEach((color) => setDropKeysToReturn(color));
    return colorsToReturn;
  } catch (error) {
    console.log("Falle en getColorsFromDB");
    console.error(error);
    return null;
  }
}

function setDropKeysToReturn(drop) {
//   drop.name = capitalizeFirstLetterOfEachWord(drop.name, true);
}
