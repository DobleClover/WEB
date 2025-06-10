import db from "../../database/models/index.js";
// Librerias
import Sequelize from "sequelize";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { fileURLToPath } from "url";
// way to replace __dirname in es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// UTILS
import systemMessages from "../../utils/staticDB/systemMessages.js";
import generateRandomCodeWithExpiration from "../../utils/helpers/generateRandomCodeWithExpiration.js";
import capitalizeFirstLetterOfEachWord from "../../utils/helpers/capitalizeFirstLetterOfString.js";
import getDeepCopy from "../../utils/helpers/getDeepCopy.js";

import provinces from "../../utils/staticDB/provinces.js";
import sendCodesMail from "../../utils/helpers/sendverificationCodeMail.js";
import ordersStatuses from "../../utils/staticDB/ordersStatuses.js";
import { getUserAddressesFromDB } from "./apiAddressController.js";
import { getVariationsFromDB } from "./apiVariationsController.js";

import { getMappedErrors } from "../../utils/helpers/getMappedErrors.js";
import { getOrdersFromDB } from "./apiOrderController.js";
import { getProductsFromDB } from "./apiProductController.js";
import nodemailer from "nodemailer";
import mailConfig from "../../utils/staticDB/mailConfig.js";
const { User } = db;
import { HTTP_STATUS } from "../../utils/staticDB/httpStatusCodes.js";
import generateHexCode from "../../utils/helpers/generateHexCode.js";
import countries from "../../utils/staticDB/countries.js";
import { createWelcomeCoupon } from "./apiCouponController.js";

const { verify } = jwt;

// ENV
const webTokenSecret = process.env.JSONWEBTOKEN_SECRET;

