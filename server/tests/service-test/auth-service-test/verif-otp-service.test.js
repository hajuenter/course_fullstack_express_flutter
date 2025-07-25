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

// Mock crypto
const crypto = {
  randomBytes: jest.fn(),
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

jest.unstable_mockModule("crypto", () => ({
  default: crypto,
  randomBytes: crypto.randomBytes,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Import service setelah mocking
const { verifOtpService } = await import(
  "../../../services/auth/verif-otp-service.js"
);

describe("Verif OTP Service", () => {
  const email = "test@example.com";
  const otp = "123456";
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockUser setiap test
    mockUser = {
      _id: "user-id",
      email: "test@example.com",
      otp: "123456",
      expired_otp: new Date(Date.now() + 5 * 60 * 1000), // 5 menit dari sekarang (aktif)
      otp_attempt: 0,
      save: jest.fn().mockResolvedValue(true),
    };
  });

  it("Harus berhasil verifikasi OTP dan mengembalikan reset token jika OTP benar", async () => {
    userModel.findOne.mockResolvedValue({ ...mockUser });
    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue("random-reset-token"),
    });

    const result = await verifOtpService(email, otp);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: email.toLowerCase(),
    });
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    expect(result).toEqual({
      message: "OTP valid",
      resetToken: "random-reset-token",
    });
  });

  it("Harus convert email ke lowercase", async () => {
    const uppercaseEmail = "TEST@EXAMPLE.COM";
    userModel.findOne.mockResolvedValue({ ...mockUser });

    await verifOtpService(uppercaseEmail, otp);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  it("Harus gagal dengan error jika user tidak ditemukan", async () => {
    userModel.findOne.mockResolvedValue(null);

    await expect(verifOtpService(email, otp)).rejects.toThrow(AppError);
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "statusCode",
      404
    );
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "message",
      "User tidak ditemukan"
    );
  });

  it("Harus gagal dengan error jika OTP kadaluarsa", async () => {
    const expiredUser = {
      ...mockUser,
      expired_otp: new Date(Date.now() - 1000), // Sudah kadaluarsa (1 detik yang lalu)
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(expiredUser);

    await expect(verifOtpService(email, otp)).rejects.toThrow(AppError);
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "statusCode",
      401
    );
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "message",
      "Kode OTP sudah kadaluarsa"
    );
  });

  it("Harus gagal dengan error jika OTP salah", async () => {
    const wrongOtpUser = {
      ...mockUser,
      otp: "654321", // OTP salah
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(wrongOtpUser);

    await expect(verifOtpService(email, otp)).rejects.toThrow(AppError);
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "statusCode",
      401
    );
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "message",
      "Kode OTP salah"
    );
  });

  it("Harus gagal dengan error 'OTP salah 5 kali' ketika attempt mencapai batas maksimal", async () => {
    // Gunakan tanggal yang sangat jauh di masa depan untuk memastikan tidak expired
    const veryFutureDate = new Date();
    veryFutureDate.setFullYear(veryFutureDate.getFullYear() + 10); // 10 tahun ke depan

    const testUser = {
      _id: "test-max-attempt-id",
      email: "test@example.com",
      otp: "999999", // OTP yang tidak match dengan input "123456"
      otp_attempt: 4, // Akan menjadi 5 setelah increment
      expired_otp: veryFutureDate, // Pastikan tidak expired
      save: jest.fn().mockResolvedValue(true),
    };

    userModel.findOne.mockResolvedValue(testUser);

    try {
      await verifOtpService("test@example.com", "123456");
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("OTP salah 5 kali. OTP telah hangus.");
    }
  });

  it("Harus gagal dengan 'kadaluarsa' meskipun sudah 5 kali salah jika OTP expired", async () => {
    const pastDate = new Date();
    pastDate.setTime(Date.now() - 5 * 60 * 1000); // 5 menit yang lalu (EXPIRED)

    const expiredUserWith5Attempts = {
      _id: "user-id-3",
      email: "test@example.com",
      otp: "654321", // OTP salah
      otp_attempt: 4, // Sudah 4 kali salah, akan menjadi 5
      expired_otp: pastDate, // EXPIRED
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(expiredUserWith5Attempts);

    await expect(verifOtpService(email, otp)).rejects.toThrow(AppError);
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "statusCode",
      401
    );
    // Karena logika service mengecek expired dulu, maka pesan error adalah expired
    await expect(verifOtpService(email, otp)).rejects.toHaveProperty(
      "message",
      "Kode OTP sudah kadaluarsa"
    );

    // Verifikasi bahwa data di-reset karena expired
    expect(expiredUserWith5Attempts.otp).toBeNull();
    expect(expiredUserWith5Attempts.expired_otp).toBeNull();
    expect(expiredUserWith5Attempts.otp_attempt).toBe(0);
    expect(expiredUserWith5Attempts.save).toHaveBeenCalled();
  });

  it("Harus increment otp_attempt ketika OTP salah", async () => {
    const wrongOtpUser = {
      _id: "increment-test-user",
      email: "test@example.com",
      otp: "654321", // OTP salah
      otp_attempt: 2, // Start dengan 2, seharusnya jadi 3
      expired_otp: new Date(Date.now() + 60 * 60 * 1000), // 1 jam ke depan
      save: jest.fn().mockResolvedValue(true),
    };

    userModel.findOne.mockResolvedValue(wrongOtpUser);

    try {
      await verifOtpService(email, otp);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Kode OTP salah");

      // Verifikasi bahwa otp_attempt telah di-increment
      expect(wrongOtpUser.otp_attempt).toBe(3);
      expect(wrongOtpUser.save).toHaveBeenCalled();
    }
  });

  it("Harus membuat reset_token dan reset_token_expired ketika OTP benar", async () => {
    const futureDate = new Date();
    futureDate.setTime(Date.now() + 30 * 60 * 1000); // 30 menit ke depan

    const validUser = {
      _id: "user-id-4",
      email: "test@example.com",
      otp: "123456", // OTP benar
      otp_attempt: 2, // Ada attempt sebelumnya
      expired_otp: futureDate, // Masih valid
      save: jest.fn().mockResolvedValue(true),
    };
    userModel.findOne.mockResolvedValue(validUser);
    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue("random-reset-token"),
    });

    const result = await verifOtpService(email, otp);

    // Pastikan reset_token dan expired time di-set
    expect(validUser.reset_token).toBe("random-reset-token");
    expect(validUser.reset_token_expired).toBeInstanceOf(Date);
    // Pastikan expired time adalah sekitar 10 menit dari sekarang (toleransi 1 detik)
    const expectedExpiredTime = new Date(Date.now() + 10 * 60 * 1000);
    const timeDiff = Math.abs(
      validUser.reset_token_expired.getTime() - expectedExpiredTime.getTime()
    );
    expect(timeDiff).toBeLessThan(1000); // Toleransi 1 detik

    // Pastikan OTP data di-reset
    expect(validUser.otp).toBeNull();
    expect(validUser.expired_otp).toBeNull();
    expect(validUser.otp_attempt).toBe(0);
    expect(validUser.save).toHaveBeenCalled();

    expect(result).toEqual({
      message: "OTP valid",
      resetToken: "random-reset-token",
    });
  });

  it("Harus melempar error jika ada kesalahan internal", async () => {
    const errorMessage = "Database error";
    userModel.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(verifOtpService(email, otp)).rejects.toThrow(errorMessage);
  });
});
