import { Request, Response } from "express";
import moment from "moment";
import querystring from "qs";
import crypto, { BinaryLike } from "crypto";
import { sortObject } from "../utils/sort.js";
import { StatusCodes } from "http-status-codes";
import { PaymentSchema } from "../models/payment/payment.model.js";

import { ORDER_STATES } from "../models/order/order.model.js";
import { OrderSchema } from "../models/order/order.model.js";
import axios from "axios";
import { ConfirmingState } from "../models/order/orderState.js";
export const processPayment = async (req: any, res: Response) => {
  const { username } = req.user;
  try {
    return await PaymentSchema.processPayment(username).then(
      ({ commonId, totalPrice }) => {
        console.log(`totalPrice = ${totalPrice}`);

        process.env.TZ = "Asia/Ho_Chi_Minh";
        var ipAddr =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          req.connection.socket.remoteAddress;
        console.log(`idAddr = ${ipAddr}`);

        // var dateFormat = require('dateformat');

        const tmnCode = process.env.VNPAY_TMNCODE;
        const secretKey = process.env.VNPAY_HASHSECRET;
        let vnpUrl = process.env.VNPAY_URL;
        const returnUrl = process.env.VNPAY_RETURN_URL;

        const date = new Date();

        var createDate = moment(date).format("YYYYMMDDHHmmss");
        // var orderId = moment(date).format('DDHHmmss');
        const expireDate = moment(date).add(30, "m").format("YYYYMMDDHHmmss");
        console.log(createDate);
        console.log(expireDate);

        var amount = totalPrice;
        var bankCode = "";

        var orderInfo = `Thanh toan cho khach hang ${username}`;
        var orderType = "other";
        var locale = "vn";
        // if (locale === null || locale === '') {
        //   locale = 'vn';
        // }
        const currCode = "VND";
        let vnp_Params: any = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = locale;
        vnp_Params["vnp_CurrCode"] = currCode;
        vnp_Params["vnp_TxnRef"] = commonId;
        vnp_Params["vnp_OrderInfo"] = orderInfo;
        vnp_Params["vnp_OrderType"] = orderType;
        vnp_Params["vnp_Amount"] = amount * 100;
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        vnp_Params["vnp_ExpireDate"] = expireDate;
        vnp_Params["vnp_IpAddr"] = ipAddr;
        vnp_Params["vnp_CreateDate"] = createDate;
        if (bankCode !== null && bankCode !== "") {
          vnp_Params["vnp_BankCode"] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
        const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
        vnp_Params["vnp_SecureHash"] = signed;

        console.log(`call payment`);
        console.log(vnp_Params);

        vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

        // console.log(`vnpURl before redirect = ${vnpUrl}`);
        return res.status(StatusCodes.OK).send({ paymentURL: vnpUrl });
      }
    );
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal server errors" });
  }
};

export const processSinglePayment = async (req: any, res: Response) => {
  const { orderId, totalPrice } = req.body;
  console.log(`totalPrice = ?`);

  const { username } = req.user;
  try {
    console.log(`totalPrice = ${totalPrice}`);

    process.env.TZ = "Asia/Ho_Chi_Minh";
    var ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    console.log(`idAddr = ${ipAddr}`);

    // var dateFormat = require('dateformat');

    const tmnCode = process.env.VNPAY_TMNCODE;
    const secretKey = process.env.VNPAY_HASHSECRET;
    let vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_SINGLE_ORDER_RETURN_URL;

    const date = new Date();

    var createDate = moment(date).format("YYYYMMDDHHmmss");
    // var orderId = moment(date).format('DDHHmmss');
    const expireDate = moment(date).add(30, "m").format("YYYYMMDDHHmmss");
    console.log(createDate);
    console.log(expireDate);

    var amount = totalPrice;
    var bankCode = "";

    var orderInfo = `Thanh toan cho khach hang ${username}`;
    var orderType = "other";
    var locale = "vn";
    // if (locale === null || locale === '') {
    //   locale = 'vn';
    // }
    const currCode = "VND";
    let vnp_Params: any = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = orderInfo;
    vnp_Params["vnp_OrderType"] = orderType;
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_ExpireDate"] = expireDate;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
    const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    console.log(`call payment`);
    console.log(vnp_Params);

    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    // console.log(`vnpURl before redirect = ${vnpUrl}`);
    return res.status(StatusCodes.OK).send({ paymentURL: vnpUrl });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal server errors" });
  }
};

// Send payment result to  FE
export const notifyPaymentResult = async (req: any, res: Response) => {
  try {
    var vnp_Params = req.query;
    console.log(req.query);

    var secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    var tmnCode = process.env.VNPAY_TMNCODE;
    var secretKey = process.env.VNPAY_HASHSECRET;

    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
    var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      const validTransactionStatus = "00";
      const {
        vnp_TransactionStatus: transactionStatus,
        vnp_BankCode: bankCode,
        vnp_TxnRef: commonId,
      } = req.query;
      if (transactionStatus === validTransactionStatus) {
        try {
          const order = new OrderSchema(commonId, new ConfirmingState());
          order
            .goToNextState({ commonId: commonId })
            .then(() =>
              res.redirect(`${process.env.CLIENT_PAYMENT_URL}/success`)
            );
        } catch (err) {
          console.log(err);
          res.redirect(`${process.env.CLIENT_PAYMENT_URL}/fail`);
        }
      }
    } else {
      res.redirect(`${process.env.CLIENT_PAYMENT_URL}/fail`);
    }
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal server errors" });
  }
};

