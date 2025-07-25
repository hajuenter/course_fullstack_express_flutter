import { registerService } from "../services/auth/register-service.js";
import { loginService } from "../services/auth/login-service.js";
import { forgotPasswordService } from "../services/auth/forgot-password-service.js";
import { verifOtpService } from "../services/auth/verif-otp-service.js";
import { resetPasswordService } from "../services/auth/reset-password-service.js";

export const registerController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerService(name, email, password);

    res.status(201).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Error Register Controller:", error.message);
    next(error);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Error Login Controller:", error.message);
    next(error);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error Forgot Password Controller:", error.message);
    next(error);
  }
};

export const verifOtpController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await verifOtpService(email, otp);

    return res.status(200).json({
      success: true,
      message: result.message,
      resetToken: result.resetToken,
    });
  } catch (error) {
    console.error("Error Verif OTP Controller:", error.message);
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const result = await resetPasswordService(email, resetToken, newPassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error Reset Password Controller:", error.message);
    next(error);
  }
};
