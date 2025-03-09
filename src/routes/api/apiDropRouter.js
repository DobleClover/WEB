import express from "express";
import apiDropController from "../../controllers/api/apiDropController.js";
import formValidations from "../../middlewares/formValidations.js";
import multerMiddleware from "../../middlewares/multerMiddleware.js";
import adminCredentialsMiddleware from "../../middlewares/adminCredentialsMiddleware.js";

const router = express.Router();

const { dropFields } = formValidations;

router.get("/", apiDropController.getDrops);
router.post(
  "/",
  multerMiddleware.array("images"),
  dropFields,
  apiDropController.createDrop
);
router.put(
  "/:id",
  multerMiddleware.array("images"),
  dropFields,
  apiDropController.updateDrop
);
router.delete("/:id", apiDropController.destroyDrop);

export default router;
