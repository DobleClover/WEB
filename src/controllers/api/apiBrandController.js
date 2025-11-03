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
import { productIncludeArray, setProductKeysToReturn } from "./apiProductController.js";
const BRANDS_FOLDER_NAME = "brands";
// ENV

const controller = {
  getBrands: async (req, res) => {
    try {
      let { brands_id, withImages, withProductImages, onlyMainImages, onlyIsotype, onlyHomeBrands } = req.query;
      brands_id = brands_id || undefined;
      withProductImages = withProductImages ? true: false;
      onlyMainImages = onlyMainImages ? true: false;
      onlyIsotype = onlyIsotype ? true: false;
      onlyHomeBrands = onlyHomeBrands ? true : false;
      
      let brandsFromDB = await getBrandsFromDB({
        id: brands_id,
        withImages,
        withProductImages,
        onlyMainImages,
        onlyIsotype,
        onlyHomeBrands
      });

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
      let { files } = req;
      const logo = files["logo"] ? files["logo"][0] : null;
      const isotype = files["isotype"] ? files["isotype"][0] : null;
      const logotype = files["logotype"] ? files["logotype"][0] : null;
      if (logo) {
        //Aca cargo el logo
        logo.file_roles_id = sections.BRAND.roles.LOGO;
        await handleBrandFileUpload({ file: logo, brandID: createdBrand.id });
      }
      if (isotype) {
        //Aca cargo el isotipo
        isotype.file_roles_id = sections.BRAND.roles.ISOTYPE;
        await handleBrandFileUpload({
          file: isotype,
          brandID: createdBrand.id,
        });
      }
      if (logotype) {
        //Aca cargo el isotipo
        logotype.file_roles_id = sections.BRAND.roles.LOGOTYPE;
        await handleBrandFileUpload({
          file: logotype,
          brandID: createdBrand.id,
        });
      }
      createdBrand = await getBrandsFromDB({
        id: createdBrand.id,
        withImages: true,
      });
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
      let { id } = req.params;
      if (!id)
        res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      const dbBrand = await getBrandsFromDB({ id });
      if (!dbBrand) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Marca no encontrada",
        });
      }
      let brandObjToDB = generateBrandObject(req.body);
      brandObjToDB.id = id; //Le dejo el id del update
      // Verificar si el usuario subió un nuevo logo
      let { files } = req;
      const logo = files["logo"] ? files["logo"][0] : null;
      const isotype = files["isotype"] ? files["isotype"][0] : null;
      const logotype = files["logotype"] ? files["logotype"][0] : null;
      let filesToDestroy = [];
      if (logo) {
        //Aca cambio el logo
        logo.file_roles_id = sections.BRAND.roles.LOGO;
        await handleBrandFileUpload({ file: logo, brandID: id });
        filesToDestroy.push(dbBrand.logo);
      }
      if (isotype) {
        //Aca cambio el isotipo
        isotype.file_roles_id = sections.BRAND.roles.ISOTYPE;
        await handleBrandFileUpload({ file: isotype, brandID: id });
        filesToDestroy.push(dbBrand.isotype);
      }
      if (logotype) {
        //Aca cambio el isotipo
        logotype.file_roles_id = sections.BRAND.roles.LOGOTYPE;
        await handleBrandFileUpload({ file: logotype, brandID: id });
        filesToDestroy.push(dbBrand.logotype);
      }
      // Si hubo para borrar lo hago
      filesToDestroy.length && (await handleBrandFileDestroy(filesToDestroy));
      await updateBrandFromDB(brandObjToDB, brandObjToDB.id);
      const brandToReturn = await getBrandsFromDB({
        id: brandObjToDB.id,
        withImages: true,
      });
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/brand",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.brandMsg.updateSuccesfull,
        brand: brandToReturn,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateBrand`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyBrand: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      let dbBrand = await getBrandsFromDB({ id });
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
      if (dbBrand.files) await handleBrandFileDestroy(dbBrand.files);

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

let brandIncludeArray = [{association: "products", where: { active: true },required: false, include: productIncludeArray}, "files"];

export async function getBrandsFromDB({
  id = undefined,
  withImages = false,
  withProductImages = false,
  onlyMainImages = false,
  onlyIsotype = false,
  onlyHomeBrands = false
}) {
  try {
    let brandsToReturn, brandToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      brandToReturn = await db.Brand.findByPk(id, {
        include: brandIncludeArray,
      });
      if (!brandToReturn) return null;
      brandToReturn = brandToReturn && getDeepCopy(brandToReturn);
      await setBrandKeysToReturn({
        brand: brandToReturn,
        withImages,
        withProductImages,
        onlyMainImages,
        onlyIsotype
      });
      return brandToReturn;
    }

   // Construir cláusula where si aplica
    const where = {};
    if (Array.isArray(id)) {
      where.id = id;
    }
    if (onlyHomeBrands) {
      where.show_in_home = true;
    }

    // Buscar según si id es array o undefined
    brandsToReturn = await db.Brand.findAll({
      where: Object.keys(where).length ? where : undefined,
      include: brandIncludeArray,
    });

    if (!brandsToReturn || !brandsToReturn.length) return null;
    brandsToReturn = getDeepCopy(brandsToReturn);

    for (let i = 0; i < brandsToReturn.length; i++) {
      const brand = brandsToReturn[i];
      await setBrandKeysToReturn({
        brand,
        withImages,
        withProductImages,
        onlyMainImages,
        onlyIsotype
      });
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
  let { name, show_in_home } = obj;

  let dataToDB = {
    id: uuidv4(),
    name: name.trim().toLowerCase(),
    show_in_home: show_in_home || false,
  };
  return dataToDB;
}

async function setBrandKeysToReturn({
  brand,
  withImages = false,
  withProductImages = false,
  onlyMainImages = false,
  onlyIsotype = false
}) {
  try {
    if (brand.files?.length) {
      if (onlyIsotype) {
        // 🔸 Solo traigo el isotype desde AWS
        const isotypeFile = brand.files.find(
          (file) => file.file_roles_id == sections.BRAND.roles.ISOTYPE
        );

        if (isotypeFile) {
          await getFilesFromAWS({
            folderName: BRANDS_FOLDER_NAME,
            files: [isotypeFile],
          });
        }
      } else {
        // 🔸 Traigo todos los archivos
        await getFilesFromAWS({
          folderName: BRANDS_FOLDER_NAME,
          files: brand.files,
        });
      }
    }

    // Siempre busco los keys de logo/logotype/isotype
    brand.logo = brand.files?.find(
      (file) => file.file_roles_id == sections.BRAND.roles.LOGO
    );
    brand.logotype = brand.files?.find(
      (file) => file.file_roles_id == sections.BRAND.roles.LOGOTYPE
    );
    brand.isotype = brand.files?.find(
      (file) => file.file_roles_id == sections.BRAND.roles.ISOTYPE
    );

    // 🔸 Productos
    let selectedProducts = brand.products;

    if (onlyMainImages && Array.isArray(brand.products)) {
      selectedProducts = [...brand.products]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    }

    for (const brandProd of selectedProducts) {
      await setProductKeysToReturn({
        product: brandProd,
        withImages: withProductImages,
        onlyMainImages,
      });
    }

    if (onlyMainImages) {
      brand.products = selectedProducts;
    }
  } catch (error) {
    console.log(error);
  }
}

//TYPES: 1 logo || 2 isotipo || 3 logotipo
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
async function handleBrandFileDestroy(files) {
  try {
    // Ahora borro la imagen de la marca
    const objectToDestroyInAws = {
      files,
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
    let filesIds = files.map((file) => file.id);
    await deleteFileInDb(filesIds);
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function getBrandsLogos(brands){
  for (const brand of brands) {
    if(brand.files.length){
      brand.logo = brand.files?.find(
        (file) => file.file_roles_id == sections.BRAND.roles.LOGO
      );
      await getFilesFromAWS({
        folderName: BRANDS_FOLDER_NAME,
        files: [brand.logo],
      });
      delete brand.files
    }
    
  }
}
