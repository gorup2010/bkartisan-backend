import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/sqlconnect.js";

export interface IProductOption {
    productOptionId: number,
    productId: number,
    optionParent: string,
    optionValue: string,
}

class ProductOptionSchema {

    static async createProductOption(productId: number, optionParent: string, optionValue: string[]) {
        try {
            if (!Array.isArray(optionValue)) {
                return;
            }
    
            const query = 'INSERT INTO product_options (productId, optionParent, optionValue) VALUES (?, ?, ?)';
            for (let i = 0; i < optionValue.length; i++) {
                await pool.query<ResultSetHeader>(query, [productId, optionParent, optionValue[i]]);
            }
        } catch (error) {
            console.error("Error creating product option:", error);
            throw error;
        }
    }
}

export default ProductOptionSchema;