import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';

export interface ICategory {
  categoryId: number;
  name: string;
  categoryParent: number;
  level: number;
}

class CategorySchema {
  //return list parent of catagory
  static async getCategoryHierachies(id: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `WITH RECURSIVE CategoryHierarchy AS (
                    SELECT categoryId as id, name, categoryParent, level
                    FROM category
                    WHERE categoryId = ?
                  UNION
                    SELECT c.categoryId as id, c.name, c.categoryParent, c.level
                    FROM category c
                    JOIN CategoryHierarchy ch ON c.categoryId = ch.categoryParent
        )
        SELECT id, name, level 
        FROM CategoryHierarchy
        ORDER BY level ASC`,
        [id]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      throw error;
    }
  }

  //get all catagory child
  static async getCategoryLevel3() {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT categoryId, name FROM category WHERE level = 3`
      );
      return rows;
    } catch (error) {
      console.error('Error fetching level 3 categories:', error);
      throw error;
    }
  }

  //get catagory
  static async getCategoryById(id: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT name FROM category WHERE categoryId = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  static async getCategoryByLevel(level: number) {
    console.log(`level = ${level}`);

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select categoryId, name, image, isSelected, level 
        from category
        where level = ?
        `,
        [level]
      );

      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getGifts() {
    const GIFT_ID = 85;
    /*
    special categories
    where level = 3 and isSelected = true
    */
    try {
      const [rows] = await pool.query(
        `
        select categoryId, name, image, level
        from category
        where categoryParent = ?
        `,
        [GIFT_ID]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getCategoryChildren(id: number) {
    try {
      const [rows] = await pool.query(
        `
      select categoryId, name, level, image
      from category
      where categoryParent = ?
      `,
        [id]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

export default CategorySchema;
