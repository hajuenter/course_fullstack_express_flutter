import AppError from "../utils/app-error.js";

export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Critical Error:", err);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server",
  });
};
