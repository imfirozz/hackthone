const express = require("express");
const authRouter = express.Router();
const userMiddleware = require("../middleware/userMiddlwere");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  register,
  login,
  googleLogin,
  googleRedirectLogin,
  forgotPassword,
  resetPassword,
  adminLogin,
  logout,
  adminRegister,
  getMe,
  updateMe,
} = require("../controllers/userAuth");

// Resister

authRouter.post("/register", register);
// Login
authRouter.post("/login", login);
authRouter.post("/login/google", googleLogin);
authRouter.post("/login/google/redirect", googleRedirectLogin);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/admin/login", adminLogin);
// logOut
authRouter.post("/logout", userMiddleware, logout);

// admin login
authRouter.post("/admin/register", adminMiddleware, adminRegister);

// Get current user profile
authRouter.get("/me", userMiddleware, getMe);
authRouter.put("/me", userMiddleware, updateMe);

// GetProfile
// authRouter.post("GetProfile", GetProfile);

module.exports = authRouter;
