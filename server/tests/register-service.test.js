import { jest } from "@jest/globals";

const saveMock = jest.fn();

jest.unstable_mockModule("../models/user-model.js", () => {
  const User = jest.fn().mockImplementation(() => ({
    _id: "userId123",
    name: "User",
    email: "test@example.com",
    password: "hashedPassword",
    save: saveMock,
  }));

  User.findOne = jest.fn();

  return {
    default: User,
  };
});

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
  },
}));

const AppError = (await import("../utils/app-error.js")).default;
const { registerService } = await import(
  "../services/auth/register-service.js"
);
const User = (await import("../models/user-model.js")).default;
const bcrypt = (await import("bcrypt")).default;

describe("registerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test untuk validasi field kosong individual
  describe("Validasi Field Kosong", () => {
    it("harus melempar error jika name kosong", async () => {
      await expect(
        registerService("", "test@example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("", "test@example.com", "Password123!")
      ).rejects.toThrow("Validasi gagal, Nama wajib diisi");
    });

    it("harus melempar error jika name hanya berisi whitespace", async () => {
      await expect(
        registerService("   ", "test@example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("   ", "test@example.com", "Password123!")
      ).rejects.toThrow("Validasi gagal, Nama wajib diisi");
    });

    it("harus melempar error jika email kosong", async () => {
      await expect(registerService("User", "", "Password123!")).rejects.toThrow(
        AppError
      );
      await expect(registerService("User", "", "Password123!")).rejects.toThrow(
        "Validasi gagal, Email wajib diisi"
      );
    });

    it("harus melempar error jika email hanya berisi whitespace", async () => {
      await expect(
        registerService("User", "   ", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "   ", "Password123!")
      ).rejects.toThrow("Validasi gagal, Email wajib diisi");
    });

    it("harus melempar error jika password kosong", async () => {
      await expect(
        registerService("User", "test@example.com", "")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "")
      ).rejects.toThrow("Validasi gagal, Password wajib diisi");
    });

    it("harus melempar error jika password hanya berisi whitespace", async () => {
      await expect(
        registerService("User", "test@example.com", "   ")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "   ")
      ).rejects.toThrow("Validasi gagal, Password wajib diisi");
    });

    it("harus melempar error jika semua field kosong", async () => {
      await expect(registerService("", "", "")).rejects.toThrow(AppError);
      await expect(registerService("", "", "")).rejects.toThrow(
        "Validasi gagal, Nama wajib diisi, Email wajib diisi, Password wajib diisi"
      );
    });

    it("harus melempar error jika name dan email kosong", async () => {
      await expect(registerService("", "", "Password123!")).rejects.toThrow(
        AppError
      );
      await expect(registerService("", "", "Password123!")).rejects.toThrow(
        "Validasi gagal, Nama wajib diisi, Email wajib diisi"
      );
    });

    it("harus melempar error jika name dan password kosong", async () => {
      await expect(registerService("", "test@example.com", "")).rejects.toThrow(
        AppError
      );
      await expect(registerService("", "test@example.com", "")).rejects.toThrow(
        "Validasi gagal, Nama wajib diisi, Password wajib diisi"
      );
    });

    it("harus melempar error jika email dan password kosong", async () => {
      await expect(registerService("User", "", "")).rejects.toThrow(AppError);
      await expect(registerService("User", "", "")).rejects.toThrow(
        "Validasi gagal, Email wajib diisi, Password wajib diisi"
      );
    });
  });

  // Test untuk validasi format email
  describe("Validasi Format Email", () => {
    it("harus melempar error jika email tidak mengandung @", async () => {
      await expect(
        registerService("User", "testemail.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "testemail.com", "Password123!")
      ).rejects.toThrow("Format email tidak valid");
    });

    it("harus melempar error jika email mengandung @ ganda", async () => {
      await expect(
        registerService("User", "test@@example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@@example.com", "Password123!")
      ).rejects.toThrow("Format email tidak valid");
    });

    it("harus melempar error jika email tidak mengandung domain", async () => {
      await expect(
        registerService("User", "test@", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@", "Password123!")
      ).rejects.toThrow("Format email tidak valid");
    });

    it("harus melempar error jika email tidak mengandung titik pada domain", async () => {
      await expect(
        registerService("User", "test@example", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example", "Password123!")
      ).rejects.toThrow("Format email tidak valid");
    });

    it("harus melempar error jika email mengandung spasi", async () => {
      await expect(
        registerService("User", "test @example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test @example.com", "Password123!")
      ).rejects.toThrow("Format email tidak valid");
    });
  });

  // Test untuk validasi password
  describe("Validasi Password", () => {
    it("harus melempar error jika password tidak mengandung huruf", async () => {
      await expect(
        registerService("User", "test@example.com", "123456!@#")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "123456!@#")
      ).rejects.toThrow("Password harus mengandung huruf, angka dan simbol");
    });

    it("harus melempar error jika password tidak mengandung angka", async () => {
      await expect(
        registerService("User", "test@example.com", "Password!@#")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "Password!@#")
      ).rejects.toThrow("Password harus mengandung huruf, angka dan simbol");
    });

    it("harus melempar error jika password tidak mengandung simbol", async () => {
      await expect(
        registerService("User", "test@example.com", "Password123")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "Password123")
      ).rejects.toThrow("Password harus mengandung huruf, angka dan simbol");
    });

    it("harus melempar error jika password kurang dari 8 karakter", async () => {
      await expect(
        registerService("User", "test@example.com", "Pass1!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "Pass1!")
      ).rejects.toThrow("Password harus mengandung huruf, angka dan simbol");
    });

    it("harus menerima password yang mengandung huruf besar dan kecil", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const result = await registerService(
        "User",
        "test@example.com",
        "Password123!"
      );

      expect(result.success).toBe(true);
    });
  });

  // Test untuk validasi email sudah digunakan
  describe("Validasi Email Sudah Digunakan", () => {
    it("harus melempar error jika email sudah digunakan", async () => {
      User.findOne.mockResolvedValue({ _id: "123", email: "test@example.com" });

      await expect(
        registerService("User", "test@example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "Password123!")
      ).rejects.toThrow("Email sudah digunakan");
    });

    it("harus melempar error jika email sudah digunakan (case insensitive)", async () => {
      User.findOne.mockResolvedValue({ _id: "123", email: "TEST@EXAMPLE.COM" });

      await expect(
        registerService("User", "test@example.com", "Password123!")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("User", "test@example.com", "Password123!")
      ).rejects.toThrow("Email sudah digunakan");
    });

    it("harus memanggil User.findOne dengan email lowercase", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      await registerService("User", "TEST@EXAMPLE.COM", "Password123!");

      expect(User.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });

  // Test untuk kombinasi error
  describe("Kombinasi Error", () => {
    it("harus menampilkan semua error validasi sekaligus", async () => {
      await expect(
        registerService("", "invalid-email", "weak")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("", "invalid-email", "weak")
      ).rejects.toThrow(
        "Validasi gagal, Nama wajib diisi, Password harus mengandung huruf, angka dan simbol, Format email tidak valid"
      );
    });

    it("harus menampilkan error email sudah digunakan bersama error lainnya", async () => {
      User.findOne.mockResolvedValue({ _id: "123", email: "test@example.com" });

      await expect(
        registerService("", "test@example.com", "weak")
      ).rejects.toThrow(AppError);
      await expect(
        registerService("", "test@example.com", "weak")
      ).rejects.toThrow(
        "Validasi gagal, Nama wajib diisi, Password harus mengandung huruf, angka dan simbol, Email sudah digunakan"
      );
    });
  });

  // Test untuk registrasi sukses
  describe("Registrasi Sukses", () => {
    it("berhasil register dan mengembalikan data user", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const result = await registerService(
        "User",
        "test@example.com",
        "Password123!"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      expect(saveMock).toHaveBeenCalled();
      expect(User).toHaveBeenCalledWith({
        name: "User",
        email: "test@example.com",
        password: "hashedPassword",
      });

      expect(result).toEqual({
        success: true,
        status: 201,
        message: "Registrasi berhasil",
        user: {
          id: "userId123",
          name: "User",
          email: "test@example.com",
        },
      });
    });

    it("harus trim whitespace dari input dan convert email ke lowercase", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      await registerService("  User  ", " TEST@EXAMPLE.COM ", "Password123!");

      expect(User.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(User).toHaveBeenCalledWith({
        name: "User",
        email: "test@example.com",
        password: "hashedPassword",
      });
    });

    it("harus menerima berbagai karakter simbol dalam password", async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const passwords = [
        "Password123!",
        "Password123@",
        "Password123#",
        "Password123$",
        "Password123%",
        "Password123^",
        "Password123&",
        "Password123*",
        "Password123(",
        "Password123)",
        "Password123_",
        "Password123+",
        "Password123-",
        "Password123=",
        "Password123[",
        "Password123]",
        "Password123{",
        "Password123}",
        "Password123;",
        "Password123'",
        "Password123:",
        'Password123"',
        "Password123\\",
        "Password123|",
        "Password123,",
        "Password123.",
        "Password123<",
        "Password123>",
        "Password123/",
        "Password123?",
        "Password123`",
        "Password123~",
      ];

      for (const password of passwords) {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue("hashedPassword");

        const result = await registerService(
          "User",
          "test@example.com",
          password
        );
        expect(result.success).toBe(true);
      }
    });
  });
});
