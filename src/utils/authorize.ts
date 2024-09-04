import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const authorize = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    return next();
  }
  return res.status(StatusCodes.UNAUTHORIZED).send({
    msg: 'Unauthorized',
  });
};
