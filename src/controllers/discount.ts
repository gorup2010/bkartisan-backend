import { Request, Response } from 'express';
import z from 'zod';
import { StatusCodes } from 'http-status-codes';
import generator from 'generate-password';
import { DiscountSchema, DiscountType } from '../models/discounts.model.js';
import { DISCOUNT_TYPES } from '../constants/discounts.js';
import { UsedDiscountSchema } from '../models/usedDiscount.model.js';

/*
Valid body 
{
    "code": "12346",
    "startedAt": "2024-05-10",
    "validUntil": "2024-05-11",
    "type": "percent",
    "quantity": 12,
    "value": 10
}
*/
const validDiscount = z.object({
  code: z.string().trim().length(6).optional(),
  seller: z.string().optional(),
  startedAt: z.coerce.date(),
  validUntil: z.coerce.date(),
  type: z.enum([
    DISCOUNT_TYPES.FIXED,
    DISCOUNT_TYPES.PERCENT,
    DISCOUNT_TYPES.BILL,
  ]),
  quantity: z.number(),
  details: z.object({
    value: z.number(),
    lowerBound: z.number().optional(),
  }),
});

export const createDiscount = async (req: Request, res: Response) => {
  const {
    success: isInputsValid,
    error: errMessage,
    data: discount,
  } = validDiscount.safeParse(req.body);
  if (!isInputsValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      errMessage,
    });
  }
  const { type, details } = discount;
  if (type === DISCOUNT_TYPES.BILL && !details.lowerBound) {
    return res.status(StatusCodes.OK).send({
      msg: 'invalid inputs',
    });
  }
  try {
    const { username } = req.user;
    let { code } = req.body;
    if (!code) {
      code = generator.generate({
        length: 6,
        uppercase: true,
      });
    }
    const codeInfo = await DiscountSchema.findByCode(code);
    // console.log(`isCodeExisted = ${isCodeExisted}`);
    if (codeInfo) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'Mã giảm giá đã tồn tại',
      });
    }
    await DiscountSchema.createDiscount({
      seller: username,
      ...req.body,
      code: code,
    }).then(() =>
      res.status(StatusCodes.OK).send({
        msg: 'create discount ok',
      })
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'server errors ',
    });
  }
};

const validPartialDiscount = z.object({
  startedAt: z.coerce.date(),
  validUntil: z.coerce.date(),
  type: z.string(),
  quantity: z.number(),
  details: z.object({
    value: z.number(),
    lowerBound: z.number().optional(),
  }),
});

export const updateDiscount = async (req: Request, res: Response) => {
  const {
    success: isInputsValid,
    error: errMessage,
    data: discount,
  } = validPartialDiscount.safeParse(req.body);
  if (!isInputsValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errMessage);
  }
  const { type, details } = discount;
  if (type === DISCOUNT_TYPES.BILL && !details.lowerBound) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: 'invalid inputs',
    });
  }
  const { id } = req.params;
  const { success: isIdValid } = z.coerce.number().safeParse(id);
  if (!isIdValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({ msg: 'invalid url' });
  }
  try {
    const isDiscountExisted = await DiscountSchema.findById(+id);
    if (!isDiscountExisted) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ msg: 'discount does not exist' });
    }
    await DiscountSchema.updateDiscount({
      id: +id,
      ...req.body,
    }).then(() =>
      res.status(StatusCodes.OK).send({ msg: 'update discount ok' })
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'server errors',
    });
  }
};

export const removeDiscount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { success: isIdValid, error: errMessage } = z.coerce
    .number()
    .safeParse(id);
  if (!isIdValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errMessage);
  }
  try {
    await DiscountSchema.deleteDiscount(+id).then(() =>
      res.status(StatusCodes.OK).send({ msg: 'delete discount ok' })
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'server errors ',
    });
  }
};

const validQueryDiscountObject = z.object({
  page: z.string().optional(),
  offset: z.string().optional(),
  type: z
    .enum([DISCOUNT_TYPES.FIXED, DISCOUNT_TYPES.PERCENT, DISCOUNT_TYPES.BILL])
    .or(z.literal('')).optional(),
  filter: z.string().or(z.literal('')).optional(),
});

