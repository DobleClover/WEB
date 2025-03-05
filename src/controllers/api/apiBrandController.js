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
import sections from "../../utils/staticDB/sections.js";
import entityTypes from "../../utils/staticDB/entityTypes.js";
import {
  destroyFilesFromAWS,
  getFilesFromAWS,
  uploadFilesToAWS,
} from "../../utils/helpers/awsHandler.js";
import getFileType from "../../utils/helpers/getFileType.js";
import {
  deleteFileInDb,
  insertFilesInDB,
} from "../../utils/helpers/filesHandler.js";
const BRANDS_FOLDER_NAME = "brands";
// ENV

const controller = {
  getBrands: async (req, res) => {
    try {
      let { brands_id } = req.query;
      brands_id = brands_id || undefined;

      let brandsFromDB = await getBrandsFromDB(brands_id);

      // Mando la respuesta
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          path: "/api/brand/",
          method: "GET",
        },
        ok: true,
        data: brandsFromDB,
      });
    } catch (error) {
      console.log(`Falle en apiBrandController.getBrands`);
      console.log(error);
      return res.status(500).json({ error });
    }
  },
  createBrand: async (req, res) => {
    try {
      console.log(req.body.name);

      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/brand",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let brandObjToDB = generateBrandObject(req.body);
      // Si llega por default entonces actualizo todas las otras
      let createdBrand = await insertBrandToDB(brandObjToDB);

      if (!createdBrand)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });

      // Ahora voy por los archivos
      let { file } = req;
      if (file) await handleBrandFileUpload({ file, brandID: createdBrand.id });
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/brand",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.brandMsg.createSuccesfull,
        brand: createdBrand,
      });
    } catch (error) {
      console.log(`Falle en apiBrandController.createBrand`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updateBrand: async (req, res) => {
    try {
      // Traigo errores
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/brand",
            method: "PUT",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      const dbBrand = await getBrandsFromDB(req.body.id);
      if (!dbBrand) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Marca no encontrada",
        });
      }
      let brandObjToDB = generateBrandObject(req.body);
      // Verificar si el usuario subió un nuevo logo
      let { file } = req;
      if (file) await handleBrandFileUpload({ file, brandID: dbBrand.id });

      // Verificar si hay que eliminar el loog (ya sea porque lo borro o cambio la foto)
      const { deleteOldLogo } = req.body;
      if (deleteOldLogo) await handleBrandFileDestroy(dbBrand.logo);

      await updateBrandFromDB(brandObjToDB, brandObjToDB.id);

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/brand",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.brandMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateBrand`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyBrand: async (req, res) => {
    try {
      let { id } = req.body;
      let dbBrand = await getBrandsFromDB(id);
      if (!dbBrand) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Marca no encontrada",
        });
      }
      // Lo borro de db
      let response = await destroyBrandFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      // Busco los archivos de ese file
      if (dbBrand.logo) await handleBrandFileDestroy(dbBrand.logo);

      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/brand",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.brandMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiAddressController.destroyBrand`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
};

export default controller;

let brandIncludeArray = ["products", "logo"];

export async function getBrandsFromDB(id = undefined) {
  try {
    let brandsToReturn, brandToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      brandToReturn = await db.Brand.findByPk(id, {
        include: brandIncludeArray,
      });
      if (!brandToReturn) return null;
      brandToReturn = brandToReturn && getDeepCopy(brandToReturn);
      await setBrandKeysToReturn(brandToReturn);
      return brandToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      brandsToReturn = await db.Brand.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: brandIncludeArray,
      });
      if (!brandsToReturn || !brandsToReturn.length) return null;
      brandsToReturn = getDeepCopy(brandsToReturn);
    }
    // Condición si id es undefined
    else {
      brandsToReturn = await db.Brand.findAll({
        include: brandIncludeArray,
      });
      if (!brandsToReturn || !brandsToReturn.length) return null;
      brandsToReturn = getDeepCopy(brandsToReturn);
    };
    for (let i = 0; i < brandsToReturn.length; i++) {
      const brand = brandsToReturn[i];
      await setBrandKeysToReturn(brand);
    }
    
    return brandsToReturn;
  } catch (error) {
    console.log("Falle en getBrandsFromDB");
    console.error(error);
    return null;
  }
}

export async function insertBrandToDB(obj) {
  try {
    //Lo creo en db
    let createdBrand = await db.Brand.create(obj);
    return createdBrand || undefined;
  } catch (error) {
    console.log(`Falle en insertBrandToDB`);
    console.log(error);
    return undefined;
  }
}
export async function updateBrandFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.Brand.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateBrandFromDB`);
    console.log(error);
    return undefined;
  }
}
export async function destroyBrandFromDB(id) {
  try {
    if (!id) return undefined;

    //Lo borro de db
    await db.Brand.destroy({
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en destroyBrandFromDB`);
    console.log(error);
    return undefined;
  }
}
export function generateBrandObject(obj) {
  // objeto para armar la address
  let { id, name } = obj;

  let dataToDB = {
    id: id ? id : uuidv4(),
    name: name.trim().toLowerCase(),
  };
  return dataToDB;
}

async function setBrandKeysToReturn(brand) {
  try {
    brand.logo &&
      (await getFilesFromAWS({
        folderName: BRANDS_FOLDER_NAME,
        files: [brand.logo],
      }));
    
  } catch (error) {
    return console.log(error);
  }
}

async function handleBrandFileUpload({ file, brandID }) {
  try {
    file.file_types_id = getFileType(file); // Tipo de archivo
    const objectToUpload = {
      files: [file], // Convertimos a array para reutilizar `uploadFilesToAWS`
      folderName: BRANDS_FOLDER_NAME,
      sections_id: sections.BRAND.id, // Sección de marcas
    };

    const filesToInsertInDb = await uploadFilesToAWS(objectToUpload);
    if (!filesToInsertInDb) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: systemMessages.brandMsg.createFailed,
      });
    }
    const isInsertingFilesSuccessful = await insertFilesInDB({
      files: filesToInsertInDb,
      entities_id: brandID,
      entity_types_id: entityTypes.BRAND,
    });
    if (!isInsertingFilesSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: systemMessages.brandMsg.createFailed,
      });
    }
  } catch (error) {
    console.log(error);
    return;
  }
}
async function handleBrandFileDestroy(file) {
  try {
    // Ahora borro la imagen de la marca
    const objectToDestroyInAws = {
      files: [file],
      folderName: BRANDS_FOLDER_NAME,
    };
    const isDeletionInAwsSuccessful = await destroyFilesFromAWS(
      objectToDestroyInAws
    );
    if (!isDeletionInAwsSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: systemMessages.brandMsg.updateFailed,
      });
    }

    await deleteFileInDb(file.id);
  } catch (error) {
    console.log(error);
    return;
  }
}
