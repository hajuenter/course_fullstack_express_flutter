import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String },
    expired_otp: { type: Date },
    otp_requested_at: { type: Date },
    otp_attempt: { type: Number, default: 0 },
    reset_token: { type: String },
    reset_token_expired: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

export default User;
