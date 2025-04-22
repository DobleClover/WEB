import db from "../../database/models/index.js";
const { Product } = db;
// LIBRERIES
import { validationResult } from "express-validator";
import { v4 as UUIDV4 } from "uuid";
import {
  insertFilesInDB,
  findFilesInDb,
  deleteFileInDb,
} from "../../utils/helpers/filesHandler.js";
import {
  findProductVariations,
  insertVariationsInDb,
  getVariationsToDelete,
  getVariationsToAdd,
  deleteVariationInDb,
  populateVariations,
} from "../api/apiVariationsController.js";
// UTILS
import systemMessages from "../../utils/staticDB/systemMessages.js";
import { getMappedErrors } from "../../utils/helpers/getMappedErrors.js";
import getFileType from "../../utils/helpers/getFileType.js";
import {
  destroyFilesFromAWS,
  getFilesFromAWS,
  uploadFilesToAWS,
} from "../../utils/helpers/awsHandler.js";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";
import sizes from "../../utils/staticDB/sizes.js";
import { categories } from "../../utils/staticDB/categories.js";
import minDecimalPlaces from "../../utils/helpers/minDecimalPlaces.js";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import entityTypes from "../../utils/staticDB/entityTypes.js";
import sections from "../../utils/staticDB/sections.js";
import capitalizeFirstLetter from "../../utils/helpers/capitalizeFirstLetter.js";

const { productMsg } = systemMessages;
const {
  fetchFailed,
  notFound,
  fetchSuccessfull,
  createFailed,
  updateFailed,
  deleteSuccess,
  createSuccessfull,
  deleteFailed,
} = productMsg;
const PRODUCTS_FOLDER_NAME = "products";

