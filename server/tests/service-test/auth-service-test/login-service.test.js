import { jest } from "@jest/globals";
import { fileURLToPath } from "url";
import path from "path";

// Setup __filename dan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock userModel
const userModel = {
  findOne: jest.fn(),
};

// Mock bcrypt
const bcrypt = {
  compare: jest.fn(),
};

// Mock jwt
const jwt = {
  sign: jest.fn(),
};

// Mock AppError
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Mock modules sebelum import
jest.unstable_mockModule("../../../models/user-model.js", () => ({
  default: userModel,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: bcrypt,
  compare: bcrypt.compare,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: jwt,
  sign: jwt.sign,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Mock process.env
process.env.JWT_SECRET = "test-secret";

// Import service setelah mocking
const { loginService } = await import(
  "../../../services/auth/login-service.js"
);

describe("Login Service", () => {
  const email = "test@example.com";
  const password = "Password123!";
  const hashedPassword = "hashedPassword123";
  const mockUser = {
    _id: "123456",
    name: "Bahrul Ach",
    email: "test@example.com",
    password: hashedPassword,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Harus berhasil login dan mengembalikan token jika email dan password benar", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("dummy-jwt-token");

    const result = await loginService(email, password);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: email.toLowerCase(),
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "123456", email: "test@example.com" },
      "test-secret",
      { expiresIn: "1d" }
    );

    expect(result).toEqual({
      message: "Login berhasil",
      token: "dummy-jwt-token",
      user: {
        id: "123456",
        name: "Bahrul Ach",
        email: "test@example.com",
      },
    });
  });

  it("Harus convert email ke lowercase", async () => {
    const uppercaseEmail = "TEST@EXAMPLE.COM";
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("dummy-jwt-token");

    await loginService(uppercaseEmail, password);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  it("Harus gagal dengan error jika user tidak ditemukan", async () => {
    userModel.findOne.mockResolvedValue(null);

    await expect(loginService(email, password)).rejects.toThrow(AppError);
    await expect(loginService(email, password)).rejects.toMatchObject({
      statusCode: 401,
      message: "Email atau password salah",
    });
  });

  it("Harus gagal dengan error jika password salah", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginService(email, password)).rejects.toThrow(AppError);
    await expect(loginService(email, password)).rejects.toMatchObject({
      statusCode: 401,
      message: "Email atau password salah",
    });
  });

  it("Harus melempar error jika ada kesalahan internal (misalnya database error)", async () => {
    const errorMessage = "Database error";
    userModel.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(loginService(email, password)).rejects.toThrow(errorMessage);
  });

  // === Test tambahan untuk memastikan bcrypt bekerja dengan benar ===
  it("Harus memanggil bcrypt.compare dengan parameter yang benar", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("dummy-jwt-token");

    await loginService(email, password);

    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
  });

  it("Harus mengembalikan false dari bcrypt.compare jika password salah", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginService(email, password)).rejects.toThrow(AppError);
    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
  });

  // === Test tambahan untuk memastikan jwt.sign bekerja dengan benar ===
  it("Harus memanggil jwt.sign dengan payload dan secret yang benar", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    const mockToken = "generated-jwt-token";
    jwt.sign.mockReturnValue(mockToken);

    const result = await loginService(email, password);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUser._id, email: mockUser.email },
      "test-secret",
      { expiresIn: "1d" }
    );
    expect(result.token).toBe(mockToken);
  });

  it("Harus melempar error jika jwt.sign gagal", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockImplementation(() => {
      throw new Error("JWT signing failed");
    });

    await expect(loginService(email, password)).rejects.toThrow(
      "JWT signing failed"
    );
  });

  it("Harus melempar error jika bcrypt.compare gagal", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockRejectedValue(new Error("Bcrypt compare error"));

    await expect(loginService(email, password)).rejects.toThrow(
      "Bcrypt compare error"
    );
  });
});
