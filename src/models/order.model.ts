import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export interface IOrder {
  orderId: number;
  seller: string;
  createAt: Date;
  status: string;
  paymentMethod: string;
  isGift: boolean;
  totalPrice: number;
  buyer: string;
}

class OrderSchema {

  static async getOrders(seller: string, searchTerm: string, page: number, offset: number) {
    // Need to add schema validation here
    const [orders] = await pool.query<RowDataPacket[]>(
      `
      SELECT * FROM orders WHERE seller = ? LIMIT ? OFFSET ?;
      `,
      [seller, Number(offset), Number(offset * (page - 1))]
    );
    return orders;
  }

  static async queryOrderDetails(orderId: number) {
    const [orderDetails] = await pool.query<RowDataPacket[]>(
      `
      select * 
      from orders p
      where p.orderId = ?;
      `,
      [orderId]
    );
    return orderDetails[0];
  }


}

export default OrderSchema;