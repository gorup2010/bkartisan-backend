import { Router } from 'express';
import {
  upvoteComment,
  downvoteComment,
  createComment,
} from '../controllers/comment.js';
import { authorize } from '../utils/authorize.js';

export const commentRouter = Router();

/*
  Does this apply API best practice design?
*/
commentRouter.post('/comments', authorize, createComment);
commentRouter.get('/comments/upvote/:productId', upvoteComment);
commentRouter.get('/comments/downvote/:productId', downvoteComment);

export default commentRouter;
