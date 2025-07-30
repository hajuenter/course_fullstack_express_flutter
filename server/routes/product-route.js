import express from "express";
import auth from "../middleware/auth-middleware.js";
import {
  addProductController,
  deleteProductController,
  editProductController,
  getAllProductsController,
  getProductController,
} from "../controllers/product-controller.js";
import {
  addProductValidation,
  editProductValidation,
  getAllProductValidation,
  productIdValidation,
} from "../validations/product-validation.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../middleware/validation-middleware.js";

const productRouter = express.Router();

// Middleware auth diterapkan ke semua route di bawah
// productRouter.use(auth);

productRouter.post(
  "/add-product",
  auth,
  validate(addProductValidation),
  addProductController
);
productRouter.put(
  "/edit-product/:id",
  auth,
  validateParams(productIdValidation),
  validate(editProductValidation),
  editProductController
);
productRouter.get(
  "/get-product/:id",
  auth,
  validateParams(productIdValidation),
  getProductController
);

productRouter.get(
  "/get-all-product",
  auth,
  validateQuery(getAllProductValidation),
  getAllProductsController
);

productRouter.delete(
  "/delete-product/:id",
  auth,
  validateParams(productIdValidation),
  deleteProductController
);

export default productRouter;
