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
const mockFindById = jest.fn();
const productModel = {
  findById: mockFindById,
};

// Mock isValidObjectId
const mockIsValidObjectId = jest.fn();

// Mock modul
jest.unstable_mockModule("../../../models/product-model.js", () => ({
  default: productModel,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

jest.unstable_mockModule("mongoose", () => ({
  isValidObjectId: mockIsValidObjectId,
}));

// Import service setelah mocking
const { getProductService } = await import(
  "../../../services/product/get-product-service.js"
);

// Data dummy
const validProductId = "667b1f9d2f3a4e5b6c7d8e9f";
const invalidId = "invalid-id";

const mockProduct = {
  _id: validProductId,
  name: "Laptop",
  description: "Laptop bagus",
  price: 15000000,
  stock: 5,
};

describe("Get Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Harus melempar error 400 jika format ID produk tidak valid", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(false);

    // Act & Assert
    await expect(getProductService(invalidId)).rejects.toThrow(AppError);
    await expect(getProductService(invalidId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Format ID produk tidak valid",
    });

    expect(mockIsValidObjectId).toHaveBeenCalledWith(invalidId);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("Harus melempar error 404 jika produk tidak ditemukan", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    mockFindById.mockResolvedValue(null);

    // Act & Assert
    await expect(getProductService(validProductId)).rejects.toThrow(AppError);
    await expect(getProductService(validProductId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Produk tidak ditemukan",
    });

    expect(mockFindById).toHaveBeenCalledWith(validProductId);
  });

  it("Harus berhasil mengembalikan data produk jika ditemukan", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    mockFindById.mockResolvedValue(mockProduct);

    // Act
    const result = await getProductService(validProductId);

    // Assert
    expect(mockFindById).toHaveBeenCalledWith(validProductId);
    expect(result).toEqual({
      message: "Produk berhasil ditemukan",
      product: {
        id: validProductId,
        name: "Laptop",
        description: "Laptop bagus",
        price: 15000000,
        stock: 5,
      },
    });
  });

  it("Harus melempar AppError asli jika error berasal dari validasi (instanceof AppError)", async () => {
    // Arrange
    const appError = new AppError(400, "Error khusus");
    mockIsValidObjectId.mockImplementation(() => {
      throw appError;
    });

    // Act & Assert
    await expect(getProductService(validProductId)).rejects.toThrow(AppError);
    await expect(getProductService(validProductId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Error khusus",
    });
  });

  it("Harus mengubah error sistem menjadi AppError 500 jika bukan AppError", async () => {
    // Arrange
    const systemError = new Error("Database error");
    mockIsValidObjectId.mockReturnValue(true);
    mockFindById.mockRejectedValue(systemError);

    // Act & Assert
    await expect(getProductService(validProductId)).rejects.toThrow(AppError);
    await expect(getProductService(validProductId)).rejects.toMatchObject({
      statusCode: 500,
      message: "Get Product Service Error: Database error",
    });
  });
});
