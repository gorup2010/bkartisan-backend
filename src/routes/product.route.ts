import { Router } from 'express';
import {
  getProducts,
  getProductDetails,
  addNewProduct,
  deleteProducts,
  getProductsList,
  getSearchedProducts,
  getReviewProductsList,
  declineProduct
} from '../controllers/product.js';
import { authRole } from '../utils/permission.js';
const productRouter = Router();


productRouter.get('/products', getProducts);

productRouter.get('/products/search', getSearchedProducts)

productRouter.get('/products-list', authRole(["admin", "collab"]), getProductsList)
 
productRouter.get('/review-products-list', authRole(["admin", "collab"]), getReviewProductsList)

productRouter.patch('products/:productId/decline-product', authRole(["admin", "collab"]), declineProduct)

productRouter.get('/products/:productId', getProductDetails);

productRouter.post('/products', addNewProduct);

productRouter.delete('/products', deleteProducts);

export default productRouter;
