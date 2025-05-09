import express from 'express';
const router = express.Router();
import apiColorController from '../../controllers/api/apiColorController.js';
import formValidations from '../../middlewares/formValidations.js';
// Validators

// GET
router.get('/',apiColorController.getColors);
// POST
router.post('/',formValidations.colorFields,apiColorController.createColor);
// PUT
router.put('/:id',formValidations.colorFields,apiColorController.updateColor);

// DELETE
router.delete('/:id',apiColorController.destroyColor);

export default router;
