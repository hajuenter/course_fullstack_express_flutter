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
const { editProductService } = await import(
  "../../../services/product/edit-product-service.js"
);

// Data dummy
const validProductId = "667b1f9d2f3a4e5b6c7d8e9f";
const invalidId = "invalid-id";

const mockProduct = {
  _id: validProductId,
  name: "Laptop Lama",
  description: "Deskripsi lama",
  price: 10000000,
  stock: 3,
  save: mockSave,
};

describe("Edit Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Harus melempar error 400 jika format ID produk tidak valid", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(false);

    // Act & Assert
    await expect(
      editProductService(validProductId, "Laptop Baru", undefined, 12000000, 5)
    ).rejects.toThrow(AppError);
    await expect(
      editProductService(invalidId, "Laptop Baru")
    ).rejects.toMatchObject({
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
    await expect(
      editProductService(validProductId, "Laptop Baru")
    ).rejects.toThrow(AppError);
    await expect(
      editProductService(validProductId, "Laptop Baru")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Produk tidak ditemukan",
    });

    expect(mockFindById).toHaveBeenCalledWith(validProductId);
  });

  it("Harus mengizinkan update field yang diberikan dan mengabaikan yang undefined", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    const productInstance = { ...mockProduct };
    productInstance.save = mockSave.mockResolvedValueOnce(productInstance);
    mockFindById.mockResolvedValue(productInstance);

    // Act
    const result = await editProductService(
      validProductId,
      "Laptop Baru", // update
      undefined, // tidak diubah
      12000000, // update
      undefined // tidak diubah
    );

    // Assert
    expect(productInstance.name).toBe("Laptop Baru");
    expect(productInstance.description).toBe("Deskripsi lama"); // tetap
    expect(productInstance.price).toBe(12000000);
    expect(productInstance.stock).toBe(3); // tetap

    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual({
      message: "Produk berhasil diperbarui",
      product: {
        id: validProductId,
        name: "Laptop Baru",
        description: "Deskripsi lama",
        price: 12000000,
        stock: 3,
      },
    });
  });

  it("Harus berhasil menyimpan perubahan jika semua field diupdate", async () => {
    // Arrange
    mockIsValidObjectId.mockReturnValue(true);
    const productInstance = { ...mockProduct };
    productInstance.save = mockSave.mockResolvedValueOnce(productInstance);
    mockFindById.mockResolvedValue(productInstance);

    // Act
    const result = await editProductService(
      validProductId,
      "Laptop Gaming",
      "Laptop kencang",
      20000000,
      10
    );

    // Assert
    expect(productInstance.name).toBe("Laptop Gaming");
    expect(productInstance.description).toBe("Laptop kencang");
    expect(productInstance.price).toBe(20000000);
    expect(productInstance.stock).toBe(10);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      message: "Produk berhasil diperbarui",
      product: {
        id: validProductId,
        name: "Laptop Gaming",
        description: "Laptop kencang",
        price: 20000000,
        stock: 10,
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
    await expect(editProductService(validProductId, "Baru")).rejects.toThrow(
      AppError
    );
    await expect(
      editProductService(validProductId, "Baru")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Error khusus",
    });
  });

  it("Harus mengubah error sistem menjadi AppError 500 jika bukan AppError", async () => {
    // Arrange
    const systemError = new Error("Database save error");
    mockIsValidObjectId.mockReturnValue(true);
    mockFindById.mockResolvedValue(mockProduct);
    mockSave.mockRejectedValue(systemError);

    // Act & Assert
    await expect(
      editProductService(validProductId, "Laptop Baru")
    ).rejects.toThrow(AppError);
    await expect(
      editProductService(validProductId, "Laptop Baru")
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Edit Product Service: Database save error",
    });
  });
});