const controller = {
  handleGetAllProducts: async (req, res) => {
    try {
      let { categoryId, productId, limit, offset, is_dobleuso } = req.query;
      if (limit) limit = parseInt(limit);
      if (categoryId) categoryId = parseInt(categoryId);
      if (offset) offset = parseInt(offset);
      if (typeof is_dobleuso !== "undefined") {
        is_dobleuso = is_dobleuso === "1";
      }
      let products;
      // Aca esta buscando uno/varios pero puntuales
      if (productId) {
        const foundProduct = await getProductsFromDB({
          id: productId,
          withImages: true,
        });
        if (!foundProduct) {
          return res.status(HTTP_STATUS.NOT_FOUND.code).json({
            ok: false,
            msg: notFound,
            data: [],
          });
        }
        if (Array.isArray(foundProduct)) {
          //Si hizo un fetch por arrays entocnes aca llega arary
          products = [...foundProduct];
        } else {
          products = [foundProduct];
        }
      } else {
        const productsFetched = await getProductsFromDB({
          id: null,
          categoryId,
          withImages: true,
          limit,
          offset,
          is_dobleuso,
        });
        products = productsFetched;
      }

      const totalCount = await getProductsCountFromDB({
        categoryId,
        is_dobleuso,
      });
      const hasMore = offset + products?.length < totalCount;

      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        data: products || [],
        hasMore,
      });
    } catch (error) {
      console.log(`error in handleGetAllProducts:`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: fetchFailed.en,
      });
    }
  },
  handleCreateProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        console.log(errors);

        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: createFailed,
          errors: errorsMapped,
          params: errorsParams,
        });
      }
      const body = req.body;
      let {
        name,
        description,
        price,
        discount,
        active,
        is_dobleuso,
        categories_id,
        brands_id,
        variations,
        filesFromArray,
      } = body;
      discount = discount ? parseInt(discount) : null;
      categories_id = categories_id ? parseInt(categories_id) : null;
      const bodyToCreate = {
        name,
        description: description || null,
        price,
        discount,
        active,
        categories_id,
        brands_id: brands_id || null,
        is_dobleuso,
      };

      const [isCreated, newProductId] = await insertProductInDb(bodyToCreate);
      if (!isCreated) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: createFailed,
        });
      }
      // vamos a recibir variaciones que contienen sizes_id, colors_id, quantity
      //Vienen modo string...
      filesFromArray = JSON.parse(req.body.filesFromArray);
      const isCreatingVariationsSuccessful = await insertVariationsInDb(
        variations,
        newProductId
      );
      if (!isCreatingVariationsSuccessful) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: createFailed,
        });
      }
      let { files } = req;
      if (files && files.length) {
        let filesToInsertInDb = await handleProductAWSFilesUpload({
          files,
          filesFromBody: filesFromArray,
        });
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: createFailed,
          });
        }
        const isInsertingFilesSuccessful = await insertFilesInDB({
          files: filesToInsertInDb,
          entities_id: newProductId,
          entity_types_id: entityTypes.PRODUCT,
        });
        if (!isInsertingFilesSuccessful) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: createFailed,
          });
        }
      }

      let productToReturn = await getProductsFromDB({
        id: newProductId,
        withImages: true,
      });
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: createSuccessfull,
        product: productToReturn,
      });
    } catch (error) {
      console.log(`Error in handleCreateProduct: ${error}`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: createFailed,
      });
    }
  },
  handleUpdateProduct: async (req, res) => {
    try {
      // return console.log(req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: updateFailed,
          errors: errors.mapped(),
        });
      }
      let { id } = req.params;
      const dbProduct = await getProductsFromDB({ id });
      if (!dbProduct) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Producto no encontrado",
        });
      }
      const body = req.body;
      let {
        name,
        description,
        price,
        discount,
        active,
        is_dobleuso,
        categories_id,
        brands_id,
        variations,
      } = body;

      discount = discount ? parseInt(discount) : null;
      categories_id = categories_id ? parseInt(categories_id) : null;
      const bodyToUpdate = {
        name,
        description: description || null,
        price,
        discount,
        active,
        categories_id,
        brands_id,
        is_dobleuso,
      };
      const isUpdateSuccessful = await updateProductInDb(bodyToUpdate, id);
      if (!isUpdateSuccessful) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: updateFailed.en,
        });
      }
      const oldProductVariations = await findProductVariations(id);

      const variationsToDelete = getVariationsToDelete(
        variations,
        oldProductVariations,
        id
      );
      const areAllVariationsDeleted = variationsToDelete.length
        ? await deleteVariationInDb(variationsToDelete)
        : true;
      if (!areAllVariationsDeleted) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: createFailed,
        });
      }
      const variationsToAdd = getVariationsToAdd(
        variations,
        oldProductVariations,
        id
      );
      const isInsertingVariationsSuccessful = await insertVariationsInDb(
        variationsToAdd,
        id
      );
      if (!isInsertingVariationsSuccessful) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: updateFailed,
        });
      }
      const imagesInDb = dbProduct?.files || [];

      let imagesToKeep = req.body.current_images;
      imagesToKeep = JSON.parse(imagesToKeep);
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
      let imagesToDelete;
      if (imagesToKeep && imagesToKeep.length > 0) {
        imagesToDelete = imagesInDb.filter(
          (img) =>
            !imagesToKeep.map((img) => img.filename).includes(img.filename)
        );
      } else {
        imagesToDelete = imagesInDb;
      }
      const filesDeletedOK = await handleProductFilesDestroy(imagesToDelete);
      if (!filesDeletedOK)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: updateFailed,
        });

      let normalizedFilesToUpdateInDb = imagesToKeep.map((file) => ({
        ...file,
      }));
      let { files } = req;
      let { filesFromArray } = body;
      filesFromArray = filesFromArray ? JSON.parse(filesFromArray) : [];
      if (files && files.length) {
        let filesToInsertInDb = await handleProductAWSFilesUpload({
          files,
          filesFromBody: filesFromArray,
        });
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: createFailed,
          });
        }
        normalizedFilesToUpdateInDb = [
          ...normalizedFilesToUpdateInDb,
          ...filesToInsertInDb,
        ];
      }
      const isInsertingFilesSuccessful = await insertFilesInDB({
        files: normalizedFilesToUpdateInDb,
        entities_id: id,
        entity_types_id: entityTypes.PRODUCT,
      });
      if (!isInsertingFilesSuccessful) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: createFailed,
        });
      }
      let productToReturn = await getProductsFromDB({
        id: id,
        withImages: true,
      });
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        product: productToReturn,
        msg: systemMessages.productMsg.updateSuccessfull,
      });
    } catch (error) {
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: createFailed,
      });
    }
  },
  handleDeleteProduct: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      }
      const dbProduct = await getProductsFromDB({ id: id });
      if (!dbProduct) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Producto no encontrado",
        });
      }

      const isDeletedSuccessfully = await deleteProductInDb(id);
      if (!isDeletedSuccessfully) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: deleteFailed,
        });
      }
      //Ahora borro los files
      let filesDeletedOK = await handleProductFilesDestroy(dbProduct.files);
      if (!filesDeletedOK)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: deleteFailed,
        });
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: deleteSuccess,
        data: id,
      });
    } catch (error) {
      console.log(`Error handling product deletion: ${error}`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: deleteFailed,
      });
    }
  },
};

