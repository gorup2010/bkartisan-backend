import { Router } from "express";
import {
  getPaymentResult,
  notifyPaymentResult,
  processPayment,
  processSinglePayment,
  refundPayment,
} from "../controllers/payment.js";
import { authorize } from "../utils/authorize.js";

const paymentRouter = Router();

paymentRouter.get("/payments", processPayment);
paymentRouter.post("/payments/single_order", processSinglePayment);
paymentRouter.get("/payments/vnpay_return", notifyPaymentResult);
// Deploying to use this route
paymentRouter.get("/payments/vnp_ipn", getPaymentResult);

// Cancel order
paymentRouter.post("/payments/refund", authorize, refundPayment);
export default paymentRouter;
