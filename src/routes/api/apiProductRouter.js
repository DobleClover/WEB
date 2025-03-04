import express from 'express';
import apiProductController from '../../controllers/api/apiProductController.js';
import formValidations from '../../middlewares/formValidations.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';

const router = express.Router();
const { handleCreateProduct, handleUpdateProduct, handleGetAllProducts, handleDeleteProduct } = apiProductController;
const {productFields} = formValidations;

router.get('/', handleGetAllProducts);
router.post('/', adminCredentialsMiddleware,  multerMiddleware.array('images'), handleCreateProduct);
router.put('/', adminCredentialsMiddleware,  multerMiddleware.array('images'), handleUpdateProduct);
router.delete('/:productId',adminCredentialsMiddleware, handleDeleteProduct);

export default router;
