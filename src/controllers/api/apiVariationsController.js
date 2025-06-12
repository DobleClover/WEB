import db from "../../database/models/index.js";
import { v4 as UUIDV4 } from "uuid";
import { normalizeToString } from "../../utils/helpers/normalizeData.js";
import { populateSize } from "../../utils/helpers/populateStaticDb.js";
import { getFilesFromAWS } from "../../utils/helpers/awsHandler.js";
import sizes from "../../utils/staticDB/sizes.js";

import {
  productIncludeArray,
  setProductKeysToReturn,
} from "./apiProductController.js";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
const { Variation } = db;

const controller = {
  handleGetVariation: async (req, res) => {
    try {
      const { variationId } = req.query;
      if (!variationId) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "No variation id was provided",
        });
      }
      const variations = await getVariationsFromDB(variationId);      
      if (!variations || !variations.length) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Variation not found",
        });
      }
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        data: variations,
      });
    } catch (error) {
      console.log(`Error in handleGetVariations: ${error}`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Internal server error",
      });
    }
  },
};

export default controller;

let variationIncludeArray = [
  {
    association: "product",
    include: ["files","brand"],
  },
];

export const getVariationsFromDB = async (variationsID) => {
  try {
    if (!variationsID) return [];
    let variationsFromDB = await Variation.findAll({
      where: {
        id: variationsID,
      },
      include: variationIncludeArray,
    });
    variationsFromDB = getDeepCopy(variationsFromDB);
    variationsFromDB = await handleVariationsToReturn(variationsFromDB);
    return variationsFromDB;
  } catch (error) {
    console.log(`Error finding variations in db: ${error}`);
    console.log(error);
    return null;
  }
};
//Arma las variaciones para retornarlas ok
async function handleVariationsToReturn(variations = []) {
  try {
    if (!variations.length) return;
    const dbColors = await db.Color.findAll();
    let populatedVariations = populateVariations(variations,dbColors);
    for (let i = 0; i < populatedVariations.length; i++) {
      const variation = populatedVariations[i];
      let { product } = variation;
      await setProductKeysToReturn({
        product,
        withImages: true,
        withVariations: false,
      });
    }    
    return populatedVariations;
  } catch (error) {
    return console.log(error);
  }
}

// Hace bulkCreate de las variations
export const insertVariationsInDb = async (
  variations = [],
  productId = null
) => {
  try {
    if (!variations.length) return true;
    const mappedVariationsWithId = variations.map((variation) => {
      //{ sizes_id, taco_id, colors_id, stock}
      const variationID = variation.id ? variation.id : UUIDV4();
      return {
        id: variationID,
        products_id: productId,
        quantity: variation.quantity,
        sizes_id: variation.sizes_id,
        colors_id: variation.colors_id,
      };
    });

    await Variation.bulkCreate(mappedVariationsWithId, {
      updateOnDuplicate: ["quantity"],
    });
    return true;
  } catch (error) {
    console.log(`Error inserting variations in db: ${error}`);
    console.log(error);
    return false;
  }
};

// A partir de lo que llega por body, retorna array de ids de las variaciones que hay que borrar
export const getVariationsToDelete = (
  bodyVariations,
  dbVariations,
  productID
) => {
  return dbVariations
    .filter(
      (dbVar) =>
        !bodyVariations.some(
          (bodyVar) =>
            normalizeToString(dbVar.sizes_id) ===
              normalizeToString(bodyVar.sizes_id) &&
            normalizeToString(dbVar.products_id) ===
              normalizeToString(productID) &&
            normalizeToString(dbVar.colors_id) ===
              normalizeToString(bodyVar.colors_id)
        )
    )
    .map((dbVar) => dbVar.id);
};

// Deja el array con las variaciones para hacer el bulkCreate
export const getVariationsToAdd = (bodyVariations, dbVariations, productID) => {
  return bodyVariations.map((bodyVar) => {
    const existingVariation = dbVariations.find(
      (dbVar) =>
        normalizeToString(bodyVar.sizes_id) ===
          normalizeToString(dbVar.sizes_id) &&
        normalizeToString(productID) === normalizeToString(dbVar.products_id) &&
        normalizeToString(bodyVar.colors_id) ===
          normalizeToString(dbVar.colors_id)
    );

    return {
      id: existingVariation ? existingVariation.id : UUIDV4(),
      ...bodyVar,
    };
  });
};

export const deleteVariationInDb = async (variationID = undefined) => {
  try {
    if (!variationID) return true;
    await Variation.destroy({
      where: {
        id: variationID,
      },
    });
    return true;
  } catch (error) {
    console.log(`Error deleting variation in db ${error}`);
    console.log(error);
    return false;
  }
};

// Esta funcion le deja el size a las variaciones que se pasan por param
export const populateVariations = (variations,colorsFromDB = []) => {
  return variations.map((variation) => {
    const { sizes_id } = variation;
    const sizePopulated = populateSize(sizes_id);
    const color = colorsFromDB.find(dbColor=>dbColor.id == variation.colors_id)
    return {
      ...variation,
      size: sizePopulated,
      color
    };
  });
};

// A partir de un id de producto, busca sus variaciones
// No me interesa popular ni nada porque es para updatear el producto nomas
export const findProductVariations = async (productID = undefined) => {
  try {
    if (!productID) return [];
    let productVariations = await Variation.findAll({
      where: {
        products_id: productID,
      },
      include: variationIncludeArray,
    });
    if (!productVariations.length) return [];
    return productVariations;
  } catch (error) {
    console.log(`Error in findProductVariations: ${error}`);
    return null;
  }
};

export const updateVariationInDb = async (variationId, quantity) => {
  try {
    const affectedRows = await Variation.update(
      {
        quantity,
      },
      {
        where: {
          id: variationId,
        },
      }
    );
    return affectedRows > 0;
  } catch (error) {
    console.log("error updating variation in db" + error);
    return false;
  }
};
