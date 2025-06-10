import express from 'express';
import mainController from '../controllers/mainController.js';
import getLastURL from '../middlewares/getLastURL.js';
import userIsLoggedMiddleware from '../middlewares/userIsLogged.js';
const router = express.Router();

router.get('/',mainController.index);
router.get('/tienda',mainController.productList);
router.get('/dobleuso',mainController.dobleuso);
router.get('/carro',mainController.cart);
router.get('/verificar', userIsLoggedMiddleware,mainController.userVerification);
router.get('/marcas/:brandId',mainController.brandProductList);
router.get('/producto/:id',mainController.productDetail);
router.get('/drop/:id',mainController.dropList);
router.get('/perfil', userIsLoggedMiddleware, mainController.userProfile);
router.get('/nosotros',mainController.aboutUs);
router.get('/faq',mainController.faq);
router.get('/contacto',mainController.contact);
router.get('/post-compra',mainController.postOrder);
router.get('/logout',getLastURL,mainController.logout);
router.get('/logout-all', mainController.logoutAll);
router.get('/modificar-clave', mainController.passwordReset);
// MERCADOPAGO
router.get('/completar-pago',mainController.completePayment);
router.get('/cancelar-orden',mainController.cancelOrder);

export default router;