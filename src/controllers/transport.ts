import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {TransportSchema} from '../models/transport.model.js';

export const getTransports = async (req: any, res: Response) => {
    const seller = req.user.username;
  try {
    const transports = await TransportSchema.getTransports(seller);
    return res.status(StatusCodes.OK).send({ transports });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};

export const updateTransports = async (req: any, res: Response) => {
  const details = req.body;
  try {
    await TransportSchema.updateTransports(details);
    return res.status(StatusCodes.OK).send({ message: 'update successful' });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};

export const deleteTransport = async (req: any, res: Response) => {
    let transportId = req.params;
    console.log(transportId)
    try {
      await TransportSchema.deleteTransport(transportId.id);
      return res.status(StatusCodes.OK).send({ message: 'update successful' });
    } catch (err) {
      console.log(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Something went wrong, please try later.' });
    }
  };

export const createTransport = async (req: any, res: Response) => {
  const seller = req.user.username;
  const details = req.body;
    try {
      await TransportSchema.createTransport({
        ...details,
        seller: seller,
      });
      return res.status(StatusCodes.OK).send({ message: 'Create successful' });
    } catch (err) {
      console.log(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Something went wrong, please try later.' });
    }
  };
