import express from "express";
import apiBrandController from "../../controllers/api/apiBrandController.js";
import formValidations from "../../middlewares/formValidations.js";
import multerMiddleware from "../../middlewares/multerMiddleware.js";
import adminCredentialsMiddleware from "../../middlewares/adminCredentialsMiddleware.js";

const router = express.Router();

router.get("/", apiBrandController.getBrands);
// POST
router.post(
  "/",
  multerMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "isotype", maxCount: 1 },
    { name: "logotype", maxCount: 1 },
  ]),
  formValidations.brandFields,
  apiBrandController.createBrand
); 

// PUT
router.put(
  "/:id",
  multerMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "isotype", maxCount: 1 },
    { name: "logotype", maxCount: 1 },
  ]),
  formValidations.brandFields,
  apiBrandController.updateBrand
);
// DELETE
router.delete("/:id", apiBrandController.destroyBrand);

export default router;
