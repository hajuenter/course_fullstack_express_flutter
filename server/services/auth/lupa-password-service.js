import User from "../../models/user-model.js";
import nodemailer from "nodemailer";
import AppError from "../../utils/app-error.js";

export const LupaPasswordService = async (email) => {
  if (!email || email.trim() === "") {
    throw new AppError(400, "Email wajib diisi");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(404, "Email tidak ditemukan");
  }

  const now = new Date();
  const lastRequest = user.otp_requested_at || new Date(0);

  const minutesSinceLastRequest = (now - lastRequest) / 1000 / 60;
  if (minutesSinceLastRequest < 10) {
    const wait = Math.ceil(10 - minutesSinceLastRequest);
    throw new AppError(
      429,
      `Permintaan OTP terlalu sering. Silakan tunggu ${wait} menit lagi.`
    );
  }

  const codeOtp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = codeOtp;
  user.expired_otp = new Date(Date.now() + 5 * 60 * 1000);
  user.otp_requested_at = now;
  user.otp_attempt = 0;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Hajuenter Usaha",
    to: user.email,
    subject: "Permintaan Reset Kata Sandi - Kode OTP",
    text: `
      Halo ${user.name},

      Kami menerima permintaan untuk mereset kata sandi akun Anda di Hajuenter Usaha.

      Kode OTP Anda adalah: ${codeOtp}

      Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.

      Jika Anda tidak meminta reset kata sandi, silakan abaikan email ini.

      Salam hormat,  
      Tim Hajuenter Usaha
  `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    throw new AppError(500, "Gagal mengirim OTP. Coba lagi nanti.");
  }

  return {
    success: true,
    status: 200,
    message: "Kode OTP telah dikirim ke email",
  };
};
