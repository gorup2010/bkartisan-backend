import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/sqlconnect.js";
export interface IUsedDiscount {
  id?: number;
  buyer: string;
  discountId: number;
  discountPrice: number;
  seller: string;
}

export class UsedDiscountSchema {
  static async createUsedDiscount(usedDiscount: IUsedDiscount) {
    const { buyer, discountId, discountPrice, seller } = usedDiscount;
    try {
      const [rows] = await pool.query<ResultSetHeader>(
        `
      insert into used_discounts(buyer, discountId, discountPrice, seller)
      values (?, ?, ?, ?)
      `,
        [buyer, discountId, discountPrice, seller]
      );
      return rows;
    } catch (err) {
      console.log();
      throw err;
    }
  }

  // Will be used in payment
  static async getUsedDiscountInformation(username: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select count(id) as quantity, sum(discountPrice) as totalDiscount
      from used_discounts
      where buyer = ? and orderId is null
      `,
        [username]
      );
      console.log(rows[0]);

      return {
        discountItems: rows[0].count ?? 0,
        totalDiscount: rows[0].totalDiscount ?? 0,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async getUsedDiscounts(username: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select d.code, u.discountPrice, u.seller
      from used_discounts u, discounts d
      where u.buyer = ? and u.orderId is null
      and u.discountId = d.id`,
        [username]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async findByBuyerAndDiscountId(buyer: string, discountId: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select id 
      from used_discounts
      where buyer = ? and discountId = ?
      `,
        [buyer, discountId]
      );
      return rows[0];
    } catch (err) {
      console.log();
      throw err;
    }
  }
  static async findByBuyerAndSeller(buyer: string, seller: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select id 
      from used_discounts
      where buyer = ? and seller = ?
      `,
        [buyer, seller]
      );
      console.log(`UsedDiscountSchema.findByBuyerAndSeller, `, rows[0]);

      return rows[0];
    } catch (err) {
      console.log();
      throw err;
    }
  }
  static async clearUsedDiscount(buyer: string) {
    try {
      const [rows] = await pool.query<ResultSetHeader>(
        `
      delete from used_discounts
      where buyer = ? and orderId is null
      `,
        [buyer]
      );
      return rows.affectedRows > 0;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
