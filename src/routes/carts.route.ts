import { Router } from 'express';
import {
  addToCart,
  deleteItem,
  getCart,
  updateItem,
} from '../controllers/carts.js';
import { authorize } from '../utils/authorize.js';
const cartRouter = Router();

cartRouter.post('/carts', authorize, addToCart);
cartRouter.patch('/carts/:productId', authorize, updateItem);
cartRouter.delete('/carts/:productId', authorize, deleteItem);
cartRouter.get('/carts', authorize, getCart);

export default cartRouter;
