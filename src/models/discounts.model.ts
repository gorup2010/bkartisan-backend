import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/sqlconnect.js';
import { DISCOUNT_TYPES } from '../constants/discounts.js';

export type DiscountType = 'fixed' | 'percent' | 'bill';

/*
  - fixed: Giam co dinh 
  - percent: Giam theo phan tram,
  - bill: Giam neu tong gia tri don hang
  o mot shop > x
*/
export interface IDiscount {
  id?: number;
  code: string;
  seller: string;
  startedAt: string;
  validUntil: string;
  type: DiscountType;
  quantity: number;
  details: Object;
}

export interface IPartialDiscount {
  id: number;
  startedAt: string;
  validUntil: string;
  type: DiscountType;
  quantity: number;
  details: Object;
}

export interface IQueryDiscountObject {
  page: number;
  offset: number;
  type?: DiscountType;
  isOutdated?: boolean;
  isSellOut?: boolean;
}

type DiscountRequest = {
  productId?: number;
  code: string;
  buyer?: string;
};
interface DiscountStrategy {
  computeDiscount: (discountRequest: DiscountRequest) => Promise<number>;
}

class DiscountByConstantStrategy implements DiscountStrategy {
  public computeDiscount = async (discountRequest: DiscountRequest) => {
    const { code } = discountRequest;
    return await pool
      .query<RowDataPacket[]>(
        `
    select details
    from discounts
    where code = ?
    `,
        [code]
      )
      .then((rows) => rows[0][0].details.value)
      .catch((err) => console.log(err));
  };
}

class DiscountByPercentageStrategy implements DiscountStrategy {
  public computeDiscount = async (discountRequest: DiscountRequest) => {
    const { buyer, code } = discountRequest;
    console.log(`buyer = ${buyer}, code = ${code}`);

    const discountPercentage = await pool
      .query<RowDataPacket[]>(
        `
    select details 
    from discounts 
    where code = ?
    `,
        [code]
      )
      .then((rows) => rows[0][0].details.value)
      .catch((err) => console.log(err));

    const originalPrice = await pool
      .query<RowDataPacket[]>(
        `
      select p.price, p.discount, c.quantity
      from discounts d, product p, carts c
      where c.buyer = ? and c.orderId is null
      and d.code = ? and d.seller = p.seller
      and c.productId = p.productId;
    `,
        [buyer, code]
      )
      .then((rows) =>
        rows[0].reduce((acc, curElem) => {
          console.log(curElem);
          
          const { price, discount, quantity } = curElem;
          return acc + price * quantity * (1 - discount / 100);
        }, 0)
      )
      .catch((err) => console.log(err));
    console.log(
      `discountPercent = ${discountPercentage}, originalPrice = ${originalPrice}`
    );

    return +originalPrice * (1 - discountPercentage / 100);
  };
}

class DiscountByBillStrategy implements DiscountStrategy {
  /*
   1.Lay het san pham trong cart cua mot buyer
  */
  public computeDiscount = async (discountRequest: DiscountRequest) => {
    const { buyer, code } = discountRequest;

    const discount = await pool
      .query<RowDataPacket[]>(
        `
    select details 
    from discounts
    where code = ?
    `,
        [code]
      )
      .then((rows) => rows[0][0].value);
    const [priceRows] = await pool.query<RowDataPacket[]>(
      `
      select p.price, p.discount, c.quantity
      from product p, discounts d, carts c
      where c.buyer = ? and d.code = ? and d.seller = p.seller 
      and p.productId = c.productId;
    `,
      [buyer, code]
    );
    const totalPrice = priceRows.reduce((sum, currentRow) => {
      const { price, discount, quantity } = currentRow;
      return price * (1 - discount / 100) * quantity;
    }, 0);
    // Chưa biết lớn hơn discount thì giảm giá bao nhiêu tiền.
    return totalPrice > discount ? discount : 0;
  };
}

export class DiscountSchema {
  private static discountStrategy: DiscountStrategy;
  public static setDiscountStrategy = (
    newDiscountStrategy: DiscountStrategy
  ) => {
    this.discountStrategy = newDiscountStrategy;
  };
  static async createDiscount(discount: IDiscount) {
    console.log(discount.details);
    const createdAt = new Date();
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      insert into discounts (code, seller, startedAt, validUntil, type, quantity, details, createdAt)
      values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          discount.code,
          discount.seller,
          discount.startedAt,
          discount.validUntil,
          discount.type,
          discount.quantity,
          JSON.stringify(discount.details),
          createdAt
        ]
      );
      // console.log(rows);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async findByCode(code: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select id, seller, quantity, validUntil, type
      from discounts 
      where code = ?
      `,
        [code]
      );
      console.log(`DiscountSchema.findByCode`, rows[0]);
      return rows[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async findById(id: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select id
      from discounts 
      where id = ?
      `,
        [id]
      );
      return rows.length > 0;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async updateDiscount(discount: IPartialDiscount) {
    /*
    valid time: extend, shorten
    number of discounts
    */
    try {
      const [rows] = await pool.query<ResultSetHeader>(
        `
      update discounts
      set startedAt = ?, validUntil = ?, type = ?, quantity = ?, details = ?
      where id = ?
      `,
        [
          discount.startedAt,
          discount.validUntil,
          discount.type,
          discount.quantity,
          JSON.stringify(discount.details),
          discount.id,
        ]
      );
      console.log(rows);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async deleteDiscount(id: number) {
    try {
      const [rows] = await pool.query<ResultSetHeader>(
        `
      delete from discounts 
      where id = ?
      `,
        [id]
      );

      console.log(rows);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getDiscount(username: string, queryObj: IQueryDiscountObject) {
    const {
      page,
      offset,
      type: discountType,
      isOutdated,
      isSellOut,
    } = queryObj;
    let queryStmt = `
    select id, code, details, startedAt, validUntil, quantity, type 
    from discounts
    where seller = ?`;
    let values: (string | number)[] = [username];
    let whereClause = [];
    if (discountType) {
      whereClause.push(`type = ?`);
      values.push(discountType);
    }
    if (isOutdated) {
      whereClause.push(`now() > validUntil`);
    }
    if (isSellOut) {
      whereClause.push(`quantity = 0`);
    }

    if (whereClause.length > 0) {
      queryStmt += ' and ' + whereClause.join(' and ');
    }

    if (page && offset) {
      queryStmt += ` LIMIT ? OFFSET ? `;
      values.push(+offset, +offset * (page - 1));
    }
    try {
      const [rows] = await pool.query<RowDataPacket[]>(queryStmt, values);
      console.log(rows);
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getDiscountDetail(id: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
      select * 
      from discounts 
      where id = ?
      `,
        [id]
      );
      return rows;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // use Strategy pattern
  static async applyDiscount(
    username: string,
    code: string,
    productId: number,
    type: DiscountType
  ) {
    switch (type) {
      case DISCOUNT_TYPES.FIXED:
        console.log(`strategy will be fixed`);
        this.setDiscountStrategy(new DiscountByConstantStrategy());
        break;
      case DISCOUNT_TYPES.PERCENT:
        console.log(`strategy will be percent`);
        this.setDiscountStrategy(new DiscountByPercentageStrategy());
        break;
      case DISCOUNT_TYPES.BILL:
        console.log(`strategy will be bill`);
        this.setDiscountStrategy(new DiscountByBillStrategy());
        break;
    }
    try {
      return await this.discountStrategy.computeDiscount({
        productId,
        code,
        buyer: username,
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
