import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "./GoogleAuthButton";
import {
  fetchCurrentUser,
  loginUser,
  storeAuthSession,
  loginWithGoogle,
} from "../../services/authApi";

const initialForm = {
  email: "",
  password: "",
  rememberMe: false,
};

function validateForm(values) {
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(values.email.trim())) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (values.password.length < 6) {
    nextErrors.password = "Password must be at least 6 characters.";
  }

  return nextErrors;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const googleToken = (searchParams.get("googleToken") || "").trim();
    const googleError = (searchParams.get("googleError") || "").trim();

    if (googleError) {
      setServerError(googleError);
      return;
    }

    if (!googleToken) {
      return;
    }

    let isCancelled = false;

    const completeGoogleLogin = async () => {
      try {
        setServerError("");
        setIsSubmitting(true);
        const user = await fetchCurrentUser(googleToken);

        if (isCancelled) {
          return;
        }

        storeAuthSession({
          token: googleToken,
          role: user?.role || "user",
          user,
        });

        navigate("/interviews", {
          replace: true,
          state: { user },
        });
      } catch (error) {
        if (!isCancelled) {
          setServerError(error.message || "Google sign-in failed.");
        }
      } finally {
        if (!isCancelled) {
          setIsSubmitting(false);
        }
      }
    };

    completeGoogleLogin();

    return () => {
      isCancelled = true;
    };
  }, [navigate, searchParams]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    const finalValue = type === "checkbox" ? checked : value;

    setFormData((current) => ({ ...current, [name]: finalValue }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm(formData);
    setErrors(nextErrors);
    setServerError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/interviews", {
        replace: true,
        state: { user: session.user },
      });
    } catch (error) {
      setServerError(error.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 font-sans flex items-center">
      <div className="liquid-glass-card mx-auto w-full max-w-xl rounded-3xl p-8 md:p-10 lg:p-12">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md">
          <h2 className="text-3xl font-bold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to continue your interview journey.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="liquid-glass-input w-full rounded-xl px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300"
              />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="liquid-glass-input w-full rounded-xl px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300"
              />
              {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
            </div>
          </div>

          {serverError ? (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {serverError}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
              />
              Remember me
            </label>
            <Link to="/verification" className="font-medium text-slate-200 hover:text-white">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="liquid-glass-button mt-7 w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-slate-300 after:mt-0.5 after:flex-1 after:border-t after:border-slate-300">
            <p className="mx-4 mb-0 text-center text-sm font-medium text-slate-400">
              OR
            </p>
          </div>

          <GoogleAuthButton
            label="Continue with Google"
            onSuccess={async (credential) => {
              try {
                setIsSubmitting(true);
                setServerError("");
                const session = await loginWithGoogle(credential);
                navigate("/interviews", {
                  replace: true,
                  state: { user: session.user },
                });
              } catch (error) {
                setServerError(error.message || "Google sign-in failed.");
              } finally {
                setIsSubmitting(false);
              }
            }}
            onError={(error) =>
              setServerError(error?.message || "Google sign-in failed.")
            }
          />

          <p className="mt-5 text-center text-sm text-slate-300">
            New here?{" "}
            <Link to="/register" className="font-semibold text-slate-100 hover:text-white">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
