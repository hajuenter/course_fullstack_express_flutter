import productModel from "../../models/product-model.js";
import AppError from "../../utils/app-error.js";
import { isValidObjectId } from "mongoose";

export const getProductService = async (productId) => {
  try {
    if (!isValidObjectId(productId)) {
      throw new AppError(400, "Format ID produk tidak valid");
    }

    const product = await productModel.findById(productId);

    if (!product) {
      throw new AppError(404, "Produk tidak ditemukan");
    }

    return {
      message: "Produk berhasil ditemukan",
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Get Product Service Error: " + error.message);
  }
};
