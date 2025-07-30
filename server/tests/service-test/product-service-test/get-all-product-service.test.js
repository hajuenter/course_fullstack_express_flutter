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
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockLean = jest.fn();

// Setup chaining: find().sort().lean()
mockFind.mockReturnValue({
  sort: mockSort,
});
mockSort.mockReturnValue({
  lean: mockLean,
});

const productModel = {
  find: mockFind,
};

// Mock modul
jest.unstable_mockModule("../../../models/product-model.js", () => ({
  default: productModel,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Import service setelah mocking
const { getAllProductService } = await import(
  "../../../services/product/get-all-product-service.js"
);

// Data dummy
const mockRawProducts = [
  {
    _id: "667b1f9d2f3a4e5b6c7d8e9f",
    name: "Laptop",
    description: "Laptop bagus",
    price: 15000000,
    stock: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    _id: "667b1f9d2f3a4e5b6c7d8ea0",
    name: "Mouse",
    description: "Mouse wireless",
    price: 250000,
    stock: 20,
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2023-12-05T00:00:00Z",
  },
];

describe("Get All Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Harus mengambil semua produk dengan urutan terbaru (newest) secara default", async () => {
    // Arrange
    mockLean.mockResolvedValue(mockRawProducts);
    mockSort.mockReturnValue({ lean: mockLean });

    // Act
    const result = await getAllProductService({});

    // Assert
    expect(mockFind).toHaveBeenCalledWith({});
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockLean).toHaveBeenCalled();

    expect(result).toEqual({
      message: "Semua produk berhasil diambil",
      data: [
        {
          id: "667b1f9d2f3a4e5b6c7d8e9f",
          name: "Laptop",
          description: "Laptop bagus",
          price: 15000000,
          stock: 5,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "667b1f9d2f3a4e5b6c7d8ea0",
          name: "Mouse",
          description: "Mouse wireless",
          price: 250000,
          stock: 20,
          createdAt: "2023-12-01T00:00:00Z",
          updatedAt: "2023-12-05T00:00:00Z",
        },
      ],
      total: 2,
    });
  });

  it("Harus mengambil produk dengan urutan terbaru jika sort = 'newest'", async () => {
    // Arrange
    mockLean.mockResolvedValue(mockRawProducts);

    // Act
    const result = await getAllProductService({ sort: "newest" });

    // Assert
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result.total).toBe(2);
    expect(result.data.length).toBe(2);
  });

  it("Harus mengambil produk dengan urutan terlama jika sort = 'oldest'", async () => {
    // Arrange
    mockLean.mockResolvedValue(mockRawProducts);

    // Act
    const result = await getAllProductService({ sort: "oldest" });

    // Assert
    expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(result.total).toBe(2);
  });

  it("Harus menggunakan sort default ketika object kosong diberikan", async () => {
    // Arrange
    mockLean.mockResolvedValue(mockRawProducts);

    // Act
    const result = await getAllProductService({});

    // Assert
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result.total).toBe(2);
  });

  it("Harus mengembalikan data kosong jika tidak ada produk", async () => {
    // Arrange
    mockLean.mockResolvedValue([]);

    // Act
    const result = await getAllProductService({});

    // Assert
    expect(result).toEqual({
      message: "Semua produk berhasil diambil",
      total: 0,
      data: [],
    });
  });

  it("Harus melempar AppError asli jika error berasal dari validasi (instanceof AppError)", async () => {
    // Arrange
    const appError = new AppError(400, "Error khusus");
    mockLean.mockImplementation(() => {
      throw appError;
    });

    // Act & Assert
    await expect(getAllProductService({})).rejects.toThrow(AppError);
    await expect(getAllProductService({})).rejects.toMatchObject({
      statusCode: 400,
      message: "Error khusus",
    });
  });

  it("Harus mengubah error sistem menjadi AppError 500 jika bukan AppError", async () => {
    // Arrange
    const systemError = new Error("Database connection failed");
    mockLean.mockRejectedValue(systemError);

    // Act & Assert
    await expect(getAllProductService({})).rejects.toThrow(AppError);
    await expect(getAllProductService({})).rejects.toMatchObject({
      statusCode: 500,
      message: "Get All Products Service Error: Database connection failed",
    });
  });
});
