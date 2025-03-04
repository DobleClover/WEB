import db from "../../database/models/index.js";
const { Product } = db;
// LIBRERIES
import { validationResult } from "express-validator";
import { v4 as UUIDV4 } from "uuid";
import  {
  insertFilesInDb,
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
      let { categoryId, productId, limit, offset } = req.query;
      if (limit) limit = parseInt(limit);
      if (categoryId) categoryId = parseInt(categoryId);
      if (offset) offset = parseInt(offset);
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
        });
        if (!productsFetched?.length) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: fetchFailed,
            data: [],
          });
        }
        products = productsFetched;
      }
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        data: products,
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
        categories_id,
        tags,
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
        categories_id,
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
      variations = JSON.parse(req.body.variations);
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
      const files = req.files;
      if (files && files.length) {
        files?.forEach((multerFile) => {
          const fileFromFilesArrayFiltered = filesFromArray.find(
            (arrFile) => arrFile.filename == multerFile.originalname
          );
          multerFile.file_types_id = getFileType(multerFile);
          multerFile.main_file = fileFromFilesArrayFiltered.main_file;
        });
        const objectToUpload = {
          files,
          folderName: PRODUCTS_FOLDER_NAME,
          sections_id: 2,
        };
        const filesToInsertInDb = await uploadFilesToAWS(objectToUpload);
        if (!filesToInsertInDb) {
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
            ok: false,
            msg: createFailed,
          });
        }
        const isInsertingFilesSuccessful = await insertFilesInDb(
          filesToInsertInDb,
          newProductId
        );
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
    // return console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
        ok: false,
        msg: updateFailed,
        errors: errors.mapped(),
      });
    }
    const body = req.body;
    let {
      id: productId,
      name,
      description,
      price,
      discount,
      categories_id,
      tags,
      variations,
    } = body;
    discount = discount ? parseInt(discount) : null;
    categories_id = categories_id ? parseInt(categories_id) : null;
    const bodyToUpdate = {
      name,
      description: description || null,
      price,
      discount,
      categories_id,
    };
    const isUpdateSuccessful = await updateProductInDb(bodyToUpdate, productId);
    if (!isUpdateSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: updateFailed.en,
      });
    }
    const variationsInDb = await findProductVariations(productId);

    variations = JSON.parse(variations);
    const variationsToDelete = getVariationsToDelete(
      variations,
      variationsInDb,
      productId
    );
    const areAllVariationsDeleted = variationsToDelete.length ? await deleteVariationInDb(variationsToDelete) : true;
    if (!areAllVariationsDeleted) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: createFailed,
      });
    }
    const variationsToAdd = getVariationsToAdd(
      variations,
      variationsInDb,
      productId
    );
    const isInsertingVariationsSuccessful = await insertVariationsInDb(
      variationsToAdd,
      productId
    );
    if (!isInsertingVariationsSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: updateFailed,
      });
    }
    const imagesInDb = await findFilesInDb(productId);
    let imagesToKeep = req.body.current_images;
    imagesToKeep = JSON.parse(imagesToKeep);
    // current_images
    // [
    // id: fileid
    // filename: randomName
    // main_image: 1
    //]
    // filesFromArray
    // [
    // filename: filename
    // main_image: 0
    // ]
    // req.files
    let imagesToDelete;
    if (imagesToKeep && imagesToKeep.length > 0) {
      imagesToDelete = imagesInDb.filter(
        (img) => !imagesToKeep.map((img) => img.filename).includes(img.filename)
      );
    } else {
      imagesToDelete = imagesInDb;
    }
    const objectToDestroyInAws = {
      files: imagesToDelete,
      folderName: PRODUCTS_FOLDER_NAME,
    };
    const isDeletionInAwsSuccessful = await destroyFilesFromAWS(
      objectToDestroyInAws
    );
    if (!isDeletionInAwsSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: updateFailed,
      });
    }
    const deleteImagesPromises = imagesToDelete.map(async (img) => {
      const { id } = img;
      const deleteResult = await deleteFileInDb(id);
      return deleteResult;
    });
    const results = await Promise.all(deleteImagesPromises);
    const isAllDeleted = results.every((res) => res === true);
    if (!isAllDeleted) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: updateFailed.en,
      });
    }
    let normalizedFilesToUpdateInDb = imagesToKeep.map((file) => ({
      ...file,
    }));
    if (req.files) {
      const files = req.files;
      let { filesFromArray } = body;
      filesFromArray = JSON.parse(filesFromArray);
      files.forEach((multerFile) => {
        const fileFromFilesArrayFiltered = filesFromArray.find(
          (arrFile) => arrFile.filename === multerFile.originalname
        );
        multerFile.file_types_id = getFileType(multerFile);
        multerFile.main_file = fileFromFilesArrayFiltered.main_file;
      });
      const objectToUpload = {
        files,
        folderName: PRODUCTS_FOLDER_NAME,
        sections_id: 2,
      };
      const filesToInsertInDb = await uploadFilesToAWS(objectToUpload);
      normalizedFilesToUpdateInDb = [
        ...normalizedFilesToUpdateInDb,
        ...filesToInsertInDb,
      ];

      if (!filesToInsertInDb) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: createFailed,
        });
      }
    }
    const isInsertingFilesSuccessful = await insertFilesInDb(
      normalizedFilesToUpdateInDb,
      productId
    );
    if (!isInsertingFilesSuccessful) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: createFailed,
      });
    }
    let productToReturn = await getProductsFromDB({
      id: productId,
      withImages: true,
    });
    return res.status(HTTP_STATUS.OK.code).json({
      ok: true,
      product: productToReturn,
      msg: systemMessages.productMsg.updateSuccessfull,
    });
  },
  handleDeleteProduct: async (req, res) => {
    try {
      const productId = req.params.productId;
      if (!productId) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: deleteFailed,
        });
      }
      const isDeletedSuccessfully = await deleteProductInDb(productId);
      if (!isDeletedSuccessfully) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: deleteFailed,
        });
      }
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: deleteSuccess,
        data: productId,
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

let productIncludeArray = ["files", "variations"];
export async function getProductsFromDB({
  id = null,
  categoryId = null,
  withImages = false,
  limit,
  offset,
}) {
  try {
    let productsToReturn, productToReturn;
    // Condición si id es un string
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
      }); //Setea las keys para devolver front
      return productToReturn;
    } else if (Array.isArray(id)) {
      // Condición si id es un array
      productsToReturn = await db.Product.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: productIncludeArray,
        limit,
        offset,
      });
    } else if (categoryId) {
      productsToReturn = await Product.findAll({
        where: {
          category_id: categoryId,
        },
        include: productIncludeArray,
        limit,
        offset,
      });
    } else {
      productsToReturn = await Product.findAll({
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
  variation.size = sizes.find((size) => size.id == variation.size_id);
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
    if (withVariations) {
      product.variations = populateVariations(product.variations);
    }
    product.price = minDecimalPlaces(product.price);
    if (withImages && product.files?.length) {
      await getFilesFromAWS({
        folderName: "products",
        files: product.files,
      });
    }
  } catch (error) {
    console.log("falle");
    return console.log(error);
  }
}
