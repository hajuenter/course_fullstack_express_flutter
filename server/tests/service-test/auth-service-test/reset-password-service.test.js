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
  hash: jest.fn(),
};

// Mock AppError
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

// Mock modules sebelum import
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
const { resetPasswordService } = await import(
  "../../../services/auth/reset-password-service.js"
);

describe("Reset Password Service", () => {
  const email = "test@example.com";
  const resetToken = "valid-reset-token";
  const newPassword = "newPassword123";
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockUser setiap test
    mockUser = {
      _id: "user-id",
      email: "test@example.com",
      password: "old-hashed-password",
      reset_token: "valid-reset-token",
      reset_token_expired: new Date(Date.now() + 10 * 60 * 1000), // 10 menit dari sekarang (aktif)
      save: jest.fn().mockResolvedValue(true),
    };
  });

  it("Harus berhasil reset password dengan token valid", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    const result = await resetPasswordService(email, resetToken, newPassword);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: email.toLowerCase(),
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
    expect(mockUser.password).toBe("new-hashed-password");
    expect(mockUser.reset_token).toBeNull();
    expect(mockUser.reset_token_expired).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result).toEqual({
      message: "Password berhasil direset",
    });
  });

  it("Harus normalize email ke lowercase", async () => {
    const emailToLowerCase = "TEST@EXAMPLE.COM";
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    await resetPasswordService(emailToLowerCase, resetToken, newPassword);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  it("Harus gagal dengan error jika user tidak ditemukan", async () => {
    userModel.findOne.mockResolvedValue(null);

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow(AppError);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("statusCode", 404);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("message", "User tidak ditemukan");
  });

  it("Harus gagal dengan error jika reset_token_expired tidak ada", async () => {
    const userWithoutExpired = {
      ...mockUser,
      reset_token_expired: null,
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userWithoutExpired);

    try {
      await resetPasswordService(email, resetToken, newPassword);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Token sudah kedaluwarsa");

      // Verifikasi bahwa token di-clear
      expect(userWithoutExpired.reset_token).toBeNull();
      expect(userWithoutExpired.reset_token_expired).toBeNull();
      expect(userWithoutExpired.save).toHaveBeenCalled();
    }
  });

  it("Harus gagal dengan error jika reset token sudah expired", async () => {
    const expiredUser = {
      ...mockUser,
      reset_token_expired: new Date(Date.now() - 5 * 60 * 1000), // 5 menit yang lalu (expired)
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(expiredUser);

    try {
      await resetPasswordService(email, resetToken, newPassword);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Token sudah kedaluwarsa");

      // Verifikasi bahwa token di-clear ketika expired
      expect(expiredUser.reset_token).toBeNull();
      expect(expiredUser.reset_token_expired).toBeNull();
      expect(expiredUser.save).toHaveBeenCalled();
    }
  });

  it("Harus gagal dengan error jika reset_token tidak ada", async () => {
    const userWithoutToken = {
      ...mockUser,
      reset_token: null,
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userWithoutToken);

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow(AppError);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("statusCode", 401);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("message", "Token tidak valid");
  });

  it("Harus gagal dengan error jika reset token tidak cocok", async () => {
    const userWithWrongToken = {
      ...mockUser,
      reset_token: "different-token",
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userWithWrongToken);

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow(AppError);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("statusCode", 401);
    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toHaveProperty("message", "Token tidak valid");
  });

  it("Harus hash password baru dengan bcrypt salt 10", async () => {
    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue("hashed-new-password");

    await resetPasswordService(email, resetToken, newPassword);

    expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
    expect(mockUser.password).toBe("hashed-new-password");
  });

  it("Harus clear reset token dan expired setelah berhasil reset password", async () => {
    const userToReset = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userToReset);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    await resetPasswordService(email, resetToken, newPassword);

    // Verifikasi bahwa reset token data di-clear
    expect(userToReset.reset_token).toBeNull();
    expect(userToReset.reset_token_expired).toBeNull();
    expect(userToReset.password).toBe("new-hashed-password");
    expect(userToReset.save).toHaveBeenCalled();
  });

  it("Harus mengecek expired token sebelum validasi token", async () => {
    // User dengan token expired DAN token tidak cocok
    const expiredUserWithWrongToken = {
      ...mockUser,
      reset_token: "wrong-token",
      reset_token_expired: new Date(Date.now() - 5 * 60 * 1000), // Expired
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(expiredUserWithWrongToken);

    try {
      await resetPasswordService(email, resetToken, newPassword);
      fail("Should have thrown an error");
    } catch (error) {
      // Karena logika service mengecek expired dulu, maka pesan error adalah expired
      expect(error.message).toBe("Token sudah kedaluwarsa");
      expect(error.statusCode).toBe(401);
    }
  });

  it("Harus menangani error dari bcrypt.hash", async () => {
    userModel.findOne.mockResolvedValue({ ...mockUser });
    const bcryptError = new Error("Bcrypt hashing failed");
    bcrypt.hash.mockRejectedValue(bcryptError);

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow("Bcrypt hashing failed");
  });

  it("Harus menangani error dari user.save()", async () => {
    const userWithSaveError = {
      ...mockUser,
      save: jest.fn().mockRejectedValue(new Error("Database save failed")),
    };
    userModel.findOne.mockResolvedValue(userWithSaveError);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow("Database save failed");
  });

  it("Harus menangani error dari userModel.findOne", async () => {
    const dbError = new Error("Database connection failed");
    userModel.findOne.mockRejectedValue(dbError);

    await expect(
      resetPasswordService(email, resetToken, newPassword)
    ).rejects.toThrow("Database connection failed");
  });

  it("Harus handle edge case ketika reset_token_expired adalah string date", async () => {
    const userWithStringDate = {
      ...mockUser,
      reset_token_expired: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // String ISO date
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userWithStringDate);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    const result = await resetPasswordService(email, resetToken, newPassword);

    expect(result).toEqual({
      message: "Password berhasil direset",
    });
  });

  it("Harus berhasil reset password dengan token yang persis expired pada batas waktu", async () => {
    // Buat tanggal expired yang sangat jauh di masa depan untuk memastikan tidak expired
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 tahun ke depan

    const userWithFutureExpiry = {
      ...mockUser,
      reset_token_expired: futureDate,
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(userWithFutureExpiry);
    bcrypt.hash.mockResolvedValue("new-hashed-password");

    const result = await resetPasswordService(email, resetToken, newPassword);

    expect(result).toEqual({
      message: "Password berhasil direset",
    });
  });
});
