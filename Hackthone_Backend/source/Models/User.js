const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 20,
    },

    lastName: {
      type: String,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      immutable: true,
      unique: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preferences: {
      defaultRoleFilter: {
        type: String,
        trim: true,
        default: "All Roles",
      },
      preferredInterviewMode: {
        type: String,
        enum: ["text", "hybrid", "voice"],
        default: "hybrid",
      },
      emailReminders: {
        type: Boolean,
        default: true,
      },
      weeklyDigest: {
        type: Boolean,
        default: true,
      },
      productTips: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchema);
module.exports = User;
