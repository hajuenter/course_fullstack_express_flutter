import userModel from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";
import bcrypt from "bcrypt";

export const resetPasswordService = async (email, resetToken, newPassword) => {
  const errors = [];
  const trimmedEmail = email ? email.trim() : "";
  if (!trimmedEmail || trimmedEmail === "") {
    errors.push("Email wajib diisi");
  }

  if (!resetToken || resetToken.trim() === "") {
    errors.push("Token wajib diisi");
  }

  if (!newPassword || newPassword.trim() === "") {
    errors.push("Password baru wajib diisi");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validasi gagal, " + errors.join(", "));
  }
  const normalizedEmail = trimmedEmail.trim().toLowerCase();
  const user = await userModel.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(404, "User tidak ditemukan");
  }

  if (
    !user.reset_token_expired ||
    new Date(user.reset_token_expired) < new Date()
  ) {
    user.reset_token = null;
    user.reset_token_expired = null;
    await user.save();
    throw new AppError(401, "Token sudah kedaluwarsa");
  }

  // Token tidak valid
  if (!user.reset_token || user.reset_token !== resetToken) {
    throw new AppError(401, "Token tidak valid");
  }

  const strongPasswordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?`~\-]).{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    throw new AppError(
      400,
      "Password minimal 8 karakter dan harus mengandung huruf, angka, serta simbol"
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;

  user.reset_token = null;
  user.reset_token_expired = null;
  await user.save();
  return {
    success: true,
    status: 200,
    message: "Password berhasil direset",
  };
};
