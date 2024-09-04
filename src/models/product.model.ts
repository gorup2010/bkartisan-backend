import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/sqlconnect.js';
import ProductImageSchema from './productLink.model.js';

export interface IProduct {
  id?: number;
  name: string;
  price: number;
  category: number;
  description?: string;
  material: string;
  quantity: number;
  isOnSale?: boolean;
  seller: string;
  createAt?: Date;
  approvedAt?: Date;
  approver?: string;
  status?: "Đang bán" | "Tạm ngưng" | "Vi phạm" | "Từ chối" | "Đang duyệt";
  image: string;
  numOfRating?: number;
  coverImage?: string;
  introduction: string;
}

class ProductSchema {
  // static async getProductImages(productId) {
  //   const [images] = await pool.query<RowDataPacket[]>(
  //     `SELECT * FROM product_image
  //           where imageId = ?;`,
  //     [productId]
  //   );
  //   images.forEach((value, index, array) => {
  //     array[index] = value.link;
  //   });
  //   return images;
  // }

  static async getProducts(page: number, offset: number) {
    // Need to add schema validation here
    const [products] = await pool.query<RowDataPacket[]>(
      `
      SELECT * FROM product LIMIT ? OFFSET ?;
      `,
      [Number(offset), Number(offset * (page - 1))]
    );
    // for (let i = 0; i < products.length; i++) {
    //   const images = await ProductSchema.getProductImages(
    //     products[i].productId
    //   );
    //   products[i].images = images;
    // }
    return products;
  }

  static async getProductsWithKey(
    searchTerm: string,
    page: number,
    offset: number,
    filterTerm: string
  ) {
    let query: string = '';
    if (searchTerm != '' && filterTerm === '') {
      query = 'SELECT * FROM product WHERE name LIKE ? LIMIT ? OFFSET ?;';
      const [products] = await pool.query<RowDataPacket[]>(query, [
        `%${searchTerm}%`,
        Number(offset),
        Number(offset * (page - 1)),
      ]);

      return products;
    } else if (searchTerm === '' && filterTerm != '') {
      query = 'SELECT * FROM product WHERE status ? LIMIT ? OFFSET ?;';
      const [products] = await pool.query<RowDataPacket[]>(query, [
        filterTerm,
        Number(offset),
        Number(offset * (page - 1)),
      ]);

      return products;
    } else {
      query =
        'SELECT * FROM product WHERE name LIKE ? AND status ? LIMIT ? OFFSET ?;';
      const [products] = await pool.query<RowDataPacket[]>(query, [
        `%${searchTerm}%`,
        `%${filterTerm}%`,
        Number(offset),
        Number(offset * (page - 1)),
      ]);

      return products;
    }
  }

  static async queryProductDetails(productId: string) {
    const [productDetails] = await pool.query<RowDataPacket[]>(
      `
      select p.productId, p.category as categoryId, p.price, p.name, p.description, p.introduction, p.seller, p.coverImage, p.isOnSale, p.discount, p.numberOfStar, p.numberOfRating, u.avatar, u.username, u.name as sellerName
      from product p, user u
      where p.productId = ? and p.seller = u.username;
      `,
      [productId]
    );
    return productDetails;
  }