export const getDiscounts = async (req: Request, res: Response) => {

  const { success: isQueryValid, error: errMessage } =
    validQueryDiscountObject.safeParse(req.query);
  if (!isQueryValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errMessage );
  }

  try {
    const { filter } = req.query;
    let filterObj = {};
    filter?.split(',').map((key: string) => {
      filterObj = { ...filterObj, [key.trim()]: true };
    });

    // console.log(filterObj);
    let { page, offset } = req.query;
    if (!page || !offset) {
      page = '1';
      offset = '10';
    }
    const { username } = req.user;

    const discounts = await DiscountSchema.getDiscount(username, {
      ...req.query,
      page: +page,
      offset: +offset,
      ...filterObj,
    });
    return res.status(StatusCodes.OK).send(discounts);
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'server errors ',
    });
  }
};

export const getDiscountDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { success: isIdValid, error: errMessage } = z.coerce
    .number()
    .safeParse(id);
  if (!isIdValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(errMessage);
  }
  try {
    await DiscountSchema.getDiscountDetail(+id).then((details) =>
      res.status(StatusCodes.OK).send(details[0])
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'server errors ',
    });
  }
};

// const validApplyDiscountRequest = z.union([
//   z.object({ code: z.string().length(6), productId: z.number() }),
//   z.object({ code: z.string().length(6) }),
// ]);

const validApplyDiscountRequest = z.object({
  code: z.string().length(6),
});
export const applyDiscount = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { productId } = req.body;

  // Has problem with db design
  const { success: isDiscountCodeValid } = validApplyDiscountRequest.safeParse({
    code,
  });
  if (!isDiscountCodeValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      msg: 'Mã giảm giá không hợp lệ',
    });
  }

  try {
    /*
    Nghiệp vụ: Người mua có thể áp dụng nhiều mã 
    nhưng mỗi cửa hàng chỉ áp dụng được một mã
    1.Trong bảng discounts, Tìm người bán bằng code của người mua gửi qua
    findSellerByCode(code: string): seller, codeId
    1.1 Không tìm thấy seller nào hết -> Không tồn tại mã
    1.2 Tìm thấy thì trả về id và tên người bán
    2. Trong bảng used_discounts, Tìm xem người mua đã áp 
    dụng code đã gửi qua hay chưa
    findAppliedCode(buyer: string, codeId): booelean
    2.1 Nếu đã áp dụng -> Gửi thông báo 
    3
    */
    const codeInfo = await DiscountSchema.findByCode(code);
    console.log(`code Infor of ${code} = `, codeInfo);

    if (!codeInfo) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ msg: 'Mã giảm giá không tồn tại' });
    }
    const { id, seller, quantity, validUntil, type } = codeInfo;
    if (quantity === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ msg: 'Đã hết mã giảm giá' });
    }
    if (new Date() > new Date(validUntil)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ msg: 'Mã giảm giá đã hết hạn' });
    }

    const { username } = req.user;
    const isDiscountUsed = await UsedDiscountSchema.findByBuyerAndDiscountId(
      username,
      id
    );
    if (!!isDiscountUsed)
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'Mã giảm giá đã được sử dụng',
      });
    const isMultipleDiscountsApplied =
      await UsedDiscountSchema.findByBuyerAndSeller(username, seller);
    if (!!isMultipleDiscountsApplied) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        msg: 'Bạn đã sử dụng mã giảm giá của người bán này',
      });
    }

    const discount = await DiscountSchema.applyDiscount(
      username,
      code,
      productId,
      type
    );
    await UsedDiscountSchema.createUsedDiscount({
      buyer: username,
      discountId: id,
      discountPrice: discount,
      seller: seller,
    });
    return res.status(StatusCodes.OK).send({
      type: type,
      discountPrice: discount ?? 'Strategy bugs',
      code: code,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send('Internal server errors');
  }
};

export const clearDiscount = async (req: Request, res: Response) => {
  const { username } = req.user;
  try {
    await UsedDiscountSchema.clearUsedDiscount(username).then(() =>
      res.status(StatusCodes.OK).send({ msg: 'delete used discounts ok' })
    );
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      msg: 'Internal server errors',
    });
  }
};
