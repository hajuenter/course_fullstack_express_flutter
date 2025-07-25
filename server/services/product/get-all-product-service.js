import productModel from "../../models/product-model.js";
import AppError from "../../utils/app-error.js";

export const getAllProductService = async ({ sort = "newest" }) => {
  try {
    let sortOrder = {};
    if (sort === "newest") {
      sortOrder = { createdAt: -1 };
    } else if (sort === "oldest") {
      sortOrder = { createdAt: 1 };
    }

    const products = await productModel.find({}).sort(sortOrder).lean();

    return {
      message: "Semua produk berhasil diambil",
      data: products.map((product) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
      total: products.length,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Get All Products Service Error: " + error.message);
  }
};
