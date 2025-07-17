import { addProductService } from "../services/product/add-product-service.js";

export const addProductController = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    const result = await addProductService(name, description, price, stock);

    res.status(result.status).json({
      success: result.status,
      message: result.message,
      product: result.product,
    });
  } catch (error) {
    console.error("Error Add Product Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};
