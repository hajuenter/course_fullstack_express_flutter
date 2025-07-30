import { jest } from "@jest/globals";
import { fileURLToPath } from "url";
import path from "path";

// Setup __filename dan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock AppError
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Mock productModel
const mockSave = jest.fn();
const mockProductInstance = {
  _id: "product123",
  name: "Laptop",
  description: "Laptop bagus",
  price: 15000000,
  stock: 5,
  save: mockSave,
};

const productModel = jest.fn(() => mockProductInstance);

// Mock modul sebelum import service
jest.unstable_mockModule("../../../models/product-model.js", () => ({
  default: productModel,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Import service setelah mocking
const { addProductService } = await import(
  "../../../services/product/add-product-service.js"
);

describe("Add Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Bersihkan semua mock sebelum tiap test
  });

  afterEach(() => {
    mockSave.mockReset(); // Reset mock save setelah tiap test
  });

  it("Harus berhasil menambahkan produk dan mengembalikan respons yang sesuai", async () => {
    const name = "Laptop";
    const description = "Laptop bagus";
    const price = 15000000;
    const stock = 5;

    mockSave.mockResolvedValueOnce(mockProductInstance);

    const result = await addProductService(name, description, price, stock);

    expect(productModel).toHaveBeenCalledWith({
      name,
      description,
      price,
      stock,
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      message: "Produk berhasil ditambahkan",
      product: {
        id: "product123",
        name: "Laptop",
        description: "Laptop bagus",
        price: 15000000,
        stock: 5,
      },
    });
  });

  it("Harus melempar error jika simpan ke database gagal", async () => {
    const name = "Laptop";
    const description = "Laptop bagus";
    const price = 15000000;
    const stock = 5;

    const errorMessage = "Database save failed";
    mockSave.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      addProductService(name, description, price, stock)
    ).rejects.toThrow(`Add Product Service Error: ${errorMessage}`);

    expect(productModel).toHaveBeenCalledWith({
      name,
      description,
      price,
      stock,
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
