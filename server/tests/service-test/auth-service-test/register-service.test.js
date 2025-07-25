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

// Mock bcrypt
const bcrypt = {
  hash: jest.fn(),
};

// Buat mock constructor untuk userModel
let lastCreatedInstance;
const userModel = jest.fn().mockImplementation((data) => {
  lastCreatedInstance = {
    ...data,
    save: jest.fn(),
  };
  return lastCreatedInstance;
});

// Tambahkan findOne sebagai static method
userModel.findOne = jest.fn();

// Mock modules
jest.unstable_mockModule("../../../models/user-model.js", () => ({
  default: userModel,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: bcrypt,
  hash: bcrypt.hash,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Import service setelah mocking
const { registerService } = await import(
  "../../../services/auth/register-service.js"
);

describe("Register Service", () => {
  const name = "Bahrul Ach";
  const email = "test@example.com";
  const password = "Password123!";
  const hashedPassword = "hashedPassword123";

  beforeEach(() => {
    jest.clearAllMocks();
    lastCreatedInstance = null;
  });

  it("Harus berhasil register dan mengembalikan user jika email belum digunakan", async () => {
    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue(hashedPassword);

    // Mock save method yang mengubah instance dan menambahkan _id
    const mockSave = jest.fn().mockImplementation(function () {
      // Tambahkan _id ke instance saat save dipanggil
      this._id = "123456";
      return Promise.resolve(this);
    });

    // Override mock implementation untuk test ini
    userModel.mockImplementationOnce((data) => {
      const instance = {
        ...data,
        save: mockSave,
      };
      return instance;
    });

    const result = await registerService(name, email, password);

    // Verifikasi calls
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: email.toLowerCase(),
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    expect(mockSave).toHaveBeenCalled();

    // Verifikasi result
    expect(result).toEqual({
      message: "Registrasi berhasil",
      user: {
        id: "123456",
        name: "Bahrul Ach",
        email: "test@example.com",
      },
    });
  });

  it("Harus convert email ke lowercase saat mencari user", async () => {
    const emailWithUppercase = "TEST@EXAMPLE.COM";

    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue(hashedPassword);

    const mockSave = jest.fn().mockImplementation(function () {
      this._id = "123456";
      return Promise.resolve(this);
    });

    userModel.mockImplementationOnce((data) => ({
      ...data,
      save: mockSave,
    }));

    await registerService(name, emailWithUppercase, password);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: email.toLowerCase(),
    });
  });

  it("Harus gagal dengan error jika email sudah digunakan", async () => {
    const existingUser = { _id: "789012", email: "test@example.com" };
    userModel.findOne.mockResolvedValue(existingUser);

    await expect(registerService(name, email, password)).rejects.toThrow(
      AppError
    );
    await expect(registerService(name, email, password)).rejects.toMatchObject({
      statusCode: 400,
      message: "Email sudah digunakan",
    });
  });

  it("Harus memanggil bcrypt.hash dengan parameter yang benar", async () => {
    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue(hashedPassword);

    const mockSave = jest.fn().mockImplementation(function () {
      this._id = "123456";
      return Promise.resolve(this);
    });

    userModel.mockImplementationOnce((data) => ({
      ...data,
      save: mockSave,
    }));

    await registerService(name, email, password);

    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
  });

  it("Harus melempar error jika bcrypt.hash gagal", async () => {
    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockRejectedValue(new Error("Bcrypt hash error"));

    await expect(registerService(name, email, password)).rejects.toThrow(
      "Bcrypt hash error"
    );
  });

  it("Harus melempar error jika userModel.save gagal", async () => {
    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue(hashedPassword);

    const mockSave = jest
      .fn()
      .mockRejectedValue(new Error("Database save error"));

    userModel.mockImplementationOnce((data) => ({
      ...data,
      save: mockSave,
    }));

    await expect(registerService(name, email, password)).rejects.toThrow(
      "Database save error"
    );
  });

  it("Harus melempar error jika userModel.findOne gagal", async () => {
    userModel.findOne.mockRejectedValue(new Error("Database find error"));

    await expect(registerService(name, email, password)).rejects.toThrow(
      "Database find error"
    );
  });
});
