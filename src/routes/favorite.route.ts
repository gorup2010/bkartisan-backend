import { Router } from 'express';
import {
  createFavorite,
  deleteFavorite,
  getFavorite,
} from '../controllers/favorite.js';
import { authorize } from '../utils/authorize.js';

export const favoriteRouter = Router();

favoriteRouter.get('/favorites', authorize, getFavorite);
favoriteRouter.post('/favorites', authorize, createFavorite);
favoriteRouter.delete('/favorites/:id', authorize, deleteFavorite);
