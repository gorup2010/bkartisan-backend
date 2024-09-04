import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import GiftSchema from '../models/gift.model.js';
import cloudinary from 'cloudinary';
import fs from 'fs';

export const getGifts = async (req: any, res: Response) => {
    const seller = req.user.username;
    let { page, offset, type, searchTerm } = req.query;
    if (!page || !offset) {
      page = 1;
      offset = 10;
    }
  try {
    const gifts = await GiftSchema.getGifts(seller, type, searchTerm, page, offset);
    return res.status(StatusCodes.OK).send({ gifts });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};

export const updateGift = async (req: any, res: Response) => {
  const details = req.body;
  try {
    await GiftSchema.updateGift(details);
    return res.status(StatusCodes.OK).send({ message: 'update successful' });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};

export const deleteGift = async (req: any, res: Response) => {
    let giftIds = req.query.giftIds;
    console.log(giftIds)
    try {
      await GiftSchema.deleteGift(giftIds);
      return res.status(StatusCodes.OK).send({ message: 'delete successful' });
    } catch (err) {
      console.log(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Something went wrong, please try later.' });
    }
  };

export const getGiftDetail = async (req: any, res: Response) => {
    let giftId = req.params;
    console.log(giftId)
    try {
      const gift = await GiftSchema.getiftDetail(giftId.id);
      return res.status(StatusCodes.OK).send({ gift });
    } catch (err) {
      console.log(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Something went wrong, please try later.' });
    }
  };

export const createGift = async (req: any, res: Response) => {
  const seller = req.user.username;
  const details = req.body;
  console.log(details)
  let images = req.files.images;
  if (!Array.isArray(images)) {
    images = [images];
  }
  const filePromiseList = [...images].map(async (file: any) => {
    try {
      return await cloudinary.v2.uploader
        .upload(file.tempFilePath, {
          use_filename: true,
          folder: 'bk_artisan',
          resource_type: 'auto',
        })
        .then(({ secure_url, resource_type }) => {
          // console.log(
          //   `secure_url = ${secure_url}, resource_type = ${resource_type}`
          // );

          fs.unlinkSync(file.tempFilePath);
          return { secure_url, resource_type };
        });
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

    try {
        let responseList = await Promise.all(filePromiseList);
        console.log(`secureList = `, responseList);
      await GiftSchema.createGift({
        ...details,
        seller: seller,
        coverImage: responseList[0].secure_url,
      });
      return res.status(StatusCodes.OK).send({ message: 'Create successful' });
    } catch (err) {
      console.log(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Something went wrong, please try later.' });
    }
  };
