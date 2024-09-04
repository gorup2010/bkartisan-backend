import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';
import { getCurrentDate } from '../utils/helpers.js';

export interface IProductImage {
  id: number;
  url: string[];
}

class ProductLinkSchema {
  static async getProductLinks(productId: string) {
    const [images] = await pool.query<RowDataPacket[]>(
      `SELECT link, type FROM product_links
            where productId = ?;`,
      [productId]
    );
    return images;
  }

  static async addProductLinks(productId: number, assetLinks: any) {
    const rowsOfData = assetLinks
      .map(
        ({ secure_url, resource_type }: any) =>
          `(${+productId}, '${secure_url}', '${resource_type}')`
      )
      .join(',');
    const result = await pool.query<ResultSetHeader>(`
    insert into product_links (productId, link, type) values ${rowsOfData}
    `);
    try {
    } catch (err) {
      console.log(err);
      throw err;
    }

    // console.log(result);
  }
}

export default ProductLinkSchema;
