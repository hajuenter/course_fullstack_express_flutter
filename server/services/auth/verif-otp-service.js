import User from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";
import crypto from "crypto";

export const VerifOtpService = async (email, otp) => {
  if (!email || email.trim() === "") {
    throw new AppError(400, "Email wajib diisi");
  }

  if (!otp || otp.trim() === "") {
    throw new AppError(400, "OTP wajib diisi");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(404, "User tidak ditemukan");
  }

  const isOtpExpired =
    !user.expired_otp || new Date(user.expired_otp) < new Date();

  if (isOtpExpired) {
    user.otp = null;
    user.expired_otp = null;
    user.otp_attempt = 0;
    await user.save();
    throw new AppError(401, "Kode OTP sudah kadaluarsa");
  }

  if (user.otp !== otp) {
    user.otp_attempt = (user.otp_attempt || 0) + 1;

    if (user.otp_attempt >= 5) {
      user.otp = null;
      user.expired_otp = null;
      user.otp_attempt = 0;
      await user.save();
      throw new AppError(401, "OTP salah 5 kali. OTP telah hangus.");
    }

    await user.save();
    throw new AppError(401, "Kode OTP salah");
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.reset_token = token;
  user.reset_token_expired = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
  user.otp = null;
  user.expired_otp = null;
  user.otp_attempt = 0;
  await user.save();

  return {
    success: true,
    status: 200,
    message: "OTP valid",
    resetToken: token,
  };
};
