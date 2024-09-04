import { Request, Response } from 'express';
import CategorySchema from '../models/category.model.js';
import { StatusCodes } from 'http-status-codes';

export const getCategoryLevel3 = async (req: any, res: Response) => {
  try {
    const categories = await CategorySchema.getCategoryLevel3();
    res.status(StatusCodes.OK).send({
      categories,
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getCategoryByLevel = async (req: any, res: Response) => {
  try {
    const { level } = req.params;
    const categories = await CategorySchema.getCategoryByLevel(level);
    res.status(StatusCodes.OK).send(categories);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getGifts = async (req: any, res: Response) => {
  try {
    const gifts = await CategorySchema.getGifts();
    return res.status(StatusCodes.OK).send(gifts);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getCategoryChildren = async (req: any, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: 'data is required',
    });
  }
  try {
    const categoryChildren = await CategorySchema.getCategoryChildren(id);
    return res.status(StatusCodes.OK).send(categoryChildren);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};
