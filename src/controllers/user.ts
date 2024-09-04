import { Request, Response } from 'express';
import UserSchema, { User } from '../models/user.model.js';
import { hashPassword } from '../utils/helpers.js';
import { StatusCodes } from 'http-status-codes';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { CartSchema } from '../models/carts.model.js';

export const register = async (request: Request, response: Response) => {
  const { username, email, password } = request.body;
  const userDB = await UserSchema.findOne(username);
  if (userDB) {
    return response.status(400).send({ msg: 'Tên tài khoản đã tồn tại' });
  }
  const hasUsedEmail = await UserSchema.findByEmail(email);
  if (hasUsedEmail) {
    return response.status(400).send({ msg: 'Email đã được sử dụng' });
  }

  const hashedPassword = hashPassword(password);
  const newUser: User = {
    username,
    password: hashedPassword,
    name: username,
    email,
    role: 'buyer',
    loginType: 'normal',
  };

  const result = await UserSchema.create(newUser);
  if (result) {
    response.status(201).send({ msg: 'Created new account' });
  } else {
    response.status(500).send({ msg: 'Cannot create new account!' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // req.logout();
  // res.redirect(process.env.CLIENT_URL as string);
  // console.log(req.signedCookies);

  try {
    req.session.destroy((err) => {
      if (err) throw err;
      res.clearCookie('session-id');
      return res.status(StatusCodes.OK).send({
        msg: 'Log out successfully!',
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const loginSuccess = async (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return await CartSchema.getCartInformation(req.user.username).then(
      (cartInformation) =>
        res.status(StatusCodes.OK).send({
          msg: 'success',
          data: { ...req.user, ...cartInformation },
        })
    );
  }
  return res.status(StatusCodes.UNAUTHORIZED).send({
    msg: 'failure',
  });
};

export const loginFail = async (req: Request, res: Response) => {
  return res.status(StatusCodes.UNAUTHORIZED).send({
    msg: 'failure',
  });
};

export const getUsers = async (req: any, res: Response) => {
  let { byDate, byStatus, name, page, offset } = req.query;
  if (!page) {
    page = 1;
  }
  if (!offset) {
    offset = 10;
  }
  try {
    const users = await UserSchema.getUsersList(
      byDate,
      byStatus,
      name,
      page,
      offset
    );
    res.status(StatusCodes.OK).send(users);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const user = await UserSchema.findOne(req.params.userId);
    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const lockUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.userId;
    const { lockTime, email, response } = req.body;
    let lockDay =
      lockTime === '1-week' ? 7 : lockTime === '1-month' ? 31 : 93;
    const result = await UserSchema.lockUser(
      username,
      lockDay,
      email,
      response
    );
    res.status(StatusCodes.OK).send({ msg: 'OK' });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const unlockUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.userId;
    const result = await UserSchema.unlockUser(username);
    res.status(StatusCodes.OK).send({ msg: 'OK' });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getCollabs = async (req: any, res: Response) => {
  let { byDate, name, page, offset } = req.query;
  if (!page) {
    page = 1;
  }
  if (!offset) {
    offset = 10;
  }
  try {
    const collabs = await UserSchema.getCollabsList(byDate, name, page, offset);
    res.status(StatusCodes.OK).send(collabs);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const createCollab = async (req: Request, res: Response) => {
  const collab = req.body;
  const userDB = await UserSchema.findOne(collab.username);
  const image = req.files?.image;

  if (userDB) {
    return res.status(400).send({ msg: 'User already exists!' });
  } else {
    try {
      let urlImage = undefined;

      if (image) {
        urlImage = await cloudinary.v2.uploader
          .upload(image.tempFilePath, {
            public_id: collab.username,
            overwrite: true,
            folder: 'bk_artisan',
            resource_type: 'auto',
          })
          .then(({ secure_url }) => {
            fs.unlinkSync(image.tempFilePath);
            return secure_url;
          });
      }

      const password = hashPassword(collab.password);
      const newUser: User = {
        username: collab.username,
        password,
        email: collab.email,
        name: collab.name,
        gender: collab.gender,
        role: 'collab',
        address: collab.address,
        loginType: 'normal',
        avatar: urlImage,
      };
      const result = await UserSchema.create(newUser);
      if (result) {
        res.status(201).send({ msg: 'Created new account' });
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: 'Internal Server Error' });
    }
  }
};

export const updateInfoCollab = async (req: Request, res: Response) => {
  try {
    const changedInfo = req.body;
    const image = req.files?.image;

    // Xóa và update avatar trên cloudinary
    let urlImage = undefined;
    if (image) {
      urlImage = await cloudinary.v2.uploader
        .upload(image.tempFilePath, {
          public_id: changedInfo.username,
          overwrite: true,
          folder: 'bk_artisan',
          resource_type: 'auto',
        })
        .then(({ secure_url }) => {
          fs.unlinkSync(image.tempFilePath);
          return secure_url;
        });
    }

    if (urlImage !== undefined) {
      changedInfo.avatar = urlImage;
    }

    const result = await UserSchema.updateInfo(changedInfo);

    res
      .status(201)
      .send({ msg: 'Information of collab is changed successfully!' });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const foo = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};
