import { Request, Response } from 'express';
import ProductSchema from '../models/product.model.js';
import ProductLinkSchema from '../models/productLink.model.js';
import ProductOptionSchema from '../models/productOption.model.js';
import { StatusCodes } from 'http-status-codes';
import z from 'zod';
import { zodImage } from '../../validator/Image.js';
import { zodVideo } from '../../validator/Video.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { CommentSchema } from '../models/comment.model.js';
import CategorySchema from '../models/category.model.js';
export const getProducts = async (req: any, res: Response) => {
  // should be scaled for search & filter
  let { searchTerm, page, offset } = req.query;
  console.log(
    `page = ${page}, offset = ${offset} , searchTerm = ${searchTerm}`
  );
  if (!page) {
    page = 1;
  }
  if (!offset) {
    offset = 10;
  }
  try {
    //console.log(req.user.username);
    if (searchTerm === '') {
      const products = await ProductSchema.getProducts(page, offset);
      res.status(StatusCodes.OK).send({
        length: products.length,
        products,
      });
    } else {
      const products = await ProductSchema.getProductsWithKey(
        searchTerm,
        page,
        offset,
        ''
      );
      res.status(StatusCodes.OK).send({
        length: products.length,
        products,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getSearchedProducts = async (req: any, res: Response) => {
  console.log(req.query);

  if (!req.body.page) {
    req.query.page = 1;
  }
  if (!req.body.offset) {
    req.query.offset = 10;
  }
  try {
    const products = await ProductSchema.getSearchedProducts(req.query);
    return res.status(StatusCodes.OK).send(products);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getProductsList = async (req: Request, res: Response) => {
  if (!req.query.page) {
    req.query.page = 1;
  }
  if (!req.query.offset) {
    req.query.offset = 10;
  }
  try {
    console.log(req.query);
    const products = await ProductSchema.getProductsList(req.query);
    res.status(StatusCodes.OK).send(products);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getReviewProductsList = async (req: Request, res: Response) => {
  if (!req.query.page) {
    req.query.page = 1;
  }
  if (!req.query.offset) {
    req.query.offset = 10;
  }
  try {
    const products = await ProductSchema.getReviewProductsList(req.query, req.user.username);
    res.status(StatusCodes.OK).send(products);
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const declineProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const result = await ProductSchema.declineProduct(productId);
    res.status(StatusCodes.OK).send({msg: "Decline success!"});
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    console.log(`productId = ${productId}`);

    const [productDetails] = await ProductSchema.queryProductDetails(productId);
    const categories = await CategorySchema.getCategoryHierachies(
      productDetails.categoryId
    );
    const assets = await ProductLinkSchema.getProductLinks(productId);
    const comments = await CommentSchema.getComments(productId);
    res.status(StatusCodes.OK).send({
      ...productDetails,
      assets,
      comments,
      categories,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const validProductDetailsSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.number(),
  description: z.string().optional(),
  material: z.string(),
  quantity: z.number(),
  seller: z.string(),
  images: z.array(zodImage).or(zodImage),
  videos: z.array(zodVideo).or(zodVideo),
});

export const addNewProduct = async (req: any, res: Response) => {
  const seller = req.user.username;

  const details = req.body;
  details.quantity = parseInt(details.quantity);
  details.price = parseInt(details.price);
  details.category = parseInt(details.category);
  console.log(details);
  console.log(seller);
  const chooseOptions1 = req.body.chooseOptions1;
  const chooseOptions2 = req.body.chooseOptions2;
  const option1 = req.body.option1;
  const option2 = req.body.option2;
  let images = req.files.images;
  let videos = req.files.videos;
  const { success: isValid } = validProductDetailsSchema.safeParse({
    ...details,
    seller,
    images,
    videos,
  });
  if (!isValid) {
    // Research Zod for more meaningful error messages
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ error: 'Please check input fields' });
  }

  if (!Array.isArray(images)) {
    images = [images];
  }
  if (!Array.isArray(videos)) {
    videos = [videos];
  }
  const filePromiseList = [...images, ...videos].map(async (file: any) => {
    try {
      return await cloudinary.v2.uploader
        .upload(file.tempFilePath, {
          use_filename: true,
          folder: 'bk_artisan',
          resource_type: 'auto',
        })
        .then(({ secure_url, resource_type }) => {
          // console.log(
          //   `secure_url = ${secure_url}, resource_type = ${resource_type}`
          // );

          fs.unlinkSync(file.tempFilePath);
          return { secure_url, resource_type };
        });
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  try {
    let responseList = await Promise.all(filePromiseList);
    console.log(`secureList = `, responseList);

    const newProductId = await ProductSchema.addProduct({
      ...details,
      image: responseList[0].secure_url,
      seller: seller,
    });

    await Promise.all([
      ProductOptionSchema.createProductOption(
        newProductId,
        option1,
        chooseOptions1
      ),
      ProductOptionSchema.createProductOption(
        newProductId,
        option2,
        chooseOptions2
      ),
      ProductLinkSchema.addProductLinks(newProductId, responseList),
    ]);

    return res.status(StatusCodes.OK).send({
      message: 'ok',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteProducts = async (req: any, res: Response) => {
  let productIds = req.query.productIds;
  console.log(productIds);

  try {
    await ProductSchema.deleteProduct(productIds);

    return res.status(StatusCodes.OK).send({
      message: 'Delete Success',
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: 'Internal Server Error' });
  }
};
