import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/sqlconnect.js";

export interface IProductCategory {
    productId: number,
    category: string,
}

class ProductCatagorySchema {

    static async createProductCategory(productId: number, category: string) {
        try {
            const query = 'INSERT INTO product_category (productId, category) VALUES (?, ?)';
            const [{ insertId }] = await pool.query<ResultSetHeader>(query, [productId, category]);
            return insertId;
        } catch (error) {
            console.error("Error creating product category:", error);
            throw error;
        }
    }

    static async getProductCategory(productId: number) {
        try {
            const [row] = await pool.query<RowDataPacket[]>(
                `
                select category
                from product_category
                where productId = ?;
              `,
                [productId]
              );
              const category = row[0] as RowDataPacket;
              return category.category;
        } catch (error) {
            console.error("Error retrieving product category:", error);
            throw error;
        }
    }
    
}

export default ProductCatagorySchema;