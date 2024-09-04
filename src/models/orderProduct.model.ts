import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export interface IOrderProduct {
  orderProductId: number;
  orderId: number;
  productId: number;
  quantity: number;
}

class OrderProductSchema {

  static async queryOrderProducts(orderId: number) {
    const [orderProducts] = await pool.query<RowDataPacket[]>(
      `
      SELECT op.productId, op.quantity, p.price, p.name
      FROM order_product op
      INNER JOIN product p ON op.productId = p.productId
      WHERE op.orderId = ?;
      `,
      [orderId]
    );
    return orderProducts;
  }


}

export default OrderProductSchema;