import express from "express";
const router = express.Router();
import apiUserController from "../../controllers/api/apiUserController.js";
import formValidations from "../../middlewares/formValidations.js";

// Validators

// GET
router.get("/order", apiUserController.getUserOrders);
router.get("/check-for-user-logged", apiUserController.handleCheckForUserLogged);
router.get("/send-verification-code", apiUserController.generateNewEmailCode);

// POST
router.post("/", formValidations.userCreateFields, formValidations.passwordFields, apiUserController.createUser);
router.post("/login", apiUserController.processLogin);
router.post("/check-verification-code", apiUserController.checkForEmailCode);
router.post("/generate-password-token", apiUserController.generatePasswordToken);
router.post("/check-password-token", formValidations.passwordFields, apiUserController.checkPasswordToken );
router.post("/logout-all", apiUserController.unlogAllSessions );

// PUT
router.put("/:id", formValidations.userUpdateFields, apiUserController.updateUser);


// DELETE

export default router;
