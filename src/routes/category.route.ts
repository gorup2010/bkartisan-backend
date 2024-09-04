import { Router } from 'express';
import {
  getCategoryByLevel,
  getCategoryChildren,
  getCategoryLevel3,
  getGifts,
} from '../controllers/category.js';
const categoryRouter = Router();

categoryRouter.get('/categories', getCategoryLevel3);

categoryRouter.get('/categories/gifts', getGifts);

categoryRouter.get('/categories/:level', getCategoryByLevel);

categoryRouter.post('/categories/children', getCategoryChildren);

export default categoryRouter;