  static async addProduct(product: IProduct) {
    const {
      name,
      price,
      category,
      description,
      material,
      quantity,
      seller,
      image,
      introduction,
    } = product;
    const createdAt = new Date();
    const [{ insertId }] = await pool.query<ResultSetHeader>(
      `insert into product (name, price, description, category, material, quantity, seller, coverImage, introduction, createdAt)
      values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        name,
        price,
        description,
        category,
        material,
        quantity,
        seller,
        image,
        introduction,
        createdAt
      ]
    );
    return insertId;
  }

  static async deleteProduct(productIds: number[]) {
    for (const productId of productIds) {
      await pool.query<ResultSetHeader>(
        `DELETE FROM product WHERE productId = ?;`,
        [productId]
      );
    }
  }

  static async getSearchedProducts(queryObj: any) {
    const { name, offset, page } = queryObj;
    let queryStmt = `
    SELECT productId, name, seller, price, coverImage, numberOfStar, numberOfRating, discount
    FROM product 
    WHERE approvedAt IS NOT null 
    `;
    const values = [];
    const whereClause: string[] = [];

    if (name) {
      whereClause.push('name LIKE ? ');
      values.push(`%${name}%`);
    }

    if (whereClause.length > 0) {
      queryStmt += 'AND ' + whereClause.join('AND ');
    }

    if (offset && page) {
      queryStmt += ` LIMIT ? OFFSET ? `;
      values.push(+offset, +offset * (page - 1));
    }

    console.log(queryStmt);
    const [products] = await pool.query<RowDataPacket[]>(queryStmt, values);
    return products;
  }

  static async getProductsList(filterOpts: any) {
    let sql = `SELECT coverImage, name, seller, price, approvedAt, productId FROM product WHERE approvedAt IS NOT null `;
    let values = [];

    const whereClause = [];
    if (filterOpts.product) {
      whereClause.push('name LIKE ? ');
      values.push(`%${filterOpts.product}%`);
    }
    if (filterOpts.seller) {
      whereClause.push('seller = ? ');
      values.push(filterOpts.seller);
    }
    if (filterOpts.collab) {
      whereClause.push('approver = ? ');
      values.push(filterOpts.collab);
    }
    if (filterOpts.startDate) {
      whereClause.push('Date(approvedAt) >= ? ');
      values.push(filterOpts.startDate);
    }
    if (filterOpts.endDate) {
      whereClause.push('Date(approvedAt) <= ? ');
      values.push(filterOpts.endDate);
    }
    if (filterOpts.startPrice) {
      whereClause.push('price >= ? ');
      values.push(Number(filterOpts.startPrice));
    }
    if (filterOpts.endPrice) {
      whereClause.push('price <= ? ');
      values.push(Number(filterOpts.endPrice));
    }
    if (whereClause.length != 0) {
      sql += 'AND ' + whereClause.join('AND ');
    }

    if (filterOpts.order) {
      switch (filterOpts) {
        case 'newToOld':
          sql += 'ORDER BY approvedAt desc ';
          break;
        case 'oldToNew':
          sql += 'ORDER BY approvedAt asc ';
          break;
        case 'lowToHigh':
          sql += 'ORDER BY price asc ';
          break;
        default:
          sql += 'ORDER BY price desc ';
      }
    }
    if (filterOpts.offset && filterOpts.page) {
      const offset = +filterOpts.offset;
      const page = +filterOpts.page;
      sql += ` LIMIT ? OFFSET ?`;
      values.push(offset, offset * (page - 1));
    }

    const [products] = await pool.query<RowDataPacket[]>({
      sql,
      values,
      rowsAsArray: true,
    });

    return products;
  }

  static async getReviewProductsList(filterOpts: any, approver: string) {
    let sql = `SELECT coverImage, name, seller, status, createdAt, productId FROM product WHERE approver = ? AND (status = 'Đang duyệt' OR status = 'Từ chối') `;
    let values = [approver];

    const whereClause = [];
    if (filterOpts.product) {
      whereClause.push('name LIKE ? ');
      values.push(`%${filterOpts.product}%`);
    }
    if (filterOpts.seller) {
      whereClause.push('seller = ? ');
      values.push(filterOpts.seller);
    }
    if (filterOpts.startDate) {
      whereClause.push('Date(createdAt) >= ? ');
      values.push(filterOpts.startDate);
    }
    if (filterOpts.endDate) {
      whereClause.push('Date(createdAt) <= ? ');
      values.push(filterOpts.endDate);
    }
    if (filterOpts.startPrice) {
      whereClause.push('price >= ? ');
      values.push(Number(filterOpts.startPrice));
    }
    if (filterOpts.endPrice) {
      whereClause.push('price <= ? ');
      values.push(Number(filterOpts.endPrice));
    }
    if (whereClause.length != 0) {
      sql += 'AND ' + whereClause.join('AND ');
    }

    if (filterOpts.order) {
      switch (filterOpts) {
        case 'newToOld':
          sql += 'ORDER BY createdAt desc ';
          break;
        case 'oldToNew':
          sql += 'ORDER BY createdAt asc ';
          break;
        case 'lowToHigh':
          sql += 'ORDER BY price asc ';
          break;
        default:
          sql += 'ORDER BY price desc ';
      }
    }
    if (filterOpts.offset && filterOpts.page) {
      const offset = +filterOpts.offset;
      const page = +filterOpts.page;
      sql += ` LIMIT ? OFFSET ?`;
      values.push(offset, offset * (page - 1));
    }

    const [products] = await pool.query<RowDataPacket[]>({
      sql,
      values,
      rowsAsArray: true,
    });

    return products;
  }

  static async declineProduct(productId: number) {
    return
  }
}

export default ProductSchema;
