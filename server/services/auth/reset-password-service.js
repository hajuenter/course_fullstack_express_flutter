import userModel from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";
import bcrypt from "bcrypt";

export const resetPasswordService = async (email, resetToken, newPassword) => {
  try {
    const normalizedEmail = email.toLowerCase();
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

    if (!user.reset_token || user.reset_token !== resetToken) {
      throw new AppError(401, "Token tidak valid");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    user.reset_token = null;
    user.reset_token_expired = null;
    await user.save();

    return {
      message: "Password berhasil direset",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Reset Password Service Error: " + error.message);
  }
};
