"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request");
        return;
      }

      setSuccess(true);
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
              <span className="text-lg font-bold text-black">G</span>
            </div>
            <span className="text-xl font-bold text-[#f0f0f5]">SSV Shop</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-[#f0f0f5]">
            Forgot Password
          </h1>
          <p className="mt-1 text-sm text-[#9090a0]">
            Enter your email address and we&apos;ll send you a link to reset your
            password.
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
              If an account exists with this email, you will receive a password
              reset link shortly.
            </div>

            {resetLink && (
              <div className="rounded-lg border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <p className="mb-2 text-xs font-medium text-[#9090a0]">
                  Demo Reset Link:
                </p>
                <a
                  href={resetLink}
                  className="break-all text-sm text-[#3b82f6] hover:text-[#2563eb]"
                >
                  {resetLink}
                </a>
              </div>
            )}

            <Link
              href="/login"
              className="btn btn-primary btn-lg flex w-full items-center justify-center gap-2"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[#9090a0]"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input pl-10"
                  autoComplete="email"
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
                  Sending reset link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