export const notifySinglePaymentResult = async (req: any, res: Response) => {};

// Undone
export const getPaymentResult = async (req: any, res: Response) => {
  console.log(`called getPaymentResult`);

  var vnp_Params = req.query;
  console.log(req.query);

  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  var secretKey = process.env.VNPAY_HASHSECRET;
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    var orderId = vnp_Params["vnp_TxnRef"];
    var rspCode = vnp_Params["vnp_ResponseCode"];
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
};

// Errors occur in VNPay
export const refundPayment = async (req: any, res: Response) => {
  const { orderId } = req.body;
  let ipAddress =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  // const orderInfo = await OrderSchema.getOrderInformation(orderId);
  // const { createAt, buyer } = orderInfo;

  // process.env.TZ = "Asia/Ho_Chi_Minh";
  // let date = new Date();
  // const transactionDate = +moment(createAt).format("YYYYMMDDHHmmss");
  // let vnp_TmnCode = process.env.VNPAY_TMNCODE;
  // let secretKey = process.env.VNPAY_HASHSECRET;
  // let vnp_Api = process.env.VNPAY_REFUND_URL;

  // let vnp_TxnRef = orderId;
  // let vnp_TransactionDate = transactionDate;
  // let vnp_Amount = amount * 100;
  // let vnp_TransactionType = 3;
  // let vnp_CreateBy = buyer;

  // let currCode = "VND";

  // let vnp_RequestId = moment(date).format("HHmmss");
  // let vnp_Version = "2.1.0";
  // let vnp_Command = "refund";
  // let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

  // let vnp_CreateDate = +moment(date).format("YYYYMMDDHHmmss");

  // let vnp_TransactionNo = 0;

  // let data =
  //   vnp_RequestId +
  //   "|" +
  //   vnp_Version +
  //   "|" +
  //   vnp_Command +
  //   "|" +
  //   vnp_TmnCode +
  //   "|" +
  //   vnp_TransactionType +
  //   "|" +
  //   vnp_TxnRef +
  //   "|" +
  //   vnp_Amount +
  //   "|" +
  //   vnp_TransactionNo +
  //   "|" +
  //   vnp_TransactionDate +
  //   "|" +
  //   vnp_CreateBy +
  //   "|" +
  //   vnp_CreateDate +
  //   "|" +
  //   vnp_IpAddr +
  //   "|" +
  //   vnp_OrderInfo;
  // let hmac = crypto.createHmac("sha512", secretKey as BinaryLike);
  // let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");
  // let dataObj = {
  //   vnp_RequestId: vnp_RequestId,
  //   vnp_Version: vnp_Version,
  //   vnp_Command: vnp_Command,
  //   vnp_TmnCode: vnp_TmnCode,
  //   vnp_TransactionType: vnp_TransactionType,
  //   vnp_TxnRef: vnp_TxnRef,
  //   vnp_Amount: vnp_Amount,
  //   vnp_OrderInfo: vnp_OrderInfo,
  //   vnp_TransactionNo: vnp_TransactionNo,
  //   vnp_TransactionDate: vnp_TransactionDate,
  //   vnp_CreateBy: vnp_CreateBy,
  //   vnp_CreateDate: vnp_CreateDate,

  //   vnp_IpAddr: vnp_IpAddr,
  //   vnp_SecureHash: vnp_SecureHash,
  // };
  // console.log(dataObj);

  try {
    const order = await OrderSchema.loadOrderFromDB(orderId);
    order
      .cancel(ipAddress)
      .then(() => res.status(StatusCodes.OK).send({ msg: "cancel order ok" }));
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ msg: "Internal server errors" });
  }
};
