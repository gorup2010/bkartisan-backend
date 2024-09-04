import { Request, Response } from 'express';
import { FavoriteSchema } from '../models/favorite.model.js';
import { StatusCodes } from 'http-status-codes';

export const createFavorite = async (req: any, res: Response) => {
  const { username } = req.user;
  const { productId } = req.body;
  if (!productId) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: 'invalid inputs',
    });
  }

  try {
    const isExisted = await FavoriteSchema.findByUsername(username, productId);
    if (isExisted) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'data existed',
      });
    }
    await FavoriteSchema.createFavorites(username, productId).then(() =>
      res.status(StatusCodes.OK).send({
        msg: 'ok',
      })
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getFavorite = async (req: any, res: Response) => {
  if (!req.query.page) {
    req.query.page = 1;
  }
  if (!req.query.offset) {
    req.query.offset = 3;
  }
  const { username } = req.user;
  try {
    await FavoriteSchema.getFavorite(username, req.query).then((favorites) =>
      res.status(StatusCodes.OK).send(favorites)
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'Errors occured',
    });
  }
};

export const deleteFavorite = async (req: any, res: Response) => {
  const { id } = req.params;
  const { username } = req.user;
  if (!id || isNaN(id)) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: 'invalid inputs',
    });
  }

  try {
    const isExisted = await FavoriteSchema.findById(username, id);
    if (!isExisted) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'you are not authorized or data does not exist',
      });
    }

    FavoriteSchema.deleteFavorite(id).then(() => {
      res.status(StatusCodes.OK).send({
        msg: 'request successfully',
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'internal server errors',
    });
  }
};
