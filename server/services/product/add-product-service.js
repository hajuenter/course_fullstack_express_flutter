import productModel from "../../models/product-model.js";

export const addProductService = async (name, description, price, stock) => {
  try {
    const newProduct = new productModel({
      name: name,
      description: description,
      price,
      stock,
    });

    await newProduct.save();

    return {
      message: "Produk berhasil ditambahkan",
      product: {
        id: newProduct._id,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
      },
    };
  } catch (error) {
    throw new Error("Add Product Service Error: " + error.message);
  }
};
