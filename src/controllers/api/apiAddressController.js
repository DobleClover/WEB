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
  createAddress: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/address",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let addressObjToDB = generateAddressObject(req.body);
      // Si llega por default entonces actualizo todas las otras
      if (addressObjToDB.default) {
        await db.Address.update(
          {
            default: 0,
          },
          {
            where: {
              users_id: addressObjToDB.users_id,
            },
          }
        );
      }
      let createdAddress = await insertAddressToDB(addressObjToDB);

      if (!createdAddress)
        return res
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
          .json({ msg: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/address",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.addressMsg.createSuccesfull,
        address: createdAddress,
      });
    } catch (error) {
      console.log(`Falle en apiAddressController.createUser`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updateAddress: async (req, res) => {
    try {
      // Traigo errores
      // Traigo errores
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/address",
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
      let addressObjToDB = generateAddressObject(req.body);
      addressObjToDB.id = id;
      if (addressObjToDB.default) {
        await db.Address.update(
          {
            default: 0,
          },
          {
            where: {
              users_id: addressObjToDB.users_id,
            },
          }
        );
      }
      await updateAddressFromDB(addressObjToDB, addressObjToDB.id);

      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/address",
          method: "PUT",
          redirect: "/user/address",
        },
        ok: true,
        msg: systemMessages.addressMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateAddress`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyAddress: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });
      // Lo borro de db
      let response = await destroyAddressFromDB(id);
      if (!response)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json();
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/address",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.addressMsg.destroySuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiAddressController.destroyAddress`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
};

export default controller;

let addressIncludeArray = ["user"];
export async function insertAddressToDB(obj) {
  try {
    //Lo creo en db
    let createdAddress = await db.Address.create(obj);
    return createdAddress || undefined;
  } catch (error) {
    console.log(`Falle en insertAddressToDB`);
    console.log(error);
    return undefined;
  }
}
export async function updateAddressFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.Address.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateAddressToDB`);
    console.log(error);
    return undefined;
  }
}
export async function destroyAddressFromDB(id) {
  try {
    if (!id) return undefined;

    //Lo borro de db
    await db.Address.destroy({
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateAddressToDB`);
    console.log(error);
    return undefined;
  }
}
export async function getUserAddressesFromDB(id = undefined) {
  try {
    if (!id) return [];
    let addresses = await db.Address.findAll({
      where: {
        users_id: id,
      },
      include: addressIncludeArray,
    });
    addresses = getDeepCopy(addresses);
    addresses.forEach((dbAddress) => setAddressKeysToReturn(dbAddress));
    return addresses;
  } catch (error) {
    console.log(`Falle en getUserAddresesFromDB`);
    console.log(error);
    return [];
  }
}
export function generateAddressObject(address) {
  // objeto para armar la address
  let {
    users_id,
    street,
    label,
    detail,
    zip_code,
    city,
    provinces_id,
    defaultAddress,
  } = address;

  let dataToDB = {
    id: uuidv4(),
    users_id,
    street, //libertado 2222
    label, //Casa
    detail: detail || null, //2b
    zip_code,
    city,
    provinces_id,
    default: defaultAddress,
  };
  return dataToDB;
}
export async function getAddresesFromDB(id) {
  try {
    let addressesToReturn, addressToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      addressToReturn = await db.Address.findByPk(id, {
        include: addressIncludeArray,
      });
      if (!addressToReturn) return null;
      addressToReturn = addressToReturn && getDeepCopy(addressToReturn);
      setAddressKeysToReturn(addressToReturn);
      return addressToReturn;
    }

    // Condición si id es un array
    else if (Array.isArray(id)) {
      addressesToReturn = await db.Address.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: addressIncludeArray,
      });
      if (!addressesToReturn || !addressesToReturn.length) return null;
      addressesToReturn = getDeepCopy(addressesToReturn);
    }
    // Condición si id es undefined
    else if (id === undefined) {
      addressesToReturn = await db.Address.findAll({
        include: addressIncludeArray,
      });
      if (!addressesToReturn || !addressesToReturn.length) return null;
      addressesToReturn = getDeepCopy(addressesToReturn);
    }
    addressToReturn.forEach((address) => setAddressKeysToReturn(address));
    return addressesToReturn;
  } catch (error) {
    console.log("Falle en getUserAddresesFromDB");
    console.error(error);
    return null;
  }
}

function setAddressKeysToReturn(address) {
  deleteSensitiveUserData(address.user);
  address.province = provinces.find(
    (dbProvince) => dbProvince.id == address.provinces_id
  );
}
