import { addProductService } from "../services/product/add-product-service.js";
import { deleteProductService } from "../services/product/delete-product-service.js";
import { editProductService } from "../services/product/edit-product-service.js";
import { getAllProductService } from "../services/product/get-all-product-service.js";
import { getProductService } from "../services/product/get-product-service.js";

export const addProductController = async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;

    const result = await addProductService(name, description, price, stock);

    res.status(201).json({
      success: true,
      message: result.message,
      product: result.product,
    });
  } catch (error) {
    console.error("Error Add Product Controller:", error.message);
    next(error);
  }
};

export const editProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    const result = await editProductService(
      id,
      name,
      description,
      price,
      stock
    );

    res.status(200).json({
      success: true,
      message: result.message,
      product: result.product,
    });
  } catch (error) {
    console.error("Error Edit Product Controller:", error.message);
    next(error);
  }
};

export const getProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getProductService(id);

    res.status(200).json({
      success: true,
      message: result.message,
      product: result.product,
    });
  } catch (error) {
    console.error("Error Get Product Controller:", error.message);
    next(error);
  }
};

export const getAllProductsController = async (req, res, next) => {
  try {
    const { sort = "newest" } = req.query;

    const result = await getAllProductService({ sort });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error("Error Get All Products Controller:", error.message);
    next(error);
  }
};

export const deleteProductController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await deleteProductService(id);

    res.status(200).json({
      success: true,
      message: result.message,
      deletedProduct: result.deletedProduct,
    });
  } catch (error) {
    console.error("Error Delete Product Controller:", error.message);
    next(error);
  }
};
