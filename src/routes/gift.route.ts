import { Router } from 'express';
import {
  getGifts, createGift, deleteGift, updateGift, getGiftDetail
} from '../controllers/gift.js';
const giftRouter = Router();


giftRouter.get('/gifts', getGifts);
giftRouter.get('/gifts/:id', getGiftDetail);
giftRouter.post('/gifts', createGift);
giftRouter.patch('/gifts/:id', updateGift);
giftRouter.delete('/gifts', deleteGift);


export default giftRouter;
