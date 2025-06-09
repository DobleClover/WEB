import express from 'express';
const router = express.Router();
import apiCouponController from '../../controllers/api/apiCouponController.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';
// Validators

// GET
router.get("/", adminCredentialsMiddleware,  apiCouponController.getCoupons);
router.get("/user", apiCouponController.getUserCoupons);
router.get("/validate", apiCouponController.validateCouponCode);
// POST
router.post("/", adminCredentialsMiddleware, apiCouponController.createCoupon);
// PUT


// DELETE
router.delete("/:id", adminCredentialsMiddleware, apiCouponController.destroyCoupon);


export default router;
