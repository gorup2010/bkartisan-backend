import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import generator from 'generate-password';
import z from 'zod';

import nodemailer from 'nodemailer';
import UserModel from '../models/user.model.js';
import { hashPassword } from '../utils/helpers.js';

const mailSchema = z
  .string()
  .min(1, 'Email không được để trống')
  .email('Email không hợp lệ')
  .trim();

export const sendPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(`email = ${email}`);

    const isValid = mailSchema.safeParse(email).success;
    console.log(isValid);

    if (!isValid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ msg: 'Email không hợp lệ' });
    }
    // let testAccount = await nodemailer.createTestAccount();
    const userDB = await UserModel.findByEmail(email);
    if (!userDB) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'Không tồn tại email trên hệ thống',
      });
    }
    const { username } = userDB;
    const newPassword = generator.generate({
      length: 8,
      numbers: true,
    });
    console.log(`new password = ${newPassword}`);

    const hashedPassword = hashPassword(newPassword);
    const data = await UserModel.updatePassword(username, hashedPassword);
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"BK Artisan" <${process.env.GMAIL_USERNAME}>`, // sender address
      to: `${email}`, // list of receivers
      subject: 'Your new password', // Subject line
      // text: 'Kim chi đỏ ao', // plain text body
      html: `<p>${newPassword}<p/>`, // html body
    });
    return res.json(info);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
