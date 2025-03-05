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
import { uploadFilesToAWS } from "../../utils/helpers/awsHandler.js";
import { insertFilesInDB } from "../../utils/helpers/filesHandler.js";
import entityTypes from "../../utils/staticDB/entityTypes.js";
import sections from "../../utils/staticDB/sections.js";
import getFileType from "../../utils/helpers/getFileType.js";

const DROPS_FOLDER_NAME = "drops";
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
          path: "/api/drop/",
          method: "GET",
        },
        ok: true,
        drops: dropsFromDB,
      });
    } catch (error) {
      console.log(`Falle en apiDropController.getDrops`);
      console.log(error);
      return res.status(500).json({ error });
    }
  },
  createDrop: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/dorp",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let dropObjToDB = generateDropObject(req.body);

      let createdDrop = await insertDropToDB(dropObjToDB);

      if (!createdDrop)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });

      // Ahora agarro los productos que relaciono
      let { products_id } = req.body;
      let relationsToPush = products_id.map((prodID) => ({
        products_id: prodID,
        drop_id: createdDrop.id,
      }));
      relationsToPush.length &&
        (await db.Product_Drop.bulkCreate(relationsToPush));
      // Ahora, si cargo fotos...
      let { files } = req;
      let { filesFromArray } = req.body; //Esto es lo que me llega por body
      if (files && files.length) {
        files?.forEach((multerFile) => {
          const fileFromFilesArrayFiltered = filesFromArray.find(
            (arrFile) => arrFile.filename == multerFile.originalname
          );
          multerFile.file_types_id = getFileType(multerFile);
          multerFile.file_roles_id = fileFromFilesArrayFiltered.file_roles_id;
        });
        const objectToUpload = {
          files,
          folderName: DROPS_FOLDER_NAME,
          sections_id: sections.DROP.id, //Drop
        };
        const filesToInsertInDb = await uploadFilesToAWS(objectToUpload);
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: createFailed,
          });
        }
        const isInsertingFilesSuccessful = await insertFilesInDB({
          files: filesToInsertInDb,
          entities_id: createdDrop.id,
          entity_types_id: entityTypes.DROP
        });
        if (!isInsertingFilesSuccessful) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: systemMessages.dropMsg.createFailed,
          });
        }
      }

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/drop",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.dropMsg.createSuccesfull,
        drop: createdDrop,
      });
    } catch (error) {
      console.log(`Falle en apiColorController.createDrop`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updateDrop: async (req, res) => {
    try {
      // Traigo errores
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/drop",
            method: "PUT",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let dropObjToDB = generateDropObject(req.body);

      await updateDropFromDB(dropObjToDB, dropObjToDB.id);

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/drop",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.dropMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateDrop`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyDrop: async (req, res) => {
    try {
      let { id } = req.body;
      // Lo borro de db
      let response = await destroyDropFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/drop",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.dropMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiAddressController.destroyDrop`);
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
