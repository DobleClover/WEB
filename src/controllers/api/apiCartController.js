import db from "../../database/models/index.js";
import {
  populateSize,
} from "../../utils/helpers/populateStaticDb.js";
import { getVariationsFromDB } from "./apiVariationsController.js";
import { v4 as UUIDV4 } from "uuid";
import { Op } from "sequelize";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import { deleteSensitiveUserData } from "./apiUserController.js";
const { TempCartItem } = db;

const controller = {
  handleGetCartItems: async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: "No user id was provided",
          data: null,
        });
      }
      const tempCartItems = await findTempCartItemsByUserId(userId);
      if (!tempCartItems) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "Internal server error",
          data: null,
        });
      };
      const dbColors = await db.Color.findAll();
      tempCartItems.forEach((tempItem) => {
        const { sizes_id, colors_id } = tempItem;
        tempItem.size = populateSize(sizes_id);
        tempItem.color = dbColors.find(dbColor=>dbColor.id == colors_id);
      });
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: "Successfully fetched cart",
        data: tempCartItems,
      });
    } catch (error) {
      console.log(`Error obtaining cart: ${error}`);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Internal server error",
        data: null,
      });
    }
  },
  handleCreateCartItem: async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: "No user id was provided",
          data: null,
        });
      }
      const { body } = req;
      
      
      const { variations_id } = body;

      const variationExists = await getVariationsFromDB(variations_id);
      if (!variationExists) {
        console.log("variation not found");
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "Internal server error",
          data: null,
        });
      }
      const isCartItemCreated = await createCartItemInDb(body, userId);
      if (!isCartItemCreated) {
        console.log("failing creating item");
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "Internal server error",
          data: null,
        });
      }
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: "Succesfully added item to cart",
      });
    } catch (error) {
      console.log(`error creating cart item: ${error}`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Internal server error",
        data: null,
      });
    }
  },
  handleDeleteCartItem: async (req, res) => {
    try {
      const cartItemId = req.params.cartItemId;
      if (!cartItemId) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          msg: "Internal server error",
          ok: false,
        });
      }
      const isDeleted = await deleteCartItemInDb(cartItemId);
      if (!isDeleted) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          msg: "Internal server error",
          ok: false,
        });
      }
      return res.status(HTTP_STATUS.OK.code).json({
        msg: "Succesfully deleted item",
        ok: true,
      });
    } catch (error) {
      console.log(`Error deleting cart item`);
      console.log(error);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        msg: "Internal server error",
        ok: false,
      });
    }
  },
  handleUpdateUserCart: async (req, res) => {
    try {
      let { tempCartItems } = req.body;
      const userId = req.params.userId;
      let cartItemsFromDB = getDeepCopy(
        await db.TempCartItem.findAll({
          where: {
            users_id: userId,
          },
        })
      );
      tempCartItems = tempCartItems.map((item) => {
        const cartItemFromDB = cartItemsFromDB.find(
          (dbItem) => dbItem.variations_id == item.id
        );
        return {
          id: cartItemFromDB.id,
          variations_id: cartItemFromDB.variations_id,
          users_id: userId,
          quantity: item.quantity,
        };
      });
      // Obtener los IDs de los productos enviados en el body
      const sentVariationIds = tempCartItems.map((item) => item.id);
      
      // Determinar qué productos hay que eliminar (los que están en la DB pero no en `tempCartItems`)
      const itemsToDelete = cartItemsFromDB
        .filter((dbItem) => !sentVariationIds.includes(dbItem.id))
        .map((dbItem) => dbItem.id);

      // Eliminar los productos que ya no están en el body
      if (itemsToDelete.length > 0) {
        await db.TempCartItem.destroy({
          where: {
            id: itemsToDelete,
          },
        });
      };
    //   console.log(tempCartItems);
      
      // Hago un bulkUpdate de las cantidades
      await db.TempCartItem.bulkCreate(tempCartItems, {
        updateOnDuplicate: ["quantity"],
      });
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        updatedCardItems: tempCartItems,
      });
    } catch (error) {
      console.log(`Error updating cart`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        msg: "Internal server error",
        ok: false,
      });
    }
  },
};

export default controller;

async function findTempCartItemsByUserId(userId) {
  try {
    let tempCartItems = await TempCartItem.findAll({
      where: {
        users_id: userId,
      },
      include: ["product", "user"],
    });
    if (!tempCartItems) return [];
    tempCartItems = getDeepCopy(tempCartItems);
    tempCartItems.forEach(tempItem=>deleteSensitiveUserData(tempItem.user));
    return tempCartItems;
  } catch (error) {
    console.log(`Error finding cart in db: ${error}`);
    return [];
  }
}

async function createCartItemInDb(payload, userId) {
  try {
    const { variations_id, quantity } = payload;
    const objectToCreate = {
      id: UUIDV4(),
      variations_id,
      users_id: userId,
      quantity,
      created_at: new Date(),
    };
    await TempCartItem.create(objectToCreate);
    return true;
  } catch (error) {
    console.log(`Error creating cart item: ${error}`);
    return false;
  }
}

async function deleteCartItemInDb(cartItemId) {
  try {
    const itemsDeleted = await TempCartItem.destroy({
      where: {
        id: cartItemId,
      },
    });
    return itemsDeleted > 0;
  } catch (error) {
    console.log(`Error deleting item in db: ${error}`);
    return false;
  }
}
