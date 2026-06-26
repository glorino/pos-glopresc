"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (invalidToken) {
    return (
      <div className="login-container">
        <div className="login-card">
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#9090a0] transition-colors hover:text-[#f0f0f5]"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>

          <div className="mb-8 text-center">
            <Link href="/" className="mb-6 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
                <svg viewBox="0 0 64 64" fill="none" className="h-6 w-6">
                  <path d="M16 24 L22 24 L28 40 L48 40 L52 26 L24 26" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="30" cy="46" r="3" fill="#000"/>
                  <circle cx="46" cy="46" r="3" fill="#000"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-[#f0f0f5]">
                SSV Shop
              </span>
            </Link>
            <h1 className="mt-4 text-xl font-semibold text-[#f0f0f5]">
              Invalid Link
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[rgba(244,63,94,0.2)] bg-[rgba(244,63,94,0.1)] px-4 py-3 text-sm text-[#f43f5e]">
            <AlertCircle size={16} />
            This password reset link is invalid or missing a token.
          </div>

          <Link
            href="/forgot-password"
            className="btn btn-primary btn-lg mt-6 flex w-full items-center justify-center gap-2"
          >
            Request a New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <Link
          href="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#9090a0] transition-colors hover:text-[#f0f0f5]"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
              <svg viewBox="0 0 64 64" fill="none" className="h-6 w-6">
                <path d="M16 24 L22 24 L28 40 L48 40 L52 26 L24 26" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="30" cy="46" r="3" fill="#000"/>
                <circle cx="46" cy="46" r="3" fill="#000"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-[#f0f0f5]">SSV Shop</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-[#f0f0f5]">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-[#9090a0]">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-[rgba(244,63,94,0.2)] bg-[rgba(244,63,94,0.1)] px-4 py-3 text-sm text-[#f43f5e]">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] px-4 py-3 text-sm text-[#10b981]">
              <CheckCircle size={16} />
              Your password has been reset successfully. You can now log in with
              your new password.
            </div>

            <Link
              href="/login"
              className="btn btn-primary btn-lg flex w-full items-center justify-center gap-2"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-1.5 block text-sm font-medium text-[#9090a0]"
              >
                New Password
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
                />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="input pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070] hover:text-[#9090a0]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-[#9090a0]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
                />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="input pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="login-container">
          <div className="login-card flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a843]" />
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