const controller = {
  createUser: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        //Si hay errores en el back...
        //Para saber los parametros que llegaron..
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/user",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let userDataToDB = generateUserObj(req.body);
      const userCreated = await insertUserToDB(userDataToDB); //Creo el usuario
      let emailResponse = await generateAndInstertEmailCode(userDataToDB);
      if (!emailResponse)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({});
      let objToSetCookie = {
        id: userDataToDB.id,
        version: generateHexCode(10),
      };
      await setUserAccessCookie({ obj: objToSetCookie, type: 1, res });
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.CREATED.code).json({
        meta: {
          status: HTTP_STATUS.CREATED.code,
          url: "/api/user",
          method: "POST",
        },
        ok: true,
        msg: systemMessages.userMsg.createSuccesfull,
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiUserController.createUser`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  updateUser: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        //Si hay errores en el back...
        //Para saber los parametros que llegaron..
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/user",
            method: "PUT",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let { id } = req.params;

      let dbUser = await getUsersFromDB(id);
      if (!dbUser)
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .json({ ok: false, msg: "Usuario no encontrado" });

      let userObjToUpdate = generateUserObj(req.body);
      userObjToUpdate.id = id;
      //Estas cosas ACA no actualizo
      delete userObjToUpdate.email;
      delete userObjToUpdate.password;
      delete userObjToUpdate.user_roles_id;
      delete userObjToUpdate.verified_email;

      let updateResponse = await updateUserFromDB(userObjToUpdate, id);
      if (!updateResponse) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
        });
      }
      // Le  mando ok con el redirect al email verification view
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/user",
          method: "PUT",
        },
        ok: true,
        msg: systemMessages.userMsg.updateSuccesfull,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.updateUser`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  destroyUser: async (req, res) => {
    try {
      let { id } = req.params;
      let dbUser = await getUsersFromDB(id);
      if (!dbUser)
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .json({ ok: false, msg: "Usuario no encontrado" });
      // Lo borro de db
      await db.User.destroy({
        where: {
          id: id,
        },
      });
      // Borro cookie y session
      clearUserSession(req,res)
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/user",
          method: "DELETE",
        },
        ok: true,
        msg: systemMessages.userMsg.destroySuccesfull, //TODO: ver tema idioma
        redirect: "/",
      });
    } catch (error) {
      console.log(`Falle en apiUserController.destroyUser`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  getUserOrders: async (req, res) => {
    try {
      let { users_id } = req.query;
      if (!users_id)
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
        });

      let userOrders = (await getOrdersFromDB({ users_id })) || [];

      // return res.send(ordersToPaint);
      //Una vez tengo todas las ordenes, obtengo todos los productos que quiero mostrar, y por cada uno hago el setKeysToReturn
      let idsToLook = [];
      userOrders?.forEach((order) => {
        order.orderItems?.forEach(
          (orderItem) =>
            !idsToLook.includes(orderItem.variations_id) &&
            idsToLook.push(orderItem.variations_id)
        );
      });
      //Una vez obtenido, agarro los productos de DB para agarrar sus fotos
      let variationsFromDB = await getVariationsFromDB(idsToLook);
      userOrders?.forEach((order) => {
        order.orderItems?.forEach((orderItem) => {
          let variationFromDB = variationsFromDB.find(
            (prod) => prod.id == orderItem.variations_id
          );
          orderItem.variation = variationFromDB;
        });
      });

      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/user/order",
          method: "GET",
        },
        ok: true,
        data: userOrders,
      });
    } catch (error) {
      console.log(`Falle en apiUserController.getUserOrders`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  getUserAddresses: async (req, res) => {
    try {
      let { userLoggedId } = req.session;
      let userAddresses = await getUserAddressesFromDB(userLoggedId);
      return res.status(HTTP_STATUS.OK.code).json({
        meta: {
          status: HTTP_STATUS.OK.code,
          url: "/api/user/address",
          method: "GET",
        },
        ok: true,
        addresses: userAddresses || [],
      });
    } catch (error) {
      console.log(`Falle en apiUserController.getUserAddresses`);
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({ error });
    }
  },
  generateNewEmailCode: async (req, res) => {
    try {
      let { users_id } = req.query;
      // busco el usuario
      const userFromDB = await getUsersFromDB(users_id);
      if (!userFromDB)
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .json({ ok: false, msg: "Usuario no encontrado" });
      //Aca lo encontro, genero el codigo si no esta verificado
      if (!userFromDB.verified_email)
        await generateAndInstertEmailCode(userFromDB);
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: systemMessages.userMsg.verificationCodeSuccess,
      });
    } catch (error) {
      console.log("Falle en apiUserController.getEmailCode:", error);
      return res.json({ error });
    }
  },
  handleCheckForUserLogged: async (req, res) => {
    try {
      const token = req.cookies.userAccessToken;
      if (!token) {
        return res.status(HTTP_STATUS.OK.code).json({
          ok: true,
          data: null,
        });
      }
      const user = await verifyUserIsLogged(token, true);
      if (!user) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          data: null,
        });
      }
      setUserKeysToReturn(user);
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        data: user,
      });
    } catch (error) {
      console.log(`error fetching user logged: ${error}`);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        data: {
          isLogged: false,
        },
        msg: "Internal server error",
      });
    }
  },
  checkForEmailCode: async (req, res) => {
    try {
      let { users_id } = req.query;
      let dbUser = await getUsersFromDB(users_id);
      if (!dbUser)
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .json({ ok: false, msg: "Usuario no encontrado" });
      let { code } = req.body;
      code = JSON.parse(code);

      // Primero me fijo que el expiration time este bien
      const codeExpirationTime = new Date(dbUser.expiration_time);
      const currentTime = new Date();
      // Este if quiere decir que se vencio
      if (currentTime > codeExpirationTime) {
        return res.status(HTTP_STATUS.OK.code).json({
          ok: false,
          msg: "El codigo ha vencido, solicita otro e intente nuevamente.",
        });
      }
      // Aca el tiempo es correcto ==> Chequeo codigo
      if (code != dbUser.verification_code) {
        return res.status(HTTP_STATUS.OK.code).json({
          ok: false,
          msg: systemMessages.userMsg.userVerifiedFail,
        });
      }
      // Aca esta todo ok ==> Hago el update al usuario y mando el status ok
      let updateObj = {
        verified_email: 1,
        verification_code: null,
        expiration_time: null,
      };
      let response = await updateUserFromDB(updateObj, users_id);
      if (!response) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "Internal server error",
        });
      }
      //Ahora elimino todos los usuarios con ese mismo mail y sin verificar
      await db.User.destroy({
        where: {
          email: dbUser.email,
          verified_email: false,
        },
      });
      await createWelcomeCoupon(users_id);
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: systemMessages.userMsg.userVerifiedSuccess,
      });
    } catch (error) {
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Internal server error",
      });
    }
  },
  processLogin: async (req, res) => {
    try {
      let { email, password } = req.body;
      email = email.toLowerCase().trim();
      let usersWithSameEmail = await db.User.findAll({ where: { email } });

      // Encuentra el primer usuario con contraseña válida
      let userToLog = usersWithSameEmail.find((user) =>
        bcrypt.compareSync(password, user.password)
      );

      if (userToLog) {
        req.session.userLoggedId = userToLog.id;
        let objToSetCookie = {
          id: userToLog.id,
          version: generateHexCode(10),
        };
        await setUserAccessCookie({ obj: objToSetCookie, type: 1, res });

        if (userToLog.user_roles_id == 1) {
          await setUserAccessCookie({ obj: objToSetCookie, type: 2, res });
        }

        return res.status(HTTP_STATUS.OK.code).json({
          meta: {
            status: HTTP_STATUS.OK.code,
            method: "POST",
            url: "api/user/login",
          },
          ok: true,
          msg: "Inicio de sesión correcto",
          redirect: "/",
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED.code).json({
        meta: {
          status: HTTP_STATUS.UNAUTHORIZED.code,
          method: "POST",
          url: "api/user/login",
        },
        ok: false,
        msg: "Credenciales incorrectas",
      });
    } catch (error) {
      console.error(`Error in processLogin: ${error}`);
      console.error(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Err",
      });
    }
  },
  generatePasswordToken: async (req, res) => {
    try {
      const { id, email } = req.body;
  
      if (!id && !email) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          ok: false,
          msg: "Debe enviar el ID o el email del usuario",
        });
      }
  
      let dbUser;
  
      if (email) {
        dbUser = await db.User.findOne({ where: { email } });
      } else {
        dbUser = await getUsersFromDB(id);
      }
  
      if (!dbUser) {
        return res.status(HTTP_STATUS.NOT_FOUND.code).json({
          ok: false,
          msg: "Usuario no encontrado",
        });
      }
  
      const resetToken = generateHexCode(20);
  
      await updateUserFromDB(
        {
          password_token: resetToken,
          expiration_time: new Date(Date.now() + 3600000), // 1 hora
        },
        dbUser.id
      );
  
      const resetLink = `${process.env.BASE_URL}modificar-clave?token=${resetToken}`;
      const logoutAllLink =  `${process.env.BASE_URL}logout-all?token=${resetToken}`;
      const emailHasBeenSent = await sendCodesMail(2, {
        user: dbUser,
        link: resetLink,
        logoutAllLink
      });
  
      if (!emailHasBeenSent) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
          ok: false,
          msg: "Error al enviar el email",
        });
      }
  
      return res.status(200).json({
        ok: true,
        msg: "Se envió un email con instrucciones para restablecer la contraseña.",
      });
    } catch (error) {
      console.error(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Error interno",
      });
    }
  },  
  checkPasswordToken: async (req, res) => {
    try {
      // Traigo errores
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        //Si hay errores en el back...
        //Para saber los parametros que llegaron..
        let { errorsParams, errorsMapped } = getMappedErrors(errors);
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST.code,
            url: "/api/user/modificar-clave",
            method: "POST",
          },
          ok: false,
          errors: errorsMapped,
          params: errorsParams,
          msg: systemMessages.formMsg.validationError,
        });
      }
      let { password, token } = req.body;
      // Buscar usuario por token
      const dbUser = await db.User.findOne({
        where: {
          password_token: token,
        },
      });

      if (!dbUser) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          ok: false,
        });
      }
      // Primero me fijo que el expiration time este bien
      const codeExpirationTime = new Date(dbUser.expiration_time);
      const currentTime = new Date();
      // Este if quiere decir que se vencio
      if (currentTime > codeExpirationTime) {
        return res.status(HTTP_STATUS.OK.code).json({
          ok: false,
          msg: "El codigo ha vencido, solicita otro e intente nuevamente.",
        });
      }
      // Hashear la nueva contraseña
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Actualizar la contraseña y eliminar el token de recuperación
      let objToUpdate = {
        password: hashedPassword,
        password_token: null,
        expiration_time: null,
      };

      await updateUserFromDB(objToUpdate, dbUser.id);
      await setNewVersionForUser(dbUser.id); //Lo deslogueo de todas las sesiones
      return res.status(200).json({
        ok: true,
        msg: "Contraseña restablecida con éxito.",
      });
    } catch (error) {
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Error interno",
      });
    }
  },
  unlogAllSessions: async (req, res) => {
    try {
      let { users_id } = req.body;
      if (!users_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).json({ ok: false });
      }
      // Buscar al usuario
      const dbUser = await getUsersFromDB(users_id);
      if (!dbUser) {
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .json({ ok: false, msg: "Usuario no encontrado" });
      }
      await setNewVersionForUser(users_id);
      return res.status(HTTP_STATUS.OK.code).json({
        ok: true,
        msg: "Se ha cerrado sesión en todos los dispositivos.",
      });
    } catch (error) {
      console.log(error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
        ok: false,
        msg: "Error interno",
      });
    }
  },
};

