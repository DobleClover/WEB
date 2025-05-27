import express from 'express';
import apiTypeController from '../../controllers/api/apiTypeController.js';

const router = express.Router();

router.get('/payment', apiTypeController.getPaymentTypes);
router.get('/shipping', apiTypeController.getShippingTypes);
router.get('/country', apiTypeController.getCountries);
router.get('/province', apiTypeController.getProvinces);
router.get('/size', apiTypeController.getSizes);
router.get('/category', apiTypeController.getCategories);
router.get('/gender', apiTypeController.getGenders);
router.get('/order-statuses', apiTypeController.getOrderStatuses);
router.get('/coupon-prefix', apiTypeController.getCouponPrefixes);

export default router;
