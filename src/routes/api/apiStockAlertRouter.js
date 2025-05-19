import express from 'express';
const router = express.Router();
import apiStockAlertController from '../../controllers/api/apiStockAlertController.js';
import formValidations from '../../middlewares/formValidations.js';
// Validators
// POST
router.post('/',apiStockAlertController.createStockAlert);
// // PUT
// router.put('/:id',apiStockAlertController.updatePhone);

// // DELETE
// router.delete('/:id',apiStockAlertController.destroyPhone);

export default router;