export default controller;

export async function generateAndInstertEmailCode(user) {
  try {
    // Genero el codigo de verificacion
    const { verificationCode, expirationTime } =
      generateRandomCodeWithExpiration();
    let emailHasBeenSent = await sendCodesMail(1, {
      code: verificationCode,
      user,
    });
    if (!emailHasBeenSent) return false;
    let objectToDB = {
      verification_code: verificationCode,
      expiration_time: expirationTime,
    };
    //Lo cambio en db
    await db.User.update(objectToDB, {
      where: {
        id: user.id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en generateAndInstertEmailCode`);
    console.log(error);
    return false;
  }
}

let userIncludeArray = ["tempCartItems", "orders", "phones", "addresses"];
export async function getUsersFromDB(id) {
  try {
    let usersToReturn, userToReturn;
    // Condición si id es un string
    if (typeof id === "string") {
      userToReturn = await db.User.findByPk(id, {
        include: userIncludeArray,
      });
      if (!userToReturn) return null;
      userToReturn = userToReturn && getDeepCopy(userToReturn);
      setUserKeysToReturn(userToReturn);
      return userToReturn;
    }

    // Condición si id es un array
    if (Array.isArray(id)) {
      usersToReturn = await db.User.findAll({
        where: {
          id: id, // id es un array, se hace un WHERE id IN (id)
        },
        include: userIncludeArray,
      });
      if (!usersToReturn || !usersToReturn.length) return null;
      usersToReturn = getDeepCopy(usersToReturn);
      usersToReturn.forEach((user) => setUserKeysToReturn(user));
      return usersToReturn;
    }
    // Condición si id es undefined
    if (id === undefined) {
      usersToReturn = await db.User.findAll({
        include: userIncludeArray,
      });
      if (!usersToReturn || !usersToReturn.length) return null;
      usersToReturn = getDeepCopy(usersToReturn);
      return usersToReturn;
    }
  } catch (error) {
    console.log(`Falle en getUsers`);
    return console.log(error);
  }
}

export function deleteSensitiveUserData(user) {
  if (!user) return;
  delete user.password;
  delete user.password_token;
  delete user.verification_code;
  delete user.expiration_time;
}

export async function updateUserFromDB(obj, id) {
  try {
    if (!obj || !id) return undefined;

    //Lo updateo en db
    await db.User.update(obj, {
      where: {
        id,
      },
    });
    return true;
  } catch (error) {
    console.log(`Falle en updateUserFromDB`);
    console.log(error);
    return undefined;
  }
}

export async function insertUserToDB(obj) {
  try {
    if (!obj) return undefined;
    //Lo inserto en db
    let createdUser = await db.User.create(obj);
    return createdUser;
  } catch (error) {
    console.log(`Falle en insertUserToDB`);
    console.log(error);
    return undefined;
  }
}

function setUserKeysToReturn(user) {
  user.phones?.forEach((phone) => {
    phone.country = countries.find((country) => country.id == phone.countries_id);
  });
  user.addresses?.forEach((phone) => {
    phone.province = provinces.find((dbProv) => dbProv.id == phone.provinces_id);
  });
  const firstNameLetter = user.first_name.split("")[0];
  const lastNameLetter = user.last_name.split("")[0];
  user.initials = firstNameLetter + lastNameLetter;
  user.name = `${user.first_name} ${user.last_name}`;
  deleteSensitiveUserData();
}

function generateUserObj(body) {
  // Datos del body
  let { first_name, last_name, email, genders_id, password } = body;

  //Nombres y apellidos van capitalziados
  first_name = capitalizeFirstLetterOfEachWord(first_name, true).trim();
  last_name = capitalizeFirstLetterOfEachWord(last_name, true).trim();
  email = email?.toLowerCase().trim();
  return {
    id: uuidv4(),
    first_name,
    last_name,
    email: email || null,
    genders_id: genders_id ? parseInt(genders_id) : null,
    password: password ? bcrypt.hashSync(password, 10) : null, //encripta la password ingresada ,
    user_roles_id: 2, //User
    verified_email: false,
  };
}

export async function setUserAccessCookie({ obj, type = 1, res }) {
  //El type es para ver bien que setear
  let cookieTime, token, tokenName;
  if (type == 1) {
    tokenName = "userAccessToken";
    // Lo tengo que loggear directamente
    cookieTime = 1000 * 60 * 60 * 24 * 7; //1 Semana

    // Generar el token de autenticación
    token = jwt.sign(
      { id: obj.id, session_version: obj.version },
      webTokenSecret,
      {
        expiresIn: "1w",
      }
    ); // genera el token
  } else {
    //Token de admin
    tokenName = "adminAuth";
    cookieTime = 1000 * 60 * 60 * 4; //4 horas
    token = jwt.sign(
      { id: obj.id, session_version: obj.version },
      webTokenSecret,
      {
        expiresIn: "4h",
      }
    );
  }
  res.cookie(tokenName, token, {
    maxAge: cookieTime,
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: "strict",
  });
  // Una vez la seteo updateo la version
  await updateUserFromDB(
    {
      session_version: obj.version,
    },
    obj.id
  );
}

export async function verifyUserIsLogged(token, returnUser = false) {
  try {
    const decoded = verify(token, webTokenSecret);

    const user = await getUsersFromDB(decoded.id);
    if (!user || user.session_version !== decoded.session_version) {
      return undefined;
    }
    if (returnUser) return user;
    return true;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

export async function setNewVersionForUser(users_id) {
  try {
    // Cambiar el sessionVersion del usuario
    const newSessionVersion = generateHexCode(10);
    await updateUserFromDB(
      {
        session_version: newSessionVersion,
      },
      users_id
    );
  } catch (error) {
    console.log(error);
    return;
  }
}
