import express from 'express';
import apiProductController from '../../controllers/api/apiProductController.js';
import formValidations from '../../middlewares/formValidations.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';

const router = express.Router();
const { handleCreateProduct, handleUpdateProduct, handleGetAllProducts, handleDeleteProduct } = apiProductController;
const {productFields} = formValidations;

router.get('/', handleGetAllProducts);
router.post('/',   multerMiddleware.array('images'), productFields, handleCreateProduct);
router.put('/:id',   multerMiddleware.array('images'), productFields, handleUpdateProduct);
router.delete('/:id', handleDeleteProduct);

export default router;
