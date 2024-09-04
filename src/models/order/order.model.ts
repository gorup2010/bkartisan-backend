import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../config/sqlconnect.js";
import { CartSchema } from "../carts.model.js";
import { UsedDiscountSchema } from "../usedDiscount.model.js";
import { generate } from "generate-password";
import {
  CanceledState,
  ConfirmingState,
  DeniedState,
  DoneState,
  OrderState,
  PreparingState,
  ProcessingState,
  ReturnedState,
  ReturningState,
  ShippingState,
  StateArgs,
} from "./orderState.js";




export enum ORDER_STATES {
  CONFIRMING = "Chờ xác nhận", // init khi người dùng tạo đơn hàng
  PROCESSING = "Đang xử lý", // người mua  đã thanh toán
  PREPARING = "Chờ lấy hàng", // người bán đã xác nhận
  SHIPPING = "Đang vận chuyển", // người bán đã xác nhận
  DONE = "Đã giao", // người mua đã xác nhận
  REQUIRE_RETURN = "Yêu cầu trả hàng", // người mua yêu cầu
  DENY_RETURN = "Từ chối trả hàng", // người bán chấp nhận
  RETURNED = "Đã trả hàng", // Người bán xác nhận, admin xác nhận hoàn tiền
  CANCELED = "Đã hủy", // Đang ở bước đang xử lý, người mua hủy thì hoàn tiền
}



export type OrderStatus =
  | "Chờ xác nhận"
  | "Đang xử lý"
  | "Chờ lấy hàng"
  | "Đang vận chuyển"
  | "Đã giao"
  | "Yêu cầu tả hàng"
  | "Chấp nhận trả hàng"
  | "Đã trả hàng"
  | "Đã hủy";

interface IPartialOrder {
  buyer: string;
  orderId: string;
  bankCode: string;
}

interface IAdminQueryObject {
  page: number;
  offset: number;
  startAt?: Date;
  endAt?: Date;
  orderId?: string;
  time?: "asc" | "desc";
  status?: string;
}

interface ISellerQueryObject {
  page: number;
  offset: number;
}

interface IBuyerQueryObject {
  page: number;
  offset: number;
  status?: string;
}
export class OrderSchema {
  private orderId: string;
  private state: OrderState;

