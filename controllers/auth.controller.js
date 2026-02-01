import User from "../model/User.js";
import { generateToken } from "../utils/jwt.js";
import { generateOTP, hashOTP } from "../utils/otp.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * @route POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    await User.create({ name, email, password });

    return res.status(201).json({
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("SIGNUP ERROR 👉", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      data: {
        token: generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Prevent email enumeration
    if (!user) {
      return res.json({
        message: "OTP sent if email ",
      });
    }

    const otp = generateOTP();

    user.passwordResetOTP = hashOTP(otp);
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendEmail(email, "Password Reset OTP", `Your OTP is: ${otp}`).catch(
      console.error,
    );

    return res.json({
      message: "OTP sent if email ",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/**
 * @route POST /api/auth/verify-reset-otp
 */
export const verifyResetOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findOne({
      passwordResetOTP: hashOTP(String(otp)),
      passwordResetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.passwordResetOTPVerified = true;
    await user.save();

    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("VERIFY OTP ERROR 👉", err);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

/**
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({
      passwordResetOTPVerified: true,
      passwordResetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "OTP verification required",
      });
    }

    // ✅ Reset password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetOTPVerified = undefined;
    user.tokenVersion += 1;

    await user.save();

    return res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR 👉", err);
    return res.status(500).json({
      message: "Password reset failed",
    });
  }
};
