import userModel from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";
import crypto from "crypto";

export const verifOtpService = async (email, otp) => {
  try {
    const normalizedEmail = email.toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

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
      message: "OTP valid",
      resetToken: token,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Verif OTP Service Error: " + error.message);
  }
};
