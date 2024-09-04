import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/sqlconnect.js';

export class FavoriteSchema {
  static async getFavorite(username: string, queryObj: any) {
    const { name, offset, page } = queryObj;
    let queryStmt = `
        select f.id, p.productId, p.name, p.seller, p.price, p.coverImage, p.numberOfStar, p.numberOfRating, p.discount, p.isOnSale
        from user u, favorites f, product p
        where u.username = ? && u.username = f.username and f.productId = p.productId and f.isDeleted = 0 `;
    let whereClause: string[] = [];
    let values: Array<number | string> = [username];

    if (name) {
      whereClause.push(`p.name like ? `);
      values.push(`%${name}%`);
    }
    if (whereClause.length > 0) {
      queryStmt += 'AND ' + whereClause.join('AND ');
    }

    queryStmt += ` order by f.id asc `;

    if (offset && page) {
      queryStmt += ` limit ? offset ?`;
      values.push(+offset, +offset * (+page - 1));
    }

    try {
      console.log(queryStmt);

      const [rows] = await pool.query<RowDataPacket[]>(queryStmt, values);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async findByUsername(username: string, productId: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select id 
        from favorites
        where username = ? and productId = ? and isDeleted = 0
        `,
        [username, productId]
      );
      if (rows.length > 0) {
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async findById(username: string, id: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select id 
        from favorites
        where username = ? and id = ?
        `,
        [username, id]
      );
      if (rows.length > 0) {
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async createFavorites(username: string, productId: number) {
    try {
      const [rows] = await pool.query(
        `
      insert into favorites (username, productId)
      values (?, ?)
      `,
        [username, productId]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async deleteFavorite(id: number) {
    try {
      const [rows] = await pool.query(
        `
      update favorites
      set isDeleted = if(isDeleted = 0, 1, 0)
      where id = ?
      `,
        [id]
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