export default controller;

export let productIncludeArray = ["files", "variations", "brand", "drops"];

export async function getProductsFromDB({
  id = null,
  categoryId = null,
  dropId = null,
  is_dobleuso = null,
  withImages = false,
  limit,
  offset,
}) {
  try {
    let where = {};
    if (categoryId) where.categories_id = categoryId;
    if (typeof is_dobleuso === "boolean") where.is_dobleuso = is_dobleuso;

    let productsToReturn, productToReturn;

    if (typeof id === "string") {
      productToReturn = await db.Product.findByPk(id, {
        include: productIncludeArray,
        limit,
        offset,
      });
      if (!productToReturn) return null;
      productToReturn = getDeepCopy(productToReturn);
      await setProductKeysToReturn({
        product: productToReturn,
        withImages: withImages,
        withVariations: true,
      });
      return productToReturn;
    } else if (Array.isArray(id)) {
      productsToReturn = await db.Product.findAll({
        where: { id },
        include: productIncludeArray,
        limit,
        offset,
      });
    } else {
      productsToReturn = await Product.findAll({
        where,
        include: productIncludeArray,
        limit,
        offset,
      });
    }

    if (!productToReturn && (!productsToReturn || !productsToReturn.length))
      return null;

    productsToReturn = getDeepCopy(productsToReturn);
    for (let i = 0; i < productsToReturn.length; i++) {
      const prod = productsToReturn[i];
      await setProductKeysToReturn({
        product: prod,
        withImages: true,
        withVariations: true,
      });
    }

    return productsToReturn;
  } catch (error) {
    console.log(`error finding products in db: ${error}`);
    return null;
  }
}

async function deleteProductInDb(productId) {
  try {
    const rowsAffected = await Product.destroy({
      where: {
        id: productId,
      },
    });
    return rowsAffected > 0;
  } catch (error) {
    console.log(`error deleting product in db: ${error}`);
    console.log(error);
    return null;
  }
}

async function insertProductInDb(body) {
  try {
    const newProductId = UUIDV4();
    const newProduct = {
      id: newProductId,
      ...body,
    };
    await Product.create(newProduct);

    return [true, newProductId];
  } catch (error) {
    console.log(`Error in insertProductInDb: ${error}`);
    console.log(error);
    return [false, null];
  }
}

async function updateProductInDb(body, productId) {
  try {
    let rowsAffected = await Product.update(body, {
      where: {
        id: productId,
      },
    });
    return rowsAffected > 0;
  } catch (error) {
    console.log(`error updating product in db: ${error}`);
    console.log(error);
    return false;
  }
}

