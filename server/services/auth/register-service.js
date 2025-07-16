import bcrypt from "bcrypt";
import User from "../../models/user-model.js";
import AppError from "../../utils/app-error.js";

export const registerService = async (name, email, password) => {
  const errors = [];

  const trimmedName = name ? name.trim() : "";
  const trimmedEmail = email ? email.trim() : "";
  const trimmedPassword = password ? password.trim() : "";

  if (!trimmedName || trimmedName === "") {
    errors.push("Nama wajib diisi");
  }

  if (!trimmedEmail || trimmedEmail === "") {
    errors.push("Email wajib diisi");
  }

  if (!trimmedPassword || trimmedPassword === "") {
    errors.push("Password wajib diisi");
  }

  const strongPasswordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (trimmedPassword && !strongPasswordRegex.test(trimmedPassword)) {
    errors.push("Password harus mengandung huruf, angka dan simbol");
  }

  if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
    errors.push("Format email tidak valid");
  }

  // Cek email sudah digunakan (hanya jika email valid)
  if (trimmedEmail && emailRegex.test(trimmedEmail)) {
    const existingUser = await User.findOne({
      email: trimmedEmail.toLowerCase(),
    });
    if (existingUser) {
      errors.push("Email sudah digunakan");
    }
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validasi gagal, " + errors.join(", "));
  }

  const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

  const newUser = new User({
    name: trimmedName,
    email: trimmedEmail.toLowerCase(),
    password: hashedPassword,
  });

  await newUser.save();

  return {
    success: true,
    status: 201,
    message: "Registrasi berhasil",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  };
};
