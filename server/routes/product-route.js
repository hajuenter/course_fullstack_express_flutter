import express from "express";
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

productRouter.post(
  "/add-product",
  validate(addProductValidation),
  addProductController
);
productRouter.put(
  "/edit-product/:id",
  validateParams(productIdValidation),
  validate(editProductValidation),
  editProductController
);
productRouter.get(
  "/get-product/:id",
  validateParams(productIdValidation),
  getProductController
);

productRouter.get(
  "/get-all-product",
  validateQuery(getAllProductValidation),
  getAllProductsController
);

productRouter.delete(
  "/delete-product/:id",
  validateParams(productIdValidation),
  deleteProductController
);

export default productRouter;
