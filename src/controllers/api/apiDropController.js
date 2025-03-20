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
import {
  destroyFilesFromAWS,
  getFilesFromAWS,
  uploadFilesToAWS,
} from "../../utils/helpers/awsHandler.js";
import {
  deleteFileInDb,
  insertFilesInDB,
} from "../../utils/helpers/filesHandler.js";
import entityTypes from "../../utils/staticDB/entityTypes.js";
import sections from "../../utils/staticDB/sections.js";
import getFileType from "../../utils/helpers/getFileType.js";
import {
  getProductsFromDB,
  productIncludeArray,
  setProductKeysToReturn,
} from "./apiProductController.js";
import { getDateString } from "../../utils/helpers/getDateString.js";

const DROPS_FOLDER_NAME = "drops";
// ENV

const controller = {
  getDrops: async (req, res) => {
    try {
      let { drops_id, includeProductImages } = req.query;
      drops_id = drops_id || undefined;
      includeProductImages = includeProductImages ? true : false;
      let dropsFromDB = await getDropsFromDB({
        id: drops_id,
        withImages: true,
        withProductImages: includeProductImages,
      });

      // Mando la respuesta
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          path: "/api/drop/",
          method: "GET",
        },
        ok: true,
        data: dropsFromDB,
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
      let { productIDS } = req.body;
      productIDS = JSON.parse(productIDS);
      let relationsToPush = productIDS?.map((prodID) => ({
        products_id: prodID,
        drops_id: createdDrop.id,
      }));
      relationsToPush.length &&
        (await db.Product_Drop.bulkCreate(relationsToPush));
      // Ahora, si cargo fotos...
      let { files } = req;
      let { filesFromArray } = req.body; //Esto es lo que me llega por body
      filesFromArray = filesFromArray ? JSON.parse(filesFromArray) : [];
      if (files && files.length) {
        const filesToInsertInDb = await handleDropFilesUpload({
          files,
          filesFromBody: filesFromArray,
        });
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: systemMessages.dropMsg.createFailed,
          });
        }
        const isInsertingFilesSuccessful = await insertFilesInDB({
          files: filesToInsertInDb,
          entities_id: createdDrop.id,
          entity_types_id: entityTypes.DROP,
        });
        if (!isInsertingFilesSuccessful) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: systemMessages.dropMsg.createFailed,
          });
        }
      }
      createdDrop = await getDropsFromDB({
        id: createdDrop.id,
        withImages: true,
      });
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
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      const dbDrop = await getDropsFromDB({ id });
      if (!dbDrop) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Drop no encontrado",
        });
      }
      let dropObjToDB = generateDropObject(req.body);
      dropObjToDB.id = id;
      await updateDropFromDB(dropObjToDB, dropObjToDB.id);
      console.log("🟢 Drop actualizado con éxito:", dropObjToDB);
      // Ahora veo que productos tiene
      let { productIDS } = req.body;
      productIDS = JSON.parse(productIDS);
      // Calcular qué productos agregar y cuáles eliminar
      let { idsToAdd, idsToRemove } = getDropProductRelationLists({
        productIDS,
        dbDrop,
      });
      const productRelationsToAdd =
        idsToAdd?.map((prodID) => ({
          products_id: prodID,
          drops_id: dbDrop.id,
        })) || [];
      productRelationsToAdd.length &&
        (await db.Product_Drop.bulkCreate(productRelationsToAdd));
      idsToRemove.length &&
        (await db.Product_Drop.destroy({
          where: {
            products_id: idsToRemove,
            drops_id: dbDrop.id,
          },
        }));
      console.log("🟢 Relaciones con productos actualizadas con éxito:");

      // Tema Imagenes
      const dbFiles = dbDrop?.files || [];
      let filesToKeep = req.body.current_images;
      filesToKeep = filesToKeep ? JSON.parse(filesToKeep) : [];
      // current_images
      // [
      // id: fileid
      // filename: randomName
      // main_image: 1,
      // position: 1
      //]
      // filesFromArray
      // [
      // filename: filename
      // main_image: 0,
      //position: 2
      // ]
      // req.files
      let filesToDelete;
      if (filesToKeep && filesToKeep.length > 0) {
        filesToDelete = dbFiles.filter(
          (img) =>
            !filesToKeep.map((img) => img.filename).includes(img.filename)
        );
      } else {
        filesToDelete = dbFiles;
      }
      const filesDeletedOK = await handleDropFilesDestroy(filesToDelete);
      if (!filesDeletedOK)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: updateFailed,
        });

      let normalizedFilesToUpdateInDb = filesToKeep.map((file) => ({
        ...file,
      }));
      let { files } = req;
      let { filesFromArray } = req.body;
      filesFromArray = filesFromArray ? JSON.parse(filesFromArray) : [];
      if (files && files.length) {
        let filesToInsertInDb = await handleDropFilesUpload({
          files,
          filesFromBody: filesFromArray,
        });
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: systemMessages.dropMsg.createFailed,
          });
        }
        normalizedFilesToUpdateInDb = [
          ...normalizedFilesToUpdateInDb,
          ...filesToInsertInDb,
        ];
      }
      const isInsertingFilesSuccessful = await insertFilesInDB({
        files: normalizedFilesToUpdateInDb,
        entities_id: dbDrop.id,
        entity_types_id: entityTypes.DROP,
      });
      if (!isInsertingFilesSuccessful) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: systemMessages.dropMsg.createFailed,
        });
      }

      const updatedDrop = await getDropsFromDB({
        id: dbDrop.id,
        withImages: true,
      });
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/drop",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.dropMsg.updateSuccesfull,
        drop: updatedDrop,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateDrop`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyDrop: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      const dbDrop = await getDropsFromDB({ id });
      if (!dbDrop) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Drop no encontrado",
        });
      }
      // Lo borro de db
      let response = await destroyDropFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();

      //Ahora borro los files
      let filesDeletedOK = await handleDropFilesDestroy(dbDrop.files);
      if (!filesDeletedOK)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: systemMessages.dropMsg.destroyFailed,
        });
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
  getDropProducts: async(req,res)=>{
    try {
      const { dropId } = req.params;
  
      // Buscar los productos asociados al drop
      const dropFromDB = await getDropsFromDB({id: dropId, withImages: true, withProductImages: true});
      console.log(dropFromDB.products);
      
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          method: "GET",
        },
        ok: true,
        data: dropFromDB.products || [],
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      console.error(error);
      res.status(500).json({ message: "Error retrieving products" });
    }
  }
};

export default controller;

let dropIncludeArray = [
  { association: "products", include: productIncludeArray },
  "files",
];

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
  let { name, active, unique, launch_date } = obj;

  let dataToDB = {
    id: uuidv4(),
    name: name.trim(),
    active: active || false,
    unique: unique || false,
    launch_date: new Date(launch_date), // Convertir a objeto Date
  };
  return dataToDB;
}

export async function getDropsFromDB({
  id = undefined,
  withImages = false,
  withProductImages = false,
}) {
  try {
    let dropsToReturn, dropToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      dropToReturn = await db.Drop.findByPk(id, {
        include: dropIncludeArray,
      });
      if (!dropToReturn) return null;
      dropToReturn = dropToReturn && getDeepCopy(dropToReturn);
      await setDropKeysToReturn({
        drop: dropToReturn,
        withProductImages,
        withImages,
      });
      return dropToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      dropsToReturn = await db.Drop.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: dropIncludeArray,
      });
      if (!dropsToReturn || !dropsToReturn.length) return null;
      dropsToReturn = getDeepCopy(dropsToReturn);
    }
    // Condición si id es undefined
    else {
      dropsToReturn = await db.Drop.findAll({
        include: dropIncludeArray,
      });
      if (!dropsToReturn || !dropsToReturn.length) return null;
      dropsToReturn = getDeepCopy(dropsToReturn);
    }
    for (let i = 0; i < dropsToReturn.length; i++) {
      const drop = dropsToReturn[i];
      await setDropKeysToReturn({ drop, withProductImages, withImages });
    }
    return dropsToReturn;
  } catch (error) {
    console.log("Falle en getdropsFromDB");
    console.error(error);
    return null;
  }
}

async function setDropKeysToReturn({
  drop,
  withImages = false,
  withProductImages = false,
}) {
  setDropLaunchDateString(drop);
  for (const dropProd of drop.products) {
    await setProductKeysToReturn({
      product: dropProd,
      withImages: withProductImages,
    });
  }
  if (withImages && drop.files?.length) {
    await getDropImages(drop)
  }
}

async function handleDropFilesUpload({ files = [], filesFromBody = [] }) {
  try {
    if (!files.length || !filesFromBody.length) return false;
    files?.forEach((multerFile) => {
      const fileFromFilesArrayFiltered = filesFromBody.find(
        (arrFile) => arrFile.filename == multerFile.originalname
      );
      multerFile.file_types_id = getFileType(multerFile);
      multerFile.position = fileFromFilesArrayFiltered.position || null;
      multerFile.file_roles_id =
        fileFromFilesArrayFiltered.file_roles_id || null;
    });
    const objectToUpload = {
      files,
      folderName: DROPS_FOLDER_NAME,
      sections_id: sections.DROP.id, //Drop
    };
    const filesToInsertInDb = await uploadFilesToAWS(objectToUpload);
    if (!filesToInsertInDb) {
      return false;
    }
    return filesToInsertInDb;
  } catch (error) {
    console.log(error);

    return false;
  }
}

async function handleDropFilesDestroy(files = []) {
  try {
    if (!files.length) return true;
    const objectToDestroyInAws = {
      files,
      folderName: DROPS_FOLDER_NAME,
    };
    const isDeletionInAwsSuccessful = await destroyFilesFromAWS(
      objectToDestroyInAws
    );
    if (!isDeletionInAwsSuccessful) return false;
    const idsToDestroyDB = files.map((img) => img.id);
    await deleteFileInDb(idsToDestroyDB);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function getDropProductRelationLists({ productIDS = [], dbDrop = {} }) {
  // Obtener IDs de productos actualmente relacionados
  const currentProductIds = dbDrop?.products.map((p) => p.id) || [];
  // Calcular diferencias
  const productsToRemove = currentProductIds.filter(
    (id) => !productIDS.includes(id)
  ); // Estaban antes, pero ya no están
  const productsToAdd = productIDS.filter(
    (id) => !currentProductIds.includes(id)
  ); // No estaban antes, pero ahora sí
  return { idsToAdd: productsToAdd, idsToRemove: productsToRemove };
}

export async function getDropImages(drop = null) {
  if(!drop)return
  await getFilesFromAWS({
    folderName: DROPS_FOLDER_NAME,
    files: drop.files,
  });
  drop.files?.sort((a, b) => a.position - b.position);
  drop.bgImage = drop.files.find(
    (file) => file.file_roles_id == sections.DROP.roles.BACKGROUND
  );
  drop.cardImages = drop.files.filter(
    (file) => file.file_roles_id == sections.DROP.roles.CARD
  );
}

export function setDropLaunchDateString(drop){
  drop.launchDateString = getDateString(drop.launch_date);
};