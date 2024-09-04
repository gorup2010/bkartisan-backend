import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import UserModel from "../models/user.model.js";

export function authRole(roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .send({ msg: "Bạn không có quyền truy cập tài nguyên này!" });
    }
    next();
  };
}

export const checkLockStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isUserLock = req.user?.lockUntil && req.user.lockUntil > Date.now();

  if (isUserLock) {
    req.session.destroy(async (err) => {
      if (err) throw err;
      res.clearCookie("session-id");
      const lockResponse = await UserModel.getLockResponse(req.user.username);
      return res
        .status(StatusCodes.FORBIDDEN)
        .send({ msg: "Tài khoản của bạn đã bị khóa!", lockResponse });
    });
  }
  else {
    next();
  }
};
