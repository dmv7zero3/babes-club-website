/**
 * Signup Screen for The Babes Club
 *
 * FIXED: Now properly uses useAuth().signup() to update AuthContext state
 * before navigation, preventing the 404 error on first signup.
 *
 * Previous bug: The screen was calling persistSession() from dashboard/session
 * but the ProtectedRoute on /dashboard checks useAuth().isAuthenticated
 * from AuthContext - two different systems that weren't synchronized.
 */

import { FormEvent, useState, useCallback } from "react";
import type { AxiosError } from "axios";
import { useAuth } from "@/lib/auth"; // USE AuthContext instead of direct API call

const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return "Unable to create account. Please try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const maybeAxios = error as AxiosError<{ error?: string; message?: string }>;
  const payload = maybeAxios?.response?.data;

  return (
    payload?.error ||
    payload?.message ||
    "Unable to create account. Please verify your details and try again."
  );
};

interface SignupScreenProps {
  onSuccess?: () => void;
}

const SignupScreen = ({ onSuccess }: SignupScreenProps) => {
  // Use AuthContext - this ensures state is synchronized with ProtectedRoute
  const { signup, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!email || !password) {
        setSubmitError("Email and password are required.");
        return;
      }

      if (isSubmitting || isLoading) return;

      try {
        setSubmitError(null);
        setIsSubmitting(true);
        clearError();

        console.log("[Signup] Starting signup via AuthContext...");

        // FIX: Use AuthContext's signup method
        // This method:
        // 1. Calls the signup API
        // 2. Persists the session to storage
        // 3. Dispatches AUTH_SUCCESS to update React state
        // 4. Sets isAuthenticated = true
        await signup(email.trim(), password, displayName.trim() || undefined);

        console.log("[Signup] Signup successful, AuthContext state updated");

        // Now onSuccess can safely navigate to /dashboard
        // because useAuth().isAuthenticated will be true
        if (onSuccess) {
          console.log("[Signup] Calling onSuccess callback");
          onSuccess();
        }
      } catch (err) {
        console.error("[Signup] Signup failed:", err);
        setSubmitError(getErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      email,
      password,
      displayName,
      isSubmitting,
      isLoading,
      signup,
      clearError,
      onSuccess,
    ]
  );

  // Display AuthContext error or local error
  const displayError = submitError || error?.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-neutral-950/90 text-neutral-100">
      <div className="w-full max-w-md p-8 space-y-8 border shadow-2xl rounded-3xl border-white/10 bg-neutral-900/70">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cotton-candy">
            Babes Club
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-sm text-neutral-400">
            Create an account to access orders, NFTs, and membership perks.
          </p>
        </header>

        {displayError && (
          <div
            className="p-4 text-sm border rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-300"
            role="alert"
          >
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <label
              htmlFor="signup-name"
              className="text-sm font-medium text-neutral-300"
            >
              Display name <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              disabled={isSubmitting || isLoading}
              className="w-full px-4 py-3 text-white transition-all border rounded-xl border-white/10 bg-white/5 placeholder:text-neutral-500 focus:border-cotton-candy/50 focus:outline-none focus:ring-2 focus:ring-cotton-candy/20 disabled:opacity-50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="signup-email"
              className="text-sm font-medium text-neutral-300"
            >
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting || isLoading}
              required
              className="w-full px-4 py-3 text-white transition-all border rounded-xl border-white/10 bg-white/5 placeholder:text-neutral-500 focus:border-cotton-candy/50 focus:outline-none focus:ring-2 focus:ring-cotton-candy/20 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="signup-password"
              className="text-sm font-medium text-neutral-300"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              autoComplete="new-password"
              disabled={isSubmitting || isLoading}
              required
              className="w-full px-4 py-3 text-white transition-all border rounded-xl border-white/10 bg-white/5 placeholder:text-neutral-500 focus:border-cotton-candy/50 focus:outline-none focus:ring-2 focus:ring-cotton-candy/20 disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading || !email || !password}
            className="w-full rounded-xl bg-gradient-to-r from-cotton-candy to-babe-pink py-3.5 font-semibold text-neutral-900 shadow-lg shadow-cotton-candy/20 transition-all hover:shadow-xl hover:shadow-cotton-candy/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {isSubmitting || isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin border-neutral-900 border-t-transparent" />
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="pt-4 text-center">
          <p className="text-sm text-neutral-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium transition-colors text-cotton-candy hover:text-babe-pink"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
