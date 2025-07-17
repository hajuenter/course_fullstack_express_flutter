import productModel from "../../models/product-model.js";
import AppError from "../../utils/app-error.js";

export const addProductService = async (name, description, price, stock) => {
  const errors = [];

  const trimmedName = name ? name.trim() : "";
  const trimmedDescription = description ? description.trim() : "";

  if (!trimmedName || trimmedName === "") {
    errors.push("Nama wajib diisi");
  }

  if (!trimmedDescription || trimmedDescription === "") {
    errors.push("Deskripsi wajib diisi");
  }

  if (price === undefined || price === null || price === "") {
    errors.push("Harga wajib diisi");
  } else if (isNaN(price)) {
    errors.push("Harga harus berupa angka");
  } else if (Number(price) < 0) {
    errors.push("Harga tidak boleh negatif");
  }

  if (stock === undefined || stock === null || stock === "") {
    errors.push("Stok wajib diisi");
  } else if (isNaN(stock)) {
    errors.push("Stok harus berupa angka");
  } else if (Number(stock) < 0) {
    errors.push("Stok tidak boleh negatif");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validasi gagal, " + errors.join(", "));
  }

  const newProduct = new productModel({
    name: trimmedName,
    description: trimmedDescription,
    price: Number(price),
    stock: Number(stock),
  });

  await newProduct.save();

  return {
    success: true,
    status: 201,
    message: "Produk berhasil ditambahkan",
    product: {
      id: newProduct._id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      stock: newProduct.stock,
    },
  };
};
