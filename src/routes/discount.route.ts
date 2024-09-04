import { Router } from 'express';
import {
  applyDiscount,
  clearDiscount,
  createDiscount,
  getDiscountDetails,
  getDiscounts,
  removeDiscount,
  updateDiscount,
} from '../controllers/discount.js';
import { authorize } from '../utils/authorize.js';

const discountRouter = Router();

discountRouter.post('/discounts', authorize, createDiscount);
discountRouter.post('/discounts/:code', applyDiscount);
discountRouter.patch('/discounts/:id', authorize, updateDiscount);
discountRouter.delete('/discounts/reset', clearDiscount);
discountRouter.delete('/discounts/:id', authorize, removeDiscount);
discountRouter.get('/discounts', authorize, getDiscounts);
discountRouter.get('/discounts/:id', authorize, getDiscountDetails);

export default discountRouter;
