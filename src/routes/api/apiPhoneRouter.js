import express from 'express';
const router = express.Router();
import apiPhoneController from '../../controllers/api/apiPhoneController.js';
import formValidations from '../../middlewares/formValidations.js';
// Validators
// POST
router.post('/',apiPhoneController.createPhone);
// PUT
router.put('/:id',apiPhoneController.updatePhone);

// DELETE
router.delete('/:id',apiPhoneController.destroyPhone);

export default router;
