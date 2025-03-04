import express from 'express';
const router = express.Router();
import apiPhoneController from '../../controllers/api/apiPhoneController.js';
import formValidations from '../../middlewares/formValidations.js';
// Validators
// POST
router.post('/',apiPhoneController.createPhone);
// PUT
router.put('/',apiPhoneController.updatePhone);

// DELETE
router.delete('/',apiPhoneController.destroyPhone);

export default router;
