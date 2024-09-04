import { Request, Response } from 'express';
import { OptionSchema } from '../models/option.model.js';
import { StatusCodes } from 'http-status-codes';

export const getOptions = async (req: any, res: Response) => {
    try {
        const options = await OptionSchema.getOptionParents();
        res.status(StatusCodes.OK).send({
            options,
        });
    } catch (error) {
        console.error(error);
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: 'Internal Server Error' });
      }
  };

  export const getChildOptions = async (req: any, res: Response) => {
    let {optionTerm } = req.query;
    if (optionTerm === '') {
        res.status(StatusCodes.OK);
    }
    try {
        const options = await OptionSchema.getChildOptionParents(optionTerm);
        res.status(StatusCodes.OK).send({
            options,
        });
    } catch (error) {
        console.error(error);
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ error: 'Internal Server Error' });
      }
  };
  