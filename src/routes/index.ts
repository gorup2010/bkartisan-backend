import { Router } from 'express';
import authRouter from './auth.route.js';
import productRouter from './product.route.js';
import commentRouter from './comment.route.js';
import optionRouter from './option.route.js';
import categoryRouter from './category.route.js';
import userRouter from './user.route.js';
import orderRouter from './order.route.js';
import addressRouter from './address.route.js';
import cartRouter from './carts.route.js';
import discountRouter from './discount.route.js';
import { favoriteRouter } from './favorite.route.js';
import paymentRouter from './payment.route.js';
import chatRouter from './chat.route.js';
import giftRouter from './gift.route.js';

import { authRole } from '../utils/permission.js';
import reportRouter from './report.route.js';
import transportRouter from './transport.route.js';
const routers = Router();

routers.get('/', authRole('admin'), (req, res) => {
  res.json({
    message: 'HELLO WORLD - 👋🌎🌏🌍',
  });
});

routers.use(orderRouter);
routers.use(cartRouter);
//routers.use(authRouter);
routers.use(optionRouter);
routers.use(productRouter);
routers.use(commentRouter);
routers.use(categoryRouter);
routers.use(userRouter);
routers.use(reportRouter);
routers.use(addressRouter);
routers.use(discountRouter);
routers.use(favoriteRouter);
routers.use(chatRouter);
routers.use(paymentRouter);
routers.use(transportRouter);
routers.use(giftRouter)

export default routers;
