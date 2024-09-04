import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CommentSchema } from '../models/comment.model.js';
import { z } from 'zod';

const validComment = z.object({
  productId: z.number(),
  content: z.string().min(1, 'Not empty'),
  numberOfStars: z.number().nullish(),
  parentId: z.number().nullish(),
});

export const createComment = async (req: Request, res: Response) => {
  const { success: isCommentValid, error: errMessage } = validComment.safeParse(
    req.body
  );
  if (!isCommentValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errMessage);
  }

  try {
    const { username } = req.user;
    return await CommentSchema.createComment({
      ...req.body,
      writer: username,
    }).then(() =>
      res.status(StatusCodes.OK).send({ msg: 'Create comment ok' })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: 'Internal Server Errors' });
  }
};
export const upvoteComment = async (req: any, res: Response) => {
  const { productId } = req.params;
  try {
    await CommentSchema.upvote(productId);
    return res.status(StatusCodes.OK).send({ message: 'upvote ok' });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};

export const downvoteComment = async (req: any, res: Response) => {
  const { productId } = req.params;
  try {
    await CommentSchema.downvote(productId);
    return res.status(StatusCodes.OK).send({ message: 'downvote ok' });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Something went wrong, please try later.' });
  }
};
