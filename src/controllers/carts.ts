import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import { CartActions, CartSchema } from "../models/carts.model.js";
import z from "zod";

const validItem = z.object({
  productId: z.number(),
  quantity: z.number(),
  note: z.string().optional(),
});

export const addToCart = async (req: any, res: Response) => {
  const isInputsValid = validItem.safeParse(req.body).success;
  const { username } = req.user;
  if (!isInputsValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: "invalid inputs",
    });
  }
  try {
    const { productId, quantity } = req.body;
    const existedId = await CartSchema.find(username, productId);
    if (existedId > 0) {
      await CartSchema.modifyItem(CartActions.ADD, existedId, {
        quantity,
      }).then(() =>
        res.status(StatusCodes.OK).send({ msg: "add existed items OK" })
      );
    } else {
      await CartSchema.addItem({
        ...req.body,
        buyer: username,
      }).then(() =>
        res.status(StatusCodes.OK).send({
          msg: "add new items oke",
        })
      );
    }
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: "server errors",
    });
  }
};

export const updateItem = async (req: any, res: Response) => {
  const { productId } = req.params;
  const isInputsValid = validItem.safeParse({
    ...req.body,
    productId: +productId,
  }).success;
  if (!isInputsValid) {
    return res.status(StatusCodes.OK).send({
      msg: "invalid inputs",
    });
  }
  const { username } = req.user;
  try {
    const { quantity, note } = req.body;
    const existedId = await CartSchema.find(username, +productId);
    if (existedId > 0) {
      await CartSchema.modifyItem(CartActions.UPDATE, existedId, {
        quantity,
        note,
      }).then(() =>
        res.status(StatusCodes.OK).send({
          msg: "updated cart items successfully",
        })
      );
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: "cart item does not exist",
      });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "internal errors" });
  }
};

export const deleteItem = async (req: any, res: Response) => {
  const { productId } = req.params;
  if (isNaN(+productId)) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: "invalid inputs",
    });
  }

  try {
    const { username } = req.user;
    const existedId = await CartSchema.find(username, +productId);
    if (existedId > 0) {
      await CartSchema.deleteItem(existedId).then(() =>
        res.status(StatusCodes.OK).send({ msg: "request successfully" })
      );
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ msg: "data does not exist" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "server errors" });
  }
};

export const getCart = async (req: any, res: Response) => {
  const { username } = req.user;

  try {
    const { cartItems, totalPrice } = await CartSchema.getCartInformation(
      username
    );
    await CartSchema.getCart(username).then((data) =>
      res.status(StatusCodes.OK).send({
        numOfItems: cartItems,
        items: data,
        totalPrice: totalPrice,
      })
    );
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "server errors" });
  }
};
