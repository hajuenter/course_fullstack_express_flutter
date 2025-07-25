import {
  productIdValidation,
  addProductValidation,
  editProductValidation,
  getAllProductValidation,
} from "../../validations/product-validation.js";

describe("Validasi Product", () => {
  describe("Product ID Validation", () => {
    it("Harus validasi sukses dengan ID yang benar", () => {
      const data = {
        id: "6878b0faec4ffb7e28f40497",
      };

      const { error } = productIdValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika ID kosong", () => {
      const { error } = productIdValidation.validate({});
      expect(error.message).toBe("ID produk wajib diisi");
    });

    it("Harus gagal jika ID bukan hex", () => {
      const { error } = productIdValidation.validate({
        id: "6878b0faec4ffb7e28f404gg",
      });
      expect(error.message).toBe("Format ID tidak valid");
    });

    it("Harus gagal jika ID tidak 24 karakter", () => {
      const { error } = productIdValidation.validate({
        id: "6878b0faec4ffb7e28f4049",
      });
      expect(error.message).toBe("ID harus 24 karakter");
    });
  });

  describe("Add Product Validation", () => {
    it("Harus validasi sukses dengan data yang benar", () => {
      const data = {
        name: "Laptop Gaming",
        description: "Laptop untuk gaming profesional",
        price: 15000000,
        stock: 10,
      };

      const { error } = addProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika nama kosong", () => {
      const { error } = addProductValidation.validate({
        description: "Deskripsi produk",
        price: 100000,
        stock: 5,
      });
      expect(error.message).toBe("Nama wajib diisi");
    });

    it("Harus gagal jika nama kurang dari 3 karakter", () => {
      const { error } = addProductValidation.validate({
        name: "LP",
        description: "Deskripsi produk",
        price: 100000,
        stock: 5,
      });
      expect(error.message).toBe("Nama minimal 3 karakter");
    });

    it("Harus gagal jika nama lebih dari 100 karakter", () => {
      const { error } = addProductValidation.validate({
        name: "a".repeat(101),
        description: "Deskripsi produk",
        price: 100000,
        stock: 5,
      });
      expect(error.message).toBe("Nama maksimal 100 karakter");
    });

    it("Harus gagal jika description kosong", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        price: 100000,
        stock: 5,
      });
      expect(error.message).toBe("Deskripsi wajib diisi");
    });

    it("Harus gagal jika harga kosong", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        stock: 5,
      });
      expect(error.message).toBe("Harga wajib diisi");
    });

    it("Harus gagal jika harga bukan angka", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        price: "seratus",
        stock: 5,
      });
      expect(error.message).toBe("Harga harus berupa angka");
    });

    it("Harus gagal jika harga string angka", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        price: "100000",
        stock: 5,
      });
      expect(error.message).toBe("Harga harus berupa angka");
    });

    it("Harus gagal jika harga negatif", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        price: -100000,
        stock: 5,
      });
      expect(error.message).toBe("Harga tidak boleh negatif");
    });

    it("Harus gagal jika stok kosong", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        price: 100000,
      });
      expect(error.message).toBe("Stok wajib diisi");
    });

    it("Harus gagal jika stok negatif", () => {
      const { error } = addProductValidation.validate({
        name: "Laptop",
        description: "Deskripsi produk",
        price: 100000,
        stock: -5,
      });
      expect(error.message).toBe("Stok tidak boleh negatif");
    });
  });

  describe("Edit Product Validation", () => {
    it("Harus validasi sukses dengan data yang benar", () => {
      const data = {
        name: "Laptop Gaming Updated",
        description: "Laptop untuk gaming profesional updated",
        price: 16000000,
        stock: 8,
      };

      const { error } = editProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus validasi sukses dengan data parsial", () => {
      const data = {
        name: "Laptop Updated",
        price: 16000000,
      };

      const { error } = editProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika harga string angka", () => {
      const { error } = editProductValidation.validate({
        name: "Laptop",
        price: "100000",
      });
      expect(error.message).toBe("Harga harus berupa angka");
    });

    it("Harus gagal jika stok negatif", () => {
      const { error } = editProductValidation.validate({
        name: "Laptop",
        stock: -5,
      });
      expect(error.message).toBe("Stok tidak boleh negatif");
    });
  });

  describe("Get All Products Validation", () => {
    it("Harus validasi sukses dengan sort newest", () => {
      const data = { sort: "newest" };
      const { error } = getAllProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus validasi sukses dengan sort oldest", () => {
      const data = { sort: "oldest" };
      const { error } = getAllProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus validasi sukses dengan data kosong", () => {
      const data = {};
      const { error } = getAllProductValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it('Harus gagal jika sort string kosong (sort="")', () => {
      const { error } = getAllProductValidation.validate({
        sort: '""',
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("Sort hanya boleh: newest atau oldest");
    });

    it("Harus gagal jika sort kosong (sort=)", () => {
      const { error } = getAllProductValidation.validate({
        sort: "",
      });
      expect(error).toBeDefined();
      expect(error.message).toEqual(
        expect.stringContaining("Sort hanya boleh: newest atau oldest")
      );
    });

    it("Harus gagal jika sort value tidak valid", () => {
      const { error } = getAllProductValidation.validate({
        sort: "asc",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("Sort hanya boleh: newest atau oldest");
    });
  });
});
