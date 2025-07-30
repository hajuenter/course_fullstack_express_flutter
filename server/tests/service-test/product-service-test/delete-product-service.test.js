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
const mockFindByIdAndDelete = jest.fn();
const productModel = {
  findByIdAndDelete: mockFindByIdAndDelete,
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
const { deleteProductService } = await import(
  "../../../services/product/delete-product-service.js"
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

describe("Delete Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Harus melempar error 400 jika format ID tidak valid", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(false);

    // Act & Assert
    await expect(deleteProductService(invalidId)).rejects.toThrow(AppError);
    await expect(deleteProductService(invalidId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Format ID produk tidak valid",
    });

    expect(mockIsValidObjectId).toHaveBeenCalledWith(invalidId);
    expect(mockFindByIdAndDelete).not.toHaveBeenCalled();
  });

  it("Harus melempar error 404 jika produk tidak ditemukan", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    mockFindByIdAndDelete.mockResolvedValue(null); // Tidak menemukan produk

    // Act & Assert
    await expect(deleteProductService(validProductId)).rejects.toThrow(
      AppError
    );
    await expect(deleteProductService(validProductId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Produk tidak ditemukan",
    });

    expect(mockFindByIdAndDelete).toHaveBeenCalledWith(validProductId);
  });

  it("Harus berhasil menghapus produk dan mengembalikan data yang dihapus", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    mockFindByIdAndDelete.mockResolvedValue(mockProduct);

    // Act
    const result = await deleteProductService(validProductId);

    // Assert
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith(validProductId);
    expect(result).toEqual({
      message: "Produk berhasil dihapus",
      deletedProduct: {
        id: validProductId,
        name: "Laptop",
        description: "Laptop bagus",
        price: 15000000,
        stock: 5,
      },
    });
  });

  it("Harus melempar AppError jika terjadi error validasi (error instanceof AppError)", async () => {
    // Arrange
    const appError = new AppError(400, "Error khusus");
    mockIsValidObjectId.mockImplementation(() => {
      throw appError;
    });

    // Act & Assert
    await expect(deleteProductService(validProductId)).rejects.toThrow(
      AppError
    );
    await expect(deleteProductService(validProductId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Error khusus",
    });
  });

  it("Harus mengubah error sistem menjadi AppError 500 jika bukan AppError", async () => {
    // Arrange
    const systemError = new Error("Database connection failed");
    mockIsValidObjectId.mockReturnValue(true);
    mockFindByIdAndDelete.mockRejectedValue(systemError);

    // Act & Assert
    await expect(deleteProductService(validProductId)).rejects.toThrow(
      AppError
    );
    await expect(deleteProductService(validProductId)).rejects.toMatchObject({
      statusCode: 500,
      message: "Delete Product Service Error: Database connection failed",
    });
  });
});
