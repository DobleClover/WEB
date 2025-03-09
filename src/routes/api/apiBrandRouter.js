import express from 'express';
import apiBrandController from '../../controllers/api/apiBrandController.js';
import formValidations from '../../middlewares/formValidations.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';

const router = express.Router();

router.get('/', apiBrandController.getBrands);
router.post('/',multerMiddleware.single('logo'), formValidations.brandFields, apiBrandController.createBrand); //TODO: AGREGAR MIDDLEWARE
router.put('/:id', multerMiddleware.single('logo'), formValidations.brandFields, apiBrandController.updateBrand);
router.delete('/:id', apiBrandController.destroyBrand);

export default router;
