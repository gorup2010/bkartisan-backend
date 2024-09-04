import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/sqlconnect.js";

export enum CartActions {
  ADD = "add",
  DELETE = "delete",
  UPDATE = "update",
}

export interface ICart {
  id?: number;
  productId: number;
  price?: number;
  quantity: number;
  buyer: string;
  discountId?: string;
  note: string;
}

export interface IPartialCart {
  quantity: number;
  note?: string;
}

export class CartSchema {
  static async find(buyer: string, productId: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select id 
        from carts
        where buyer = ? and productId = ? and orderId is null
      `,
        [buyer, productId]
      );
      if (rows.length === 0) {
        return -1;
      }
      return rows[0].id;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getCartInformation(owner: string) {
    // getCartInformation
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select sum(c.quantity) as count, sum(p.price * c.quantity * (1 - p.discount / 100)) as totalPrice
        from carts c, product p
        where c.buyer = ? and c.orderId is null and c.productId = p.productId
      `,
        [owner]
      );
      return {
        cartItems: rows[0].count || 0,
        totalPrice: parseInt(rows[0].totalPrice) || 0,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getCart(owner: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select u.username, u.avatar, c.quantity, c.note, 
      p.productId, p.name, p.price, p.isOnSale, p.discount, p.coverImage 
      from carts c, user u, product p
      where c.buyer = ? and c.orderId is null and
      c.productId = p.productId and p.seller = u.username
      order by c.id desc;
      `,
        [owner]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async addItem(item: ICart) {
    try {
      const [rows] = await pool.query(
        `
      insert into carts (productId, quantity, buyer)
      values (?, ?, ?)
      `,
        [item.productId, item.quantity, item.buyer]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async deleteItem(id: number) {
    try {
      await pool.query(
        `
      delete from carts
      where id = ?
      `,
        [id]
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async modifyItem(action: string, id: number, data: IPartialCart) {
    const { quantity, note } = data;
    let queryStmt = `update carts `;
    let values = [];
    switch (action) {
      case CartActions.ADD:
        queryStmt += ` set quantity = quantity + ?`;
        values.push(quantity);
        break;
      case CartActions.DELETE:
        queryStmt += ` set quantity = quantity - ?`;
        values.push(quantity);
        break;
      case CartActions.UPDATE:
        queryStmt += ` set quantity = ?, note = ?`;
        values.push(quantity, note);
        break;
    }
    queryStmt += ` where id = ?`;
    values.push(id);
    try {
      const rows = await pool.query<ResultSetHeader>(queryStmt, values);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async modifyAttributes() {}
}
