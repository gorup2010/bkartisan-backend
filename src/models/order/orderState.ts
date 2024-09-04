import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../config/sqlconnect.js";
import { OrderSchema, ORDER_STATES } from "./order.model.js";
import crypto, { BinaryLike } from "crypto";
import moment from "moment";
import axios from "axios";
import { USERS } from "../../constants/users.js";

interface ConfirmingStateArgs {
  commonId: string;
}

interface SellerStateArgs {
  orderId: string;
  seller: string;
}

interface ReturningStateArgs {
  handler: string;
  orderId: string;
  isAccepted: boolean;
}

interface OtherStateArgs {
  orderId: string;
}

export type StateArgs =
  | ConfirmingStateArgs
  | SellerStateArgs
  | ReturningStateArgs
  | OtherStateArgs;

// interface BuyerRefundArgs {
//   orderId: string; //
//   commonId: string; // args for VNPAY refund API
// }

// interface SellerRefundArgs {
//   orderId: string; // seller only knows about his orderId
// }

// interface AdminRefundArgs {}

export type RefundArgs = {
  orderId: string;
  ipAddress: string;
};

// Base class for State design pattern
export abstract class OrderState {
  public abstract process(
    orderContext: OrderSchema,
    stateInputs: StateArgs
  ): Promise<void>;
  public abstract getState(): string;
  public async cancel(orderContext: OrderSchema, refundInputs: RefundArgs) {
    throw new Error("Cancel order is forbiden in normal states");
  }
}