export async function getVariationsFromDB(id) {
  try {
    let includeObj = ["product"];
    // Condición si id es un string
    if (typeof id === "string") {
      let variationToReturn = await db.Variation.findByPk(id, {
        include: includeObj,
      });
      if (!variationToReturn) return null;
      variationToReturn = variationToReturn && getDeepCopy(variationToReturn);
      //Aca le agrego los tacos y eso
      setVariationObjToReturn(variationToReturn);
      return variationToReturn;
    }
    // Condición si id es un array
    if (Array.isArray(id)) {
      let variationsToReturn = await db.Variation.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: includeObj,
      });
      if (!variationsToReturn.length) return null;
      variationsToReturn = getDeepCopy(variationsToReturn);
      //Aca le agrego los tacos y eso
      variationsToReturn.forEach((variation) =>
        setVariationObjToReturn(variation)
      );
      return variationsToReturn;
    }

    // Condición si id es undefined
    if (id === undefined) {
      let variationsToReturn = await db.Variation.findAll({
        include: includeObj,
      });
      if (!variationsToReturn.length) return null;
      variationsToReturn = getDeepCopy(variationsToReturn);
      //Aca le agrego los tacos y eso
      variationsToReturn.forEach((variation) =>
        setVariationObjToReturn(variation)
      );
      return variationsToReturn;
    }
  } catch (error) {
    console.log("Falle en getVariationsFromDB");
    console.error(error);
    return null;
  }
}
//compra 3 productos ==>
function setVariationObjToReturn(variation) {
  variation.taco = tacos.find((taco) => taco.id == variation.taco_id);
  variation.size = sizes.find((size) => size.id == variation.sizes_id);
}

export async function setProductKeysToReturn({
  product,
  withImages = false,
  withVariations = false,
}) {
  try {
    //Le seteo la categoria
    product.category = categories.find(
      (cat) => cat.id == product.categories_id
    );
    product.brand.name = capitalizeFirstLetter(product.brand.name);
    if (withVariations) {
      const dbColors = await db.Color.findAll();
      product.variations = populateVariations(product.variations, dbColors);
    }
    product.price = minDecimalPlaces(product.price);
    product.totalStock =
      product.variations?.reduce(
        (sum, variation) => sum + variation.quantity,
        0
      ) || 0;
    if (withImages && product.files?.length) {
      await getFilesFromAWS({
        folderName: PRODUCTS_FOLDER_NAME,
        files: product.files,
      });
      product.files?.sort((a, b) => a.position - b.position);
    }
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}

async function handleProductAWSFilesUpload({ files = [], filesFromBody = [] }) {
  try {
    files?.forEach((multerFile) => {
      const fileFromFilesArrayFiltered = filesFromBody.find(
        (arrFile) => arrFile.filename == multerFile.originalname
      );
      multerFile.file_types_id = getFileType(multerFile);
      multerFile.main_file = fileFromFilesArrayFiltered.main_file;
      multerFile.file_roles_id =
        fileFromFilesArrayFiltered.file_roles_id || null;
      multerFile.position = fileFromFilesArrayFiltered.position || null;
    });
    const objectToUpload = {
      files,
      folderName: PRODUCTS_FOLDER_NAME,
      sections_id: sections.PRODUCT.id,
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
async function handleProductFilesDestroy(files = []) {
  try {
    if (!files.length) return true;
    const objectToDestroyInAws = {
      files,
      folderName: PRODUCTS_FOLDER_NAME,
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

export async function getProductsCountFromDB({
  categoryId = null,
  is_dobleuso = null,
}) {
  try {
    const where = {};
    if (categoryId) where.categories_id = categoryId;
    if (typeof is_dobleuso === "boolean") where.is_dobleuso = is_dobleuso;

    return await db.Product.count({ where });
  } catch (error) {
    console.error("Error counting products:", error);
    return 0;
  }
}
