import { jest } from "@jest/globals";

jest.unstable_mockModule("../models/user-model.js", () => ({
  default: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("nodemailer", () => {
  const sendMail = jest.fn().mockResolvedValue(true);
  const createTransport = jest.fn(() => ({ sendMail }));

  return {
    default: {
      createTransport,
    },
    __mock__: {
      sendMail,
      createTransport,
    },
  };
});

const { LupaPasswordService } = await import(
  "../services/auth/lupa-password-service.js"
);
const AppError = (await import("../utils/app-error.js")).default;
const User = (await import("../models/user-model.js")).default;
const { __mock__ } = await import("nodemailer");

describe("LupaPasswordService", () => {
  beforeEach(() => {
    // Reset semua mock sebelum setiap test
    jest.clearAllMocks();
    // Reset mock sendMail ke state default (berhasil)
    __mock__.sendMail.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("harus melempar error jika email kosong", async () => {
    await expect(LupaPasswordService("")).rejects.toThrow(AppError);
    await expect(LupaPasswordService("")).rejects.toThrow("Email wajib diisi");
  });

  it("harus melempar error jika email tidak ditemukan", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(LupaPasswordService("test@example.com")).rejects.toThrow(
      AppError
    );
    await expect(LupaPasswordService("test@example.com")).rejects.toThrow(
      "Email tidak ditemukan"
    );
  });

  it("harus melempar error jika permintaan OTP dilakukan kurang dari 10 menit yang lalu", async () => {
    const now = new Date();
    const fakeUser = {
      email: "test@example.com",
      name: "Test User",
      otp_requested_at: new Date(now.getTime() - 5 * 60 * 1000),
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(fakeUser);

    await expect(LupaPasswordService("test@example.com")).rejects.toThrow(
      AppError
    );
    await expect(LupaPasswordService("test@example.com")).rejects.toThrow(
      "Permintaan OTP terlalu sering"
    );
  });

  it("harus melempar error jika email tidak berhasil dikirim", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const fakeUser = {
      email: "test@example.com",
      name: "Test User",
      otp_requested_at: null,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(fakeUser);
    __mock__.sendMail.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(LupaPasswordService("test@example.com")).rejects.toThrow(
      "Gagal mengirim OTP"
    );

    expect(fakeUser.save).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("berhasil mengirim OTP dan mengembalikan pesan berhasil", async () => {
    const fakeUser = {
      email: "test@example.com",
      name: "Test User",
      otp_requested_at: new Date(0),
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(fakeUser);

    __mock__.sendMail.mockResolvedValue(true);

    const result = await LupaPasswordService("test@example.com");

    expect(result).toEqual({
      success: true,
      status: 200,
      message: "Kode OTP telah dikirim ke email",
    });

    expect(fakeUser.otp).toMatch(/^\d{6}$/);
    expect(fakeUser.expired_otp).toBeInstanceOf(Date);
    expect(fakeUser.otp_attempt).toBe(0);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(__mock__.createTransport).toHaveBeenCalled();
    expect(__mock__.sendMail).toHaveBeenCalled();
  });
});
