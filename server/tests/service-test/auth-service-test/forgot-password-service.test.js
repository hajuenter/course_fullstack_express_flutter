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

// Mock userModel
const userModel = {
  findOne: jest.fn(),
};

// Mock nodemailer
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn().mockReturnValue({
  sendMail: mockSendMail,
});
const nodemailer = {
  createTransport: mockCreateTransport,
};

// Mock environment variables
process.env.EMAIL_SENDER = "test@example.com";
process.env.EMAIL_PASSWORD = "testpassword";

// Mock modules
jest.unstable_mockModule("../../../models/user-model.js", () => ({
  default: userModel,
}));

jest.unstable_mockModule("nodemailer", () => ({
  default: nodemailer,
}));

jest.unstable_mockModule("../../../utils/app-error.js", () => ({
  default: AppError,
}));

// Mock Math.random untuk kontrol OTP
const originalMathRandom = Math.random;

// Import service setelah mocking
const { forgotPasswordService } = await import(
  "../../../services/auth/forgot-password-service.js"
);

global.console = {
  ...console,
  error: jest.fn(),
};

describe("Forgot Password Service", () => {
  const testEmail = "test@example.com";

  // Base mock user - akan di-clone untuk setiap test
  const baseMockUser = {
    _id: "123456",
    name: "Test User",
    email: testEmail,
    otp_requested_at: null,
    otp: null,
    expired_otp: null,
    otp_attempt: 0,
  };

  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Math.random
    Math.random = originalMathRandom;
    // Clone base user untuk setiap test agar tidak saling mempengaruhi
    mockUser = {
      ...baseMockUser,
      save: jest.fn().mockImplementation(function () {
        // Update properti user saat save dipanggil
        Object.assign(this, mockUser);
        return Promise.resolve(this);
      }),
    };
  });

  afterAll(() => {
    // Restore Math.random
    Math.random = originalMathRandom;
  });

  it("Harus berhasil mengirim OTP jika email ditemukan dan belum pernah request", async () => {
    // Mock Math.random untuk menghasilkan OTP yang predictable
    Math.random = jest.fn().mockReturnValue(0.123456); // Akan menghasilkan OTP 211110 (bukan 223456)
    userModel.findOne.mockResolvedValue(mockUser);
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

    const result = await forgotPasswordService(testEmail);

    // Verifikasi pencarian user dengan email yang dinormalisasi
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: testEmail.toLowerCase(),
    });

    // Verifikasi user properties diupdate
    expect(mockUser.otp).toBe("211110"); // Sesuai perhitungan: Math.floor(100000 + 0.123456 * 900000) = 211110
    expect(mockUser.expired_otp).toBeInstanceOf(Date);
    expect(mockUser.otp_requested_at).toBeInstanceOf(Date);
    expect(mockUser.otp_attempt).toBe(0);
    expect(mockUser.save).toHaveBeenCalled();

    // Verifikasi email dikirim
    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: "Hajuenter Usaha",
      to: testEmail,
      subject: "Permintaan Reset Kata Sandi - Kode OTP",
      text: expect.stringContaining("211110"), // Sesuai OTP yang di-generate
    });

    // Verifikasi response
    expect(result).toEqual({
      message: "Kode OTP telah dikirim ke email",
    });
  });

  it("Harus convert email ke lowercase saat mencari user", async () => {
    const uppercaseEmail = "TEST@EXAMPLE.COM";
    // Gunakan fresh mock user untuk test ini
    const freshMockUser = {
      ...baseMockUser,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };
    userModel.findOne.mockResolvedValue(freshMockUser);
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

    await forgotPasswordService(uppercaseEmail);

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: testEmail.toLowerCase(),
    });
  });

  it("Harus gagal dengan error 404 jika email tidak ditemukan", async () => {
    userModel.findOne.mockResolvedValue(null);

    await expect(forgotPasswordService(testEmail)).rejects.toThrow(AppError);
    await expect(forgotPasswordService(testEmail)).rejects.toMatchObject({
      statusCode: 404,
      message: "Email tidak ditemukan",
    });

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("Harus gagal dengan error 429 jika request OTP terlalu sering (kurang dari 10 menit)", async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 menit yang lalu
    const userWithRecentRequest = {
      ...baseMockUser,
      otp_requested_at: fiveMinutesAgo,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    userModel.findOne.mockResolvedValue(userWithRecentRequest);

    await expect(forgotPasswordService(testEmail)).rejects.toThrow(AppError);
    await expect(forgotPasswordService(testEmail)).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining("Permintaan OTP terlalu sering"),
    });

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(userWithRecentRequest.save).not.toHaveBeenCalled();
  });

  it("Harus berhasil jika sudah lewat 10 menit dari request terakhir", async () => {
    const now = new Date();
    const elevenMinutesAgo = new Date(now.getTime() - 11 * 60 * 1000); // 11 menit yang lalu
    const userWithOldRequest = {
      ...baseMockUser,
      otp_requested_at: elevenMinutesAgo,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    userModel.findOne.mockResolvedValue(userWithOldRequest);
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

    const result = await forgotPasswordService(testEmail);

    expect(userWithOldRequest.save).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toEqual({
      message: "Kode OTP telah dikirim ke email",
    });
  });

  it("Harus generate OTP 6 digit", async () => {
    // Test dengan beberapa nilai Math.random
    const testCases = [
      { randomValue: 0, expectedOtp: "100000" },
      { randomValue: 0.5, expectedOtp: "550000" }, // Math.floor(100000 + 0.5 * 900000) = 550000
      { randomValue: 0.999999, expectedOtp: "999999" },
    ];

    for (const testCase of testCases) {
      Math.random = jest.fn().mockReturnValue(testCase.randomValue);
      // Fresh mock user untuk setiap test case
      const freshUser = {
        ...baseMockUser,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      userModel.findOne.mockResolvedValue(freshUser);
      mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

      await forgotPasswordService(testEmail);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(testCase.expectedOtp),
        })
      );

      jest.clearAllMocks();
    }
  });

  it("Harus set expired_otp 5 menit dari sekarang", async () => {
    const mockNow = new Date("2024-01-01T10:00:00Z");
    const expectedExpiry = new Date("2024-01-01T10:05:00Z");

    // Mock Date constructor
    const originalDate = global.Date;
    global.Date = jest.fn().mockImplementation((date) => {
      if (date !== undefined) return new originalDate(date);
      return mockNow;
    });
    global.Date.now = jest.fn().mockReturnValue(mockNow.getTime());

    const userToTest = {
      ...baseMockUser,
      save: jest.fn().mockImplementation(function () {
        // Update expired_otp saat save dipanggil
        this.expired_otp = new Date(Date.now() + 5 * 60 * 1000);
        return Promise.resolve(this);
      }),
    };

    userModel.findOne.mockResolvedValue(userToTest);
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

    await forgotPasswordService(testEmail);

    expect(userToTest.expired_otp).toEqual(expectedExpiry);

    // Restore Date
    global.Date = originalDate;
  });

  it("Harus gagal dengan error 500 jika gagal mengirim email", async () => {
    // Clear all mocks terlebih dahulu
    jest.clearAllMocks();

    // Buat user baru yang benar-benar fresh tanpa otp_requested_at
    const userToTest = {
      _id: "123456",
      name: "Test User",
      email: testEmail,
      otp_requested_at: null, // Pastikan null untuk menghindari rate limiting
      otp: null,
      expired_otp: null,
      otp_attempt: 0,
      save: jest.fn().mockImplementation(function () {
        // Update properti user saat save
        this.otp = "123456";
        this.expired_otp = new Date(Date.now() + 5 * 60 * 1000);
        this.otp_requested_at = new Date();
        this.otp_attempt = 0;
        return Promise.resolve(this);
      }),
    };

    userModel.findOne.mockResolvedValue(userToTest);
    mockSendMail.mockRejectedValue(new Error("SMTP connection failed"));

    // Gunakan try-catch untuk single call ke service
    try {
      await forgotPasswordService(testEmail);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Gagal mengirim OTP. Coba lagi nanti.");
    }
  });

  it("Harus tetap simpan data user meskipun email gagal dikirim", async () => {
    const userToTest = {
      ...baseMockUser,
      save: jest.fn().mockImplementation(function () {
        // Update properti user saat save
        this.otp = "123456";
        this.expired_otp = new Date(Date.now() + 5 * 60 * 1000);
        this.otp_requested_at = new Date();
        this.otp_attempt = 0;
        return Promise.resolve(this);
      }),
    };

    userModel.findOne.mockResolvedValue(userToTest);
    mockSendMail.mockRejectedValue(new Error("Email service down"));

    await expect(forgotPasswordService(testEmail)).rejects.toThrow(AppError);

    // Verifikasi bahwa user.save() tetap dipanggil sebelum email dikirim
    expect(userToTest.save).toHaveBeenCalled();
  });

  it("Harus melempar error jika userModel.findOne gagal", async () => {
    userModel.findOne.mockRejectedValue(new Error("Database connection error"));

    await expect(forgotPasswordService(testEmail)).rejects.toThrow(
      "Database connection error"
    );
  });

  it("Harus melempar error jika user.save gagal", async () => {
    const userToTest = {
      ...baseMockUser,
      save: jest.fn().mockRejectedValue(new Error("Database save error")),
    };

    userModel.findOne.mockResolvedValue(userToTest);

    await expect(forgotPasswordService(testEmail)).rejects.toThrow(
      "Database save error"
    );

    // Pastikan tidak mencoba mengirim email jika save gagal
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
