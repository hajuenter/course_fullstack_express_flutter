import Joi from "joi";

export const productIdValidation = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Format ID tidak valid",
    "string.length": "ID harus 24 karakter",
    "any.required": "ID produk wajib diisi",
  }),
});

export const addProductValidation = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Nama wajib diisi",
    "any.required": "Nama wajib diisi",
    "string.min": "Nama minimal 3 karakter",
    "string.max": "Nama maksimal 100 karakter",
  }),

  description: Joi.string().trim().min(3).max(500).required().messages({
    "string.empty": "Deskripsi wajib diisi",
    "any.required": "Deskripsi wajib diisi",
    "string.min": "Deskripsi minimal 3 karakter",
    "string.max": "Deskripsi maksimal 500 karakter",
  }),

  price: Joi.number().integer().min(0).strict().required().messages({
    "number.base": "Harga harus berupa angka",
    "number.integer": "Harga harus berupa angka bulat",
    "number.min": "Harga tidak boleh negatif",
    "any.required": "Harga wajib diisi",
  }),

  stock: Joi.number().integer().min(0).strict().required().messages({
    "number.base": "Stok harus berupa angka",
    "number.integer": "Stok harus berupa angka bulat",
    "number.min": "Stok tidak boleh negatif",
    "any.required": "Stok wajib diisi",
  }),
});

export const editProductValidation = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional().messages({
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal 3 karakter",
    "string.max": "Nama maksimal 100 karakter",
  }),

  description: Joi.string().trim().min(3).max(500).optional().messages({
    "string.empty": "Deskripsi tidak boleh kosong",
    "string.min": "Deskripsi minimal 3 karakter",
    "string.max": "Deskripsi maksimal 500 karakter",
  }),

  price: Joi.number().integer().min(0).strict().optional().messages({
    "number.base": "Harga harus berupa angka",
    "number.integer": "Harga harus berupa angka bulat",
    "number.min": "Harga tidak boleh negatif",
  }),

  stock: Joi.number().integer().min(0).strict().optional().messages({
    "number.base": "Stok harus berupa angka",
    "number.integer": "Stok harus berupa angka bulat",
    "number.min": "Stok tidak boleh negatif",
  }),
}).options({ stripUnknown: true });

export const getAllProductValidation = Joi.object({
  sort: Joi.string().valid("newest", "oldest").optional().messages({
    "any.only": "Sort hanya boleh: newest atau oldest",
    "string.empty": "Sort tidak boleh kosong",
  }),
});
