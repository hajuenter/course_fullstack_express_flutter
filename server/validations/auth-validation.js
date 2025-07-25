import Joi from "joi";

export const registerValidation = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Nama wajib diisi",
    "any.required": "Nama wajib diisi",
    "string.min": "Nama minimal 3 karakter",
    "string.max": "Nama maksimal 100 karakter",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required()
    .messages({
      "string.empty": "Email wajib diisi",
      "any.required": "Email wajib diisi",
      "string.email": "Format email tidak valid",
    }),

  password: Joi.string()
    .trim()
    .min(8)
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$"))
    .required()
    .messages({
      "string.empty": "Password wajib diisi",
      "any.required": "Password wajib diisi",
      "string.min": "Password minimal 8 karakter",
      "string.pattern.base":
        "Password harus mengandung huruf, angka, dan simbol",
    }),
});

export const loginValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required()
    .messages({
      "string.empty": "Email wajib diisi",
      "any.required": "Email wajib diisi",
      "string.email": "Format email tidak valid",
    }),

  password: Joi.string().trim().required().messages({
    "string.empty": "Password wajib diisi",
    "any.required": "Password wajib diisi",
  }),
});

export const forgotPasswordValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required()
    .messages({
      "string.empty": "Email wajib diisi",
      "any.required": "Email wajib diisi",
      "string.email": "Format email tidak valid",
    }),
});

export const verifOtpValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required()
    .messages({
      "string.empty": "Email wajib diisi",
      "any.required": "Email wajib diisi",
      "string.email": "Format email tidak valid",
    }),

  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.empty": "OTP wajib diisi",
      "any.required": "OTP wajib diisi",
      "string.length": "OTP harus terdiri dari 6 karakter",
      "string.pattern.base": "OTP harus berupa angka",
    }),
});

export const resetPasswordValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required()
    .messages({
      "string.empty": "Email wajib diisi",
      "any.required": "Email wajib diisi",
      "string.email": "Format email tidak valid",
    }),

  resetToken: Joi.string().trim().required().messages({
    "string.empty": "Token wajib diisi",
    "any.required": "Token wajib diisi",
  }),

  newPassword: Joi.string()
    .trim()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
    .required()
    .messages({
      "string.empty": "Password baru wajib diisi",
      "any.required": "Password baru wajib diisi",
      "string.min": "Password minimal 8 karakter",
      "string.pattern.base":
        "Password harus mengandung huruf, angka, dan simbol",
    }),
});
