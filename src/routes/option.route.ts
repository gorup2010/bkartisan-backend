import { Router } from 'express';
import {
  getOptions,
  getChildOptions,
} from '../controllers/option.js';
const optionRouter = Router();


optionRouter.get('/options', getOptions);

optionRouter.get('/child_options', getChildOptions);


export default optionRouter;
