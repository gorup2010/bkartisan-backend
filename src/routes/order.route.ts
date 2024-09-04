import { Router } from "express";
import {
  createOrder,
  getCheckoutOrder,
  changeOrderState,
  handleReturnedOrder,
  getBuyerOrders,
  getSellerOrders,
  getAdminOrders,
  saveOrder,
} from "../controllers/order.js";
import { authorize } from "../utils/authorize.js";
import { authRole } from "../utils/permission.js";
import { USERS } from "../constants/users.js";
const orderRouter = Router();

orderRouter.get("/orders", authorize, getCheckoutOrder);

orderRouter.get("/orders/buyer", authorize, getBuyerOrders);
// get seller views of orders
orderRouter.get("/orders/seller", authRole([USERS.SELLER]), getSellerOrders);
// get admin view of orders
orderRouter.get("/orders/admin", authRole([USERS.ADMIN]), getAdminOrders);

// buy later feat
orderRouter.post("/orders/save", authorize, saveOrder);
orderRouter.post("/orders", authorize, createOrder);

// Seller & Buyer change order state
orderRouter.post("/orders/state", authorize, changeOrderState);
// Admin & Seller change order state
orderRouter.post("/orders/return", authorize, handleReturnedOrder);

// orderRouter.get('/orders', getOrders);
// orderRouter.get('/orders/:orderId', getOrderDetail);

export default orderRouter;
