import { RegisterService } from "../services/auth/register-service.js";
import { LoginService } from "../services/auth/login-service.js";
import { ForgotPasswordService } from "../services/auth/forgot-password-service.js";
import { VerifOtpService } from "../services/auth/verif-otp-service.js";
import { ResetPasswordService } from "../services/auth/reset-password-service.js";

export const RegisterController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await RegisterService(name, email, password);

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

export const LoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await LoginService(email, password);

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

export const ForgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await ForgotPasswordService(email);

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

export const VerifOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await VerifOtpService(email, otp);

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

export const ResetPasswordController = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const result = await ResetPasswordService(email, resetToken, newPassword);

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
