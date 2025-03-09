import express from 'express';
const router = express.Router();
import apiAddressController from '../../controllers/api/apiAddressController.js';
import formValidations from '../../middlewares/formValidations.js';
// Validators

// GET


// POST
router.post('/',formValidations.addressFields,apiAddressController.createAddress);
// PUT
router.put('/:id',formValidations.addressFields,apiAddressController.updateAddress);

// DELETE
router.delete('/:id',apiAddressController.destroyAddress);

export default router;