  constructor(orderId: string, initialState: OrderState) {
    this.orderId = orderId;
    this.state = initialState;
  }
  public setState(state: OrderState) {
    this.state = state;
  }
  public async goToNextState(stateInputs: StateArgs): Promise<void> {
    try {
      await this.state
        .process(this, stateInputs)
        .then(async () => {
          const nextState = this.state.getState();
          if (nextState === ORDER_STATES.PROCESSING) {
            return await pool.query<ResultSetHeader>(
              `
          update orders
          set status = ? 
          where commonId = ?
        `,
              [nextState, this.orderId]
            );
          } else {
            return await pool.query<ResultSetHeader>(
              `
          update orders
          set status = ? 
          where orderId = ?
          `,
              [nextState, this.orderId]
            );
          }
        })
        .then(() => console.log(`change order state ok`));
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  public async cancel(ipAddress: string): Promise<void> {
    try {
      await this.state
        .cancel(this, { orderId: this.orderId, ipAddress })
        .then(async () => {
          const nextState = this.state.getState();
          return await pool.query<ResultSetHeader>(
            `
          update orders
          set status = ?
          where orderId = ?
          `,
            [nextState, this.orderId]
          );
        })
        .then(() => console.log(`cancel order ok`));
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  public static async loadOrderFromDB(orderId: string): Promise<OrderSchema> {
    try {
      const orderStatus = await pool
        .query<RowDataPacket[]>(
          `
      select status
      from orders 
      where orderId = ?
      `,
          [orderId]
        )
        .then((rows) => rows[0][0].status);
      let state: OrderState;
      switch (orderStatus) {
        case ORDER_STATES.CONFIRMING:
          state = new ConfirmingState();
          break;
        case ORDER_STATES.PROCESSING:
          state = new ProcessingState();
          break;
        case ORDER_STATES.PREPARING:
          state = new PreparingState();
          break;
        case ORDER_STATES.SHIPPING:
          state = new ShippingState();
          break;
        case ORDER_STATES.DONE:
          state = new DoneState();
          break;
        case ORDER_STATES.REQUIRE_RETURN:
          state = new ReturningState();
          break;
        case ORDER_STATES.DENY_RETURN:
          state = new DeniedState();
          break;
        case ORDER_STATES.RETURNED:
          state = new ReturnedState();
          break;
        case ORDER_STATES.CANCELED:
          state = new CanceledState();
          break;
        default:
          throw new Error("Unknown state");
      }
      return new OrderSchema(orderId, state);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async createOrder(buyer: string) {
    /*
      Tạo ra n đơn hàng cho vào table orders
      trả về id chung và tổng tiền
    */
    const createdDay = new Date();
    const commonId = generate({
      length: 12,
      numbers: true,
    }).toUpperCase();

    try {
      // Get seller names before creating orders
      const [sellers] = await pool.query<RowDataPacket[]>(
        `
        select p.seller as name, sum(p.price *  c.quantity * (1 - p.discount / 100)) as total
        from carts c, product p
        where c.buyer = ? and c.orderId is null 
        and c.productId = p.productId
        group by p.seller;
      `,
        [buyer]
      );
      sellers.map(async (seller) => {
        const orderId = generate({
          numbers: true,
          length: 10,
        }).toUpperCase();
        await pool
          .query<RowDataPacket[]>(
            `
        select discountId, discountPrice 
        from used_discounts u
        where u.buyer = ? and u.seller = ? and u.orderId is null
        `,
            [buyer, seller.name]
          )
          .then(async (discount) => {
            let discountId = null,
              discountPrice = 0;
            if (discount[0][0]) {
              discountId = discount[0][0].discountId;
              discountPrice = discount[0][0].discountPrice;
            }

            // console.log(`discountPrice = ${discountPrice}`);

            await pool.query<ResultSetHeader>(
              `
              insert into orders (orderId, commonId, seller, buyer, createAt, totalPrice, discountId, discountPrice)
              values (?, ?, ?, ?, ?, ?, ?, ?)
          `,
              [
                orderId,
                commonId,
                seller.name,
                buyer,
                createdDay,
                parseInt(seller.total),
                discountId,
                Math.floor(discountPrice),
              ]
            );
          });
      });
      const { totalPrice } = await CartSchema.getCartInformation(buyer);
      const { totalDiscount } =
        await UsedDiscountSchema.getUsedDiscountInformation(buyer);
      return { commonId, totalPrice: totalPrice - totalDiscount };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async saveOrder(buyer: string) {
    return await this.createOrder(buyer).then(async (orderInfo) => {
      const { commonId } = orderInfo;
      return await pool.query(
        `
        update carts
        set orderId = ?
        where buyer = ? and orderId is null
      `,
        [commonId, buyer]
      );
    });
  }
  static async confirmTransaction(
    commonId: string,
    bankCode: string,
    status: OrderStatus
  ) {
    try {
      const [rows] = await pool.query<ResultSetHeader>(
        `
      update orders
      set bankCode = ?, status = ?
      where commonId = ?
      `,
        [bankCode, status, commonId]
      );
      return rows.affectedRows > 0;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async getOrderInformation(commonId: string) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        select * 
        from orders 
        where commonId = ?
      `,
        [commonId]
      );
      console.log(rows[0]);
      return rows[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async getCheckoutOrder(buyer: string) {
    let totalDiscount = 0;
    let orderInformations = await CartSchema.getCartInformation(buyer);

    const discounts = await UsedDiscountSchema.getUsedDiscounts(buyer).then(
      (res) =>
        res.reduce((acc: any, item: any) => {
          const { seller, discountPrice } = item;
          acc[seller] = discountPrice;
          totalDiscount += discountPrice;
          return acc;
        }, {})
    );
    const orders = await CartSchema.getCart(buyer).then((cart) =>
      cart.reduce((acc: any, item: any) => {
        const { username } = item;
        if (!acc[username]) {
          acc[username] = [item];
        } else {
          acc[username].push(item);
        }
        return acc;
      }, {})
    );
    let formattedOrders = [];
    for (const key in orders) {
      formattedOrders.push({
        seller: key,
        discountPrice: discounts[key] ?? 0,
        items: orders[key],
      });
    }
    console.log(orders);

    return {
      orderInfo: {
        ...orderInformations,
        totalDiscount,
        totalShippingPrice: 0,
      },
      orders: formattedOrders,
      // discounts,
    };
  }

  static async getBuyerOrders(buyer: string, queryObject: IBuyerQueryObject) {
    /*
  [
    {
      orderId
      createdTime
      shippingPrice
      discountCode (if any)
      status
      items: []
    }
  ]
  */
    let queryStmt = `
      select commonId, seller, orderId, shipPrice, 
      discountId, discountPrice, status, totalPrice
      from orders
      where buyer = ?
      `;
    let values: any[] = [buyer];
    const { page, offset, status } = queryObject;
    if (status) {
      queryStmt += " and status = ?";
      values = [...values, status];
    }
    queryStmt += " \n order by createAt desc ";
    if (page && offset) {
      queryStmt += " \n limit ? offset ? ";
      values = [...values, +offset, +offset * (page - 1)];
    }

    try {
      const orders = await pool
        .query<RowDataPacket[]>(queryStmt, values)
        .then((rows) => rows[0]);

      const formattedOrders = await Promise.all(
        orders.map(async (order) => {
          const { commonId, seller } = order;

          const items = await pool
            .query<RowDataPacket[]>(
              `
        select c.quantity, c.productId, p.price, p.discount, p.coverImage, p.name
        from carts c, product p
        where c.orderId = ? and p.seller = ?
        and p.productId = c.productId
        `,
              [commonId, seller]
            )
            .then((rows) => rows[0]);

          return {
            ...order,
            items: items,
          };
        })
      );

      return formattedOrders;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getSellerOrders(
    seller: string,
    queryObject: ISellerQueryObject
  ) {
    const { page, offset } = queryObject;
    let queryStmt = `
      select commonId, orderId, createAt, status, buyer, hasGift, sum(totalPrice + shipPrice - discountPrice) as total
      from orders
      where seller = ? and status not in (?, ?)
      group by commonId, orderId, createAt, status, buyer, hasGift
      `;
    let values: any[] = [
      seller,
      ORDER_STATES.CONFIRMING,
      ORDER_STATES.CANCELED,
    ];
    let whereClause: any[] = [];

    if (page && offset) {
      queryStmt += " \n limit ? offset ? ";
      values = [...values, +offset, +offset * (page - 1)];
    }
    try {
      const [orders] = await pool.query<RowDataPacket[]>(queryStmt, values);
      return orders;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async getAdminOrders(admin: string, queryObject: IAdminQueryObject) {
    const { page, offset, startAt, endAt, status, orderId, time } = queryObject;
    console.log(`queryObject`);
    console.log(queryObject);

    let queryStmt = `
      select buyer, seller, orderId, createAt, commonId, status
      from orders
      `;
    let values: any[] = [];
    let whereClause: any[] = [];
    if (startAt && endAt) {
      values = [...values, startAt, endAt];
      whereClause = [...whereClause, "? < createAt and createAt < ?"];
    }
    if (orderId) {
      values = [...values, orderId];
      whereClause = [...whereClause, "orderId = ?"];
    }
    if (status) {
      values = [...values, status];
      whereClause = [...whereClause, "status = ?"];
    }
    if (whereClause.length > 0) {
      queryStmt = queryStmt + " where " + whereClause.join(" and ");
    }

    if (time) {
      queryStmt += ` order by createAt ${time === "asc" ? "ASC" : "DESC"} `;
      // values = [...values, time];
    } else {
      queryStmt += ` order by createAt asc`;
    }

    if (page && offset) {
      queryStmt += " \n limit ? offset ? ";
      values = [...values, +offset, +offset * (page - 1)];
    }

    console.log(queryStmt);

    try {
      const [orders] = await pool.query<RowDataPacket[]>(queryStmt, values);
      return orders;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
