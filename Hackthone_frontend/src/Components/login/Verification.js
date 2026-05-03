import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  requestPasswordReset,
  resetPassword,
} from "../../services/authApi";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function Verification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = useMemo(
    () => (searchParams.get("token") || "").trim(),
    [searchParams],
  );
  const isResetMode = Boolean(resetToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleForgotPassword(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestPasswordReset(email);

      if (response?.resetToken) {
        navigate(`/verification?token=${encodeURIComponent(response.resetToken)}`, {
          replace: true,
        });
        return;
      }

      setSuccessMessage(
        response?.message ||
          "If an account exists, a password reset link has been sent.",
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to start password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!password) {
      setError("New password is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPassword({
        token: resetToken,
        password,
      });

      setSuccessMessage(
        response?.message || "Password reset successful. Redirecting to login...",
      );

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (requestError) {
      setError(requestError.message || "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="liquid-glass-card rounded-3xl w-full max-w-6xl flex overflow-hidden">
        <div className="flex-1 p-12 md:p-24 flex flex-col justify-center">
          <form
            className="w-full max-w-sm mx-auto"
            onSubmit={isResetMode ? handleResetPassword : handleForgotPassword}
          >
            <h2 className="text-3xl font-bold mb-2 text-white">
              {isResetMode ? "Set a new password" : "Forgot your password?"}
            </h2>
            <p className="text-slate-300 mb-8">
              {isResetMode
                ? "Choose a new password for your account."
                : "Enter your email address and we'll generate a reset link for you."}
            </p>

            {!isResetMode ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="liquid-glass-input rounded-md p-4 w-full text-white focus:outline-none transition-all"
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter a strong password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="liquid-glass-input rounded-md p-4 w-full text-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="liquid-glass-input rounded-md p-4 w-full text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {error ? (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {successMessage ? (
              <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="liquid-glass-button text-white font-bold py-3 rounded-md w-full transition duration-150 flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting
                ? isResetMode
                  ? "Saving..."
                  : "Generating..."
                : isResetMode
                  ? "Save New Password"
                  : "Generate Reset Link"}
            </button>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-slate-200 hover:text-white">
                Back to login
              </Link>
            </div>
          </form>
        </div>

        <div className="hidden lg:flex flex-1 bg-linear-to-br from-slate-950/70 via-blue-950/55 to-cyan-950/40 p-16 md:p-24 text-white relative flex flex-col justify-end">
          <div className="absolute inset-x-0 top-0 h-64 border-b border-indigo-500 bg-black bg-opacity-10 m-12 rounded-lg p-6 opacity-30">
            <div className="w-16 h-16 bg-white rounded-full mx-auto -mt-10 opacity-70"></div>
          </div>

          <div className="z-10">
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              {isResetMode ? "Finish securing your account" : "Recover access quickly"}
            </h1>
            <p className="text-indigo-100 mb-10 text-lg">
              {isResetMode
                ? "Update your password and return to your interview dashboard."
                : "We'll generate a secure, time-limited reset link so you can sign in again."}
            </p>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full"></div>
              <div className="w-8 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
