import { Response } from "express";
import { OrderSchema } from "../models/order/order.model.js";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ORDER_STATES } from "../models/order/order.model.js";

export const createOrder = async (req: any, res: Response) => {
  const { username } = req.user;
  try {
    return await OrderSchema.createOrder(username).then(() =>
      res.status(StatusCodes.OK).send({ msg: "create order ok" })
    );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

export const saveOrder = async (req: any, res: Response) => {
  const { username } = req.user;
  try {
    return await OrderSchema.saveOrder(username).then(() =>
      res.status(StatusCodes.CREATED).send({ msg: "create order ok" })
    );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

export const getCheckoutOrder = async (req: any, res: Response) => {
  const { username } = req.user;
  try {
    const orderInformation = await OrderSchema.getCheckoutOrder(username);
    return res.status(StatusCodes.OK).send(orderInformation);
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

export const changeOrderState = async (req: any, res: Response) => {
  const { username: seller } = req.user;
  const { orderId } = req.body;

  try {
    const order = await OrderSchema.loadOrderFromDB(orderId);

    await order
      .goToNextState({ seller, orderId })
      .then(() =>
        res.status(StatusCodes.OK).send({ msg: "change seller order state ok" })
      );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

export const handleReturnedOrder = async (req: any, res: Response) => {
  const { isAccepted, orderId } = req.body;
  const { username } = req.user;

  try {
    const order = await OrderSchema.loadOrderFromDB(orderId);
    await order
      .goToNextState({ isAccepted, orderId, handler: username })
      .then(() =>
        res.status(StatusCodes.OK).send({ msg: "handle request ok" })
      );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

const validBuyerRequest = z.object({
  page: z.string().optional(),
  offset: z.string().optional(),
  status: z
    .enum(Object.values(ORDER_STATES) as [string, ...string[]])
    .optional(),
});

export const getBuyerOrders = async (req: any, res: Response) => {
  const { success: isBuyerRequestValid, error: errorMessage } =
    validBuyerRequest.safeParse(req.query);
  if (!isBuyerRequestValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
  }
  const { page, offset } = req.query;
  req.query.page = page ?? 1;
  req.query.offset = offset ?? 10;
  const { username } = req.user;
  try {
    return await OrderSchema.getBuyerOrders(username, req.query).then(
      (orders) => {
        console.log(`orders`);
        console.log(orders);
        return res.status(StatusCodes.OK).send(orders);
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

const validSellerRequest = z.object({
  page: z.string().optional(),
  offset: z.string().optional(),
});

export const getSellerOrders = async (req: any, res: Response) => {
  const { success: isSellerRequestValid, error: errorMessage } =
    validSellerRequest.safeParse(req.query);
  if (!isSellerRequestValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
  }
  const { page, offset } = req.query;
  req.query.page = page ?? 1;
  req.query.offset = offset ?? 10;
  const { username } = req.user;
  try {
    return await OrderSchema.getSellerOrders(username, req.query).then(
      (orders) => {
        console.log(`orders`);
        console.log(orders);
        return res.status(StatusCodes.OK).send(orders);
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};

const validAdminRequest = z.object({
  page: z.string().optional(),
  offset: z.string().optional(),
  status: z
    .enum(Object.values(ORDER_STATES) as [string, ...string[]])
    .optional(),
  startAt: z.string().date().optional(),
  endAt: z.string().date().optional(),
  orderId: z.string().length(10, "orderId has 10 characters").optional(),
  time: z.enum(["asc", "desc"]).optional(),
});
export const getAdminOrders = async (req: any, res: Response) => {
  const { success: isQueryParamsValid, error: errorMessage } =
    validAdminRequest.safeParse(req.query);
  if (!isQueryParamsValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errorMessage);
  }
  const { page, offset } = req.query;
  req.query.page = page ?? 1;
  req.query.offset = offset ?? 10;
  console.log(req.query);

  const { username } = req.user;
  try {
    return await OrderSchema.getAdminOrders(username, req.query).then(
      (orders) => res.status(StatusCodes.OK).send(orders)
    );
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal Server Error" });
  }
};
// export const getOrders = async (req: any, res: Response) => {
//   const seller = req.user.username;

//   let { searchTerm, page, offset } = req.query;
//   console.log(
//     `page = ${page}, offset = ${offset} , searchTerm = ${searchTerm}`
//   );
//   if (!page) {
//     page = 1;
//   }
//   if (!offset) {
//     offset = 10;
//   }
//   try {
//     const orders = await OrderSchema.getOrders(
//       seller,
//       searchTerm,
//       page,
//       offset
//     );
//     res.status(StatusCodes.OK).send({
//       length: orders.length,
//       orders,
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .send({ error: 'Internal Server Error' });
//   }
// };

// export const getOrderDetail = async (req: any, res: Response) => {
//   try {
//     const { orderId } = req.params;
//     const order = await OrderSchemaV1.queryOrderDetails(orderId);
//     const orderProduct = await OrderProductSchema.queryOrderProducts(orderId);
//     const buyer = await UserModel.findOne(order.buyer);

//     res.status(StatusCodes.OK).send({
//       order,
//       orderProduct,
//       buyer,
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .send({ error: 'Internal Server Error' });
//   }
// };
