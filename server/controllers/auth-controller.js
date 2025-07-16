import { registerService } from "../services/auth/register-service.js";
import { loginService } from "../services/auth/login-service.js";
import { forgotPasswordService } from "../services/auth/forgot-password-service.js";
import { verifOtpService } from "../services/auth/verif-otp-service.js";
import { resetPasswordService } from "../services/auth/reset-password-service.js";

export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerService(name, email, password);

    res.status(result.status).json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Error Register Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);

    res.status(result.status).json({
      success: result.success,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Error Login Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);

    return res.status(result.status).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Error Lupa Password Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

export const verifOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifOtpService(email, otp);

    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      resetToken: result.resetToken,
    });
  } catch (error) {
    console.error("Error Verif OTP Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const result = await resetPasswordService(email, resetToken, newPassword);

    return res.status(result.status).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Error Reset Password Controller:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};
