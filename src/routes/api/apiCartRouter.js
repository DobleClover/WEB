import express from 'express';
import apiCartController from '../../controllers/api/apiCartController.js';

const router = express.Router();
const { handleCreateCartItem, handleGetCartItems, handleDeleteCartItem, handleUpdateUserCart, handleClearUserCart } = apiCartController;

router.get('/:userId', handleGetCartItems);
router.post('/:userId',  handleCreateCartItem);
router.put('/:userId',  handleUpdateUserCart);
router.delete('/:cartItemId', handleDeleteCartItem);
router.delete("/cart/:userId", handleClearUserCart);


export default router;
