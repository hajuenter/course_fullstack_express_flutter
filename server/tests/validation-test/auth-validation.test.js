import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifOtpValidation,
  resetPasswordValidation,
} from "../../validations/auth-validation.js";

describe("Validasi Auth", () => {
  describe("Register Validation", () => {
    it("Harus validasi sukses dengan data yang benar", () => {
      const data = {
        name: "Bahrul Test",
        email: "bahrul@example.com",
        password: "Password123!",
      };

      const { error } = registerValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika nama kosong", () => {
      const { error } = registerValidation.validate({
        email: "a@a.com",
        password: "Password123!",
      });
      expect(error.message).toBe("Nama wajib diisi");
    });

    it("Harus gagal jika nama kurang dari 3 karakter", () => {
      const { error } = registerValidation.validate({
        name: "Ru",
        email: "a@a.com",
        password: "Password123!",
      });
      expect(error.message).toBe("Nama minimal 3 karakter");
    });

    it("Harus gagal jika email tidak valid", () => {
      const { error } = registerValidation.validate({
        name: "Bahrul Test",
        email: "invalid-email",
        password: "Password123!",
      });
      expect(error.message).toBe("Format email tidak valid");
    });

    it("Harus gagal jika password tidak sesuai format", () => {
      const { error } = registerValidation.validate({
        name: "Bahrul Test",
        email: "a@a.com",
        password: "password",
      });
      expect(error.message).toBe(
        "Password harus mengandung huruf, angka, dan simbol"
      );
    });
  });

  describe("Login Validation", () => {
    it("Harus validasi sukses dengan data benar", () => {
      const data = { email: "bahrul@example.com", password: "Password123!" };
      const { error } = loginValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika email kosong", () => {
      const { error } = loginValidation.validate({ password: "Password123!" });
      expect(error.message).toBe("Email wajib diisi");
    });

    it("Harus gagal jika password kosong", () => {
      const { error } = loginValidation.validate({
        email: "bahrul@example.com",
      });
      expect(error.message).toBe("Password wajib diisi");
    });
  });

  describe("Forgot Password Validation", () => {
    it("Harus validasi sukses dengan email benar", () => {
      const { error } = forgotPasswordValidation.validate({
        email: "bahrul@example.com",
      });
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika email kosong", () => {
      const { error } = forgotPasswordValidation.validate({});
      expect(error.message).toBe("Email wajib diisi");
    });
  });

  describe("Verif OTP Validation", () => {
    it("Harus validasi sukses dengan data benar", () => {
      const data = { email: "bahrul@example.com", otp: "123456" };
      const { error } = verifOtpValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika OTP bukan angka", () => {
      const { error } = verifOtpValidation.validate({
        email: "bahrul@example.com",
        otp: "ABC123",
      });
      expect(error.message).toBe("OTP harus berupa angka");
    });

    it("Harus gagal jika OTP tidak 6 karakter", () => {
      const { error } = verifOtpValidation.validate({
        email: "bahrul@example.com",
        otp: "12345",
      });
      expect(error.message).toBe("OTP harus terdiri dari 6 karakter");
    });
  });

  describe("Reset Password Validation", () => {
    it("Harus validasi sukses dengan data benar", () => {
      const data = {
        email: "bahrul@example.com",
        resetToken: "reset123token",
        newPassword: "NewPass123!",
      };
      const { error } = resetPasswordValidation.validate(data);
      expect(error).toBeUndefined();
    });

    it("Harus gagal jika resetToken kosong", () => {
      const { error } = resetPasswordValidation.validate({
        email: "bahrul@example.com",
        newPassword: "NewPass123!",
      });
      expect(error.message).toBe("Token wajib diisi");
    });

    it("Harus gagal jika password baru tidak sesuai format", () => {
      const { error } = resetPasswordValidation.validate({
        email: "bahrul@example.com",
        resetToken: "reset123",
        newPassword: "password",
      });
      expect(error.message).toBe(
        "Password harus mengandung huruf, angka, dan simbol"
      );
    });
  });
});
