import productModel from "../../models/product-model.js";
import AppError from "../../utils/app-error.js";
import { isValidObjectId } from "mongoose";

export const editProductService = async (
  productId,
  name,
  description,
  price,
  stock
) => {
  try {
    if (!isValidObjectId(productId)) {
      throw new AppError(400, "Format ID produk tidak valid");
    }

    const product = await productModel.findById(productId);

    if (!product) {
      throw new AppError(404, "Produk tidak ditemukan");
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;

    await product.save();

    return {
      message: "Produk berhasil diperbarui",
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
    throw new AppError(500, "Edit Product Service: " + error.message);
  }
};