export class ConfirmingState extends OrderState {
  public async process(
    orderContext: OrderSchema,
    stateInputs: ConfirmingStateArgs
  ) {
    orderContext.setState(new ProcessingState());
    /* 
    Giải thuật
    1. Dùng commonId bốc đơn hàng ra để lấy (orderId, discountId)[]
    2. Dùng commonId để cập nhật lại cart
    3. Dùng discount Id để cập nhập số lượng discount
    4. Dùng discountId để đánh dấu discount đã sử dụng cho đơn nào
    */

    const { commonId } = stateInputs;
    try {
      // Bước 1
      const [orderInfos] = await pool.query<RowDataPacket[]>(
        `
      select buyer, seller, orderId, discountId
      from orders 
      where commonId = ?
      `,
        [commonId]
      );
      const { buyer } = orderInfos[0];

      // Bước 2. Đánh dấu sản phẩm trong cart đã thuộc về đơn hàng nào đó
      await pool
        .query<ResultSetHeader>(
          `
      update carts
      set orderId = ?
      where buyer = ? and orderId is null
      `,
          [commonId, buyer]
        )
        .then((result) => console.log(result[0]));

      // 3. Lấy thông tin từ đơn hàng ra để xử lý
      orderInfos.map(async (order: any) => {
        const { discountId, orderId } = order;
        // Đánh dấu discount đã được sử dụng
        const isUpdateDiscountSuccess = await pool
          .query<ResultSetHeader>(
            `
          update used_discounts
          set orderId = ?
          where buyer = ? and orderId is null
          `,
            [orderId, buyer]
          )
          .then((result) => console.log(`update used_discounts ok`));
        // 4. Giảm số lượng discount
        const isUpdateDiscountQuantitySuccess = await pool
          .query(
            `
        update discounts
        set quantity = quantity - 1
        where id = ?
        `,
            [discountId]
          )
          .then((result) => console.log("update discounts ok"));
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  public getState() {
    return ORDER_STATES.CONFIRMING;
  }

  public async cancel(orderContext: OrderSchema, refundInputs: RefundArgs) {
    orderContext.setState(new CanceledState());
  }
}

export class ProcessingState extends OrderState {
  public async process(
    orderContext: OrderSchema,
    stateInputs: SellerStateArgs
  ) {
    const { orderId, seller } = stateInputs;
    try {
      const isSellerValid = await pool
        .query<RowDataPacket[]>(
          `
      select commonId
      from orders 
      where orderId = ? and seller = ?
      `,
          [orderId, seller]
        )
        .then((rows) => rows[0].length > 0);
      if (!isSellerValid) {
        throw new Error(`${seller} is not allowed to change order state`);
      }
      orderContext.setState(new PreparingState());
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  public getState() {
    return ORDER_STATES.PROCESSING;
  }

  public async cancel(orderContext: OrderSchema, refundInputs: RefundArgs) {
    const { orderId, ipAddress } = refundInputs;
    // Cancel ở đây chỉ đơn giản là hủy đơn, không hoàn tiền
    orderContext.setState(new CanceledState());
    try {
      const orderInfo = await pool
        .query<RowDataPacket[]>(
          `
      select commonId, buyer, seller, totalPrice, shipPrice, discountPrice
      from orders
      where orderId = ?
      `,
          [orderId]
        )
        .then((result) => result[0][0]);
      const {
        buyer,
        commonId,
        totalPrice,
        shipPrice,
        discountPrice,
        createAt,
      } = orderInfo;
      const refundAmount = totalPrice - shipPrice - discountPrice;

      process.env.TZ = "Asia/Ho_Chi_Minh";
      let date = new Date();
      const transactionDate = +moment(createAt).format("YYYYMMDDHHmmss");
      let vnp_TmnCode = process.env.VNPAY_TMNCODE;
      let secretKey = process.env.VNPAY_HASHSECRET;
      let vnp_Api = process.env.VNPAY_REFUND_URL;

      let vnp_TxnRef = commonId;
      let vnp_TransactionDate = transactionDate;
      let vnp_Amount = refundAmount * 100;
      let vnp_TransactionType = 3;
      let vnp_CreateBy = buyer;

      let currCode = "VND";

      let vnp_RequestId = moment(date).format("HHmmss");
      let vnp_Version = "2.1.0";
      let vnp_Command = "refund";
      let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

      let vnp_IpAddr = ipAddress;

      let vnp_CreateDate = +moment(date).format("YYYYMMDDHHmmss");

      let vnp_TransactionNo = 0;

      let checkSum =
        vnp_RequestId +
        "|" +
        vnp_Version +
        "|" +
        vnp_Command +
        "|" +
        vnp_TmnCode +
        "|" +
        vnp_TransactionType +
        "|" +
        vnp_TxnRef +
        "|" +
        vnp_Amount +
        "|" +
        vnp_TransactionNo +
        "|" +
        vnp_TransactionDate +
        "|" +
        vnp_CreateBy +
        "|" +
        vnp_CreateDate +
        "|" +
        vnp_IpAddr +
        "|" +
        vnp_OrderInfo;
      let hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
      let vnp_SecureHash = hmac
        .update(new Buffer(checkSum, "utf-8"))
        .digest("hex");
      let dataObj = {
        vnp_RequestId: vnp_RequestId,
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TransactionType: vnp_TransactionType,
        vnp_TxnRef: vnp_TxnRef,
        vnp_Amount: vnp_Amount,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_TransactionNo: vnp_TransactionNo,
        vnp_TransactionDate: vnp_TransactionDate,
        vnp_CreateBy: vnp_CreateBy,
        vnp_CreateDate: vnp_CreateDate,

        vnp_IpAddr: vnp_IpAddr,
        vnp_SecureHash: vnp_SecureHash,
      };
      console.log(dataObj);
      const { data } = await axios.post(vnp_Api as string, dataObj);
      console.log(data);

      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

export class PreparingState extends OrderState {
  public async process(
    orderContext: OrderSchema,
    stateInputs: SellerStateArgs
  ) {
    orderContext.setState(new ShippingState());
    const { orderId, seller } = stateInputs;
    try {
      /*
        1. Lấy tất cả sản phẩm trong đơn hàng cúa seller 
        2. Vào bảng product trừ số lượng đó ra

      */
      const isSellerValid = await pool
        .query<RowDataPacket[]>(
          `
      select commonId
      from orders 
      where orderId = ? and seller = ?
      `,
          [orderId, seller]
        )
        .then((rows) => rows[0].length > 0);
      if (!isSellerValid) {
        throw new Error(`${seller} is not allowed to change order state`);
      }
      const [productInfos] = await pool.query<RowDataPacket[]>(
        `
      select c.productId, c.quantity 
      from orders o, carts c, product p
      where o.orderId = ? and o.commonId = c.orderId 
      and p.seller = ? and p.productId = c.productId 
      `,
        [orderId, seller]
      );
      productInfos.map(async (product) => {
        const { productId, quantity } = product;
        await pool.query<ResultSetHeader>(
          `
        update product 
        set quantity = quantity - ?
        where productId = ?
        `,
          [quantity, productId]
        );
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public getState() {
    return ORDER_STATES.PREPARING;
  }
}

export class ShippingState extends OrderState {
  public async process(orderContext: OrderSchema, stateInputs: StateArgs) {
    /*
    Giải thuật
    1. Người mua up ảnh/xác minh họ đã nhận được hàng
    2. Dùng API của Payment gateway chuyển tiền cho người mua
    */

    orderContext.setState(new DoneState());
  }

  public getState() {
    return ORDER_STATES.SHIPPING;
  }
}

export class DoneState extends OrderState {
  public async process(orderContext: OrderSchema, stateInputs: StateArgs) {
    orderContext.setState(new ReturningState());
  }

  public getState() {
    return ORDER_STATES.DONE;
  }
}

export class ReturningState extends OrderState {
  private async deny(orderContext: OrderSchema) {
    orderContext.setState(new DeniedState());
  }
  private async accept(orderContext: OrderSchema) {
    orderContext.setState(new ReturnedState());
  }
  private async force(orderContext: OrderSchema) {
    orderContext.setState(new ReturnedState());
  }
  public async process(
    orderContext: OrderSchema,
    stateInputs: ReturningStateArgs
  ) {
    // orderContext.setState(new ());
    const { isAccepted, handler } = stateInputs;
    try {
      const handlerRole = await pool
        .query<RowDataPacket[]>(
          `
        select role
        from user 
        where username = ?
      `,
          [handler]
        )
        .then((rows) => rows[0][0].role);
      console.log(`handlerRole = ${handlerRole}`);
      if (![USERS.ADMIN, USERS.SELLER].includes(handlerRole)) {
        throw new Error("You are not authorize");
      }
      if (handlerRole === USERS.ADMIN && isAccepted) {
        return await this.force(orderContext);
      }
      if (handlerRole === USERS.SELLER && isAccepted) {
        return await this.accept(orderContext);
      }
      return await this.deny(orderContext);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public getState() {
    return ORDER_STATES.REQUIRE_RETURN;
  }
}

export class CanceledState extends OrderState {
  public async process(orderContext: OrderSchema, stateInputs: StateArgs) {
    throw new Error("Cannot process in deadlock state");
  }
  public cancel(
    orderContext: OrderSchema,
    refundInputs: RefundArgs
  ): Promise<void> {
    throw new Error("Cannot cancel in deadlock state");
  }
  public getState() {
    return ORDER_STATES.CANCELED;
  }
}

export class DeniedState extends OrderState {
  public async process(orderContext: OrderSchema, stateInputs: StateArgs) {
    throw new Error("Cannot process in deadlock state");
  }
  public cancel(
    orderContext: OrderSchema,
    refundInputs: RefundArgs
  ): Promise<void> {
    throw new Error("Cannot cancel in deadlock state");
  }
  public getState() {
    return ORDER_STATES.DENY_RETURN;
  }
}

export class ReturnedState extends OrderState {
  public async process(orderContext: OrderSchema, stateInputs: StateArgs) {
    throw new Error("Cannot process in deadlock state");
  }
  public cancel(
    orderContext: OrderSchema,
    refundInputs: RefundArgs
  ): Promise<void> {
    throw new Error("Cannot cancel in deadlock state");
  }
  public getState() {
    return ORDER_STATES.RETURNED;
  }
}
/*
Đơn hàng thành công thì 
mới giảm số lượng sản phẩm

*/
