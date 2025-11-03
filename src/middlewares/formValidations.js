import { body } from "express-validator";
import validatePasswordString from "../utils/helpers/validatePasswordString.js";
import isJson from "../utils/helpers/isJson.js";
import db from "../database/models/index.js";
import provinces from "../utils/staticDB/provinces.js";
import { getVariationsFromDB } from "../controllers/api/apiVariationsController.js";
import getOnlyNumbers from "../utils/helpers/getOnlyNumbers.js";
import countries from "../utils/staticDB/countries.js";
export default {
  productFields: [
    body(["name", "price"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail(),
    body(["variations"])
      .customSanitizer((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value); // Convertir a array si viene como string
          } catch (error) {
            return []; // Si hay un error, devolver un array vacío (evita que falle el JSON.parse)
          }
        }
        return value;
      })
      .isArray()
      .bail()
      .custom((variationsArray) => {
        const allValid = variationsArray.every((variation) => {
          const allNecesaryFields =
            typeof variation.sizes_id === "number" &&
            typeof variation.colors_id === "string" &&
            typeof variation.quantity === "number";

          return allNecesaryFields;
        });

        if (!allValid) {
          throw new Error("Faltan propiedades necesarias en las variaciones");
        }

        return true;
      }),
  ],
  userCreateFields: [
    body(["first_name", "last_name", "email"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail()
      .custom((value, { req }) => {
        // que sea de tipo string
        // Si viene formato json entonces lo parseo, sino me fijo directamente
        if (isJson(value)) value = JSON.parse(value);
        if (typeof value !== "string") {
          throw new Error();
        }
        return true;
      }),
    body(["email"])
      .isEmail()
      .withMessage("Tipo de email invalido")
      .bail()
      .custom(async (value, { req }) => {
        //No puede ingresar un email que ya esta
        let userEmail = value?.toLowerCase();
        let emailInDataBase = await db.User.findOne({
          where: {
            email: userEmail?.trim(),
            verified_email: 1,
          },
        });
        if (emailInDataBase) {
          throw new Error("Email ya registrado, ingrese otro");
        }
        return true;
      }),
  ],
  userUpdateFields: [
    body(["first_name", "last_name"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail()
      .custom((value, { req }) => {
        // que sea de tipo string
        // Si viene formato json entonces lo parseo, sino me fijo directamente
        if (isJson(value)) value = JSON.parse(value);
        if (typeof value !== "string") {
          throw new Error();
        }
        return true;
      }),
  ],
  userPasswordUpdateFields: [
    body(["password", "rePassword"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail()
      .custom((value, { req }) => {
        // que sea de tipo string
        // Si viene formato json entonces lo parseo, sino me fijo directamente
        if (isJson(value)) value = JSON.parse(value);
        if (typeof value !== "string") {
          throw new Error();
        }
        return true;
      }),
    body(["password"]).custom((value, { req }) => {
      // que sea de tipo string
      // Si viene formato json entonces lo parseo, sino me fijo directamente
      if (isJson(value)) value = JSON.parse(value);
      if (typeof value !== "string") {
        throw new Error();
      }
      //Me fijo que cumpla
      if (!validatePasswordString(value))
        throw new Error("La contraseña debe cumplir con los criterios pedidos");
      //Aca me fijo que coincida con la re-password
      if (value?.trim() !== req.body.rePassword?.trim())
        throw new Error("Las contraseñas deben coincidir");
      return true;
    }),
  ],
  addressFields: [
    body([
      "street",
      "label",
      "detail",
      "zip_code",
      "city",
      "provinces_id",
    ]).custom((value, { req }) => {
      // que sea de tipo string
      // Si viene formato json entonces lo parseo, sino me fijo directamente
      if (isJson(value)) value = JSON.parse(value);
      if (typeof value !== "string") {
        throw new Error();
      }
      return true;
    }),
    body(["street", "label", "zip_code", "city", "provinces_id"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail(),
    body(["provinces_id"]) //Me fijo que el pais este
      .custom((value, { req }) => {
        //No puede ingresar un email que ya esta
        let provinceFromDB = provinces.find((dbProv) => dbProv.id == value);
        if (!provinceFromDB) {
          throw new Error("Provincia no encontrado, intente nuevamente");
        }
        return true;
      }),
  ],
  orderFields: [
    body([
      "first_name",
      "last_name",
      "email",
      "dni",
      "payment_types_id",
      "shipping_types_id",
    ])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail(),
    body(["variations", "phoneObj", "billingAddress"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail(),
    body(["variations"]).custom(async (value, { req }) => {
      let variationIdsToGet = value.map((variation) => variation.id);
      let variationsFromDB = await getVariationsFromDB(variationIdsToGet);

      value.forEach((variation) => {
        let variationFromDBIndex = variationsFromDB.findIndex(
          (variationFromDB) => variationFromDB.id == variation.id
        );
        if (variationFromDBIndex < 0) {
          console.log(`❌ Variación no encontrada: ${variation.id}`);
          throw new Error("Variacion no encontrada");
        }
        let variationFromDB = variationsFromDB[variationFromDBIndex];
        let { quantityRequested } = variation;
        quantityRequested = parseInt(quantityRequested);

        if (quantityRequested > variationFromDB.quantity) {
          console.log(
            `❌ Stock insuficiente para variación ${variation.id}: pedido ${quantityRequested}, disponible ${variationFromDB.quantity}`
          );
          throw new Error("Hay items con stock insuficiente");
        }
      });

      req.body.variationsFromDB = variationsFromDB;
      return true;
    }),

    body(["billingAddress", "shippingAddress"]).custom(
      async (value, { req }) => {
        let provinceFromDB = provinces.find(
          (dbProv) => dbProv.id == value?.provinces_id
        );
        if (value && !provinceFromDB) {
          console.log(
            `❌ Provincia no encontrada: ID recibido: ${value?.provinces_id}`
          );
          throw new Error("Provincia no encontrado");
        }
        return true;
      }
    ),

    body(["phoneObj"]).custom(async (value, { req }) => {
      let countryFromDB = countries.find(
        (country) => country.id == value?.countries_id
      );
      if (value && !countryFromDB) {
        console.log(
          `❌ País no encontrado: ID recibido: ${value?.countries_id}`
        );
        throw new Error("Pais no encontrado");
      }

      console.log(`📞 Número antes: ${value.phone_number}`);
      value.phone_number = getOnlyNumbers(value.phone_number);
      console.log(`📞 Número después: ${value.phone_number}`);

      return true;
    }),
  ],
  colorFields: [
    body(["name"])
      .notEmpty()
      .withMessage("El nombre del color es obligatorio.")
      .bail()
      .trim()
      .toLowerCase()
      .custom(async (name, { req }) => {
        // Verificar si el color ya existe en la base de datos
        const existingColor = await db.Color.findOne({ where: { name } });

        if (existingColor && existingColor.id != req.body.id) {
          throw new Error("El color ya existe.");
        }
        return true;
      }),
  ],
  brandFields: [
    body(["name"])
      .notEmpty()
      .withMessage("El nombre de la marca es obligatorio.")
      .bail()
      .trim()
      .toLowerCase()
      .custom(async (name, { req }) => {
        console.log(req.body.id);
        // Verificar si la marca ya existe en la base de datos
        const existingBrand = await db.Brand.findOne({ where: { name } });

        if (existingBrand && existingBrand.id != req.body.id) {
          throw new Error("La marca ya existe.");
        }
        return true;
      }),
  ],
  dropFields: [
    body(["name"])
      .notEmpty()
      .withMessage("El nombre del drop es obligatorio.")
      .bail(),
    body(["active", "unique"])
      .isBoolean()
      .withMessage("El campo debe ser un booleano (true o false).")
      .toBoolean()
      .bail(),
    body(["productIDS"]).custom((value) => {
      if (typeof value === "string") {
        try {
          value = JSON.parse(value); // Convierte de string a array si es necesario
        } catch (error) {
          throw new Error("El campo 'productIDS' debe ser un array válido.");
        }
      }
      if (!Array.isArray(value)) {
        throw new Error("El campo 'productIDS' debe ser un array.");
      }
      return true;
    }),
    body(["launch_date"])
      .isISO8601()
      .withMessage(
        "El campo 'launch_date' debe ser una fecha válida en formato ISO 8601."
      )
      .bail(),
  ],
  passwordFields: [
    body(["password", "rePassword"])
      .notEmpty()
      .withMessage("Complete todos los campos necesarios")
      .bail()
      .custom((value, { req }) => {
        // que sea de tipo string
        // Si viene formato json entonces lo parseo, sino me fijo directamente
        if (isJson(value)) value = JSON.parse(value);
        if (typeof value !== "string") {
          throw new Error();
        }
        return true;
      }),
    body(["password"]).custom((value, { req }) => {
      // que sea de tipo string
      // Si viene formato json entonces lo parseo, sino me fijo directamente
      if (isJson(value)) value = JSON.parse(value);
      if (typeof value !== "string") {
        throw new Error();
      }
      //Me fijo que cumpla
      if (!validatePasswordString(value))
        throw new Error("La contraseña debe cumplir con los criterios pedidos");
      //Aca me fijo que coincida con la re-password
      if (value?.trim() !== req.body.rePassword?.trim())
        throw new Error("Las contraseñas deben coincidir");
      return true;
    }),
  ],
  settingFields: [
    body(["value"])
      .notEmpty()
      .withMessage("Campos obligatorios incompletos")
      .bail()
      .trim(),
  ],
};
