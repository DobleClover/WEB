import express from 'express';
import apiCartController from '../../controllers/api/apiCartController.js';

const router = express.Router();
const { handleCreateCartItem, handleGetCartItems, handleDeleteCartItem, handleUpdateUserCart } = apiCartController;

router.get('/:userId', handleGetCartItems);
router.post('/:userId',  handleCreateCartItem);
router.put('/:userId',  handleUpdateUserCart);
router.delete('/:cartItemId', handleDeleteCartItem);

export default router;
