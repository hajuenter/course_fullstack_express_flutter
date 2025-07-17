import express from "express";
import { addProductController } from "../controllers/product-controller.js";

const productRouter = express.Router();

productRouter.post("/add-product", addProductController);

export default productRouter;
