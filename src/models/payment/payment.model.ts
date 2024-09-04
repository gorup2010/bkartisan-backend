import { OrderSchema } from '../order/order.model.js';

export type PaymentMethod = 'momo' | 'vnpay' | 'paypal';

export class PaymentSchema {
  static async processPayment(buyer: string) {
    try {
      return await OrderSchema.createOrder(buyer);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
