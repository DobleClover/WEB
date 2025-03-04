import express from 'express';
const router = express.Router();
import apiOrderController from '../../controllers/api/apiOrderController.js';
import formValidations from '../../middlewares/formValidations.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';
// Validators
// GET
router.get('/',apiOrderController.getOrders);
// POST
router.post('/',formValidations.orderFields,apiOrderController.createOrder);
// PUT
router.put('/order-status/:orderId',adminCredentialsMiddleware,apiOrderController.updateOrderStatus);

// DELETE
router.delete('/paymentFailed/:orderTraID',apiOrderController.orderPaymentFailed);


export default router;
