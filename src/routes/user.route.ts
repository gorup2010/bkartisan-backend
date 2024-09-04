import { Router } from 'express';
import {
  getUsers,
  getUserDetails,
  lockUser,
  unlockUser,
  getCollabs,
  createCollab,
  updateInfoCollab,
} from '../controllers/user.js';
import { authRole } from '../utils/permission.js';
const userRouter = Router();

userRouter.post('/users/:userId/lock-user', authRole(['admin']), lockUser)

userRouter.post('/users/:userId/unlock-user', authRole(['admin']), unlockUser)

userRouter.get('/users', authRole(['admin', 'collab']), getUsers);

userRouter.get('/users/:userId', getUserDetails);

userRouter.post('/collabs/:userId/update', authRole(['admin']), updateInfoCollab);

userRouter.get('/collabs/:userId', authRole(['admin']), getUserDetails);

userRouter.post('/collabs/create-new', authRole(['admin']), createCollab)

userRouter.get('/collabs', authRole(['admin']), getCollabs)


export default userRouter;
