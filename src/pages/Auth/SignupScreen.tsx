import { FormEvent, useState } from "react";
import type { AxiosError } from "axios";
import { signup } from "@/lib/dashboard/api";
import { persistSession } from "@/lib/dashboard/session";

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

const SignupScreen = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setSubmitError("Email and password are required.");
      return;
    }

    try {
      setSubmitError(null);
      setIsSubmitting(true);

      const response = await signup(
        email.trim(),
        password,
        displayName.trim() || undefined
      );
      console.log("[Signup] API response:", response);

      // Use accessToken for token
      let expiresAt = response.expiresAt;
      if (!expiresAt && response.accessToken) {
        try {
          const payload = JSON.parse(atob(response.accessToken.split(".")[1]));
          expiresAt = payload.exp;
        } catch (e) {
          console.warn("[Signup] Failed to parse JWT for expiresAt", e);
        }
      }
      const sessionObj = {
        token: response.accessToken,
        expiresAt,
        user: {
          userId: response.user?.userId ?? email.trim().toLowerCase(),
          email: response.user?.email ?? email.trim(),
          displayName:
            response.user?.displayName ??
            (displayName.trim() || email.trim().split("@")[0]) ??
            "Member",
        },
      };
      console.log("[Signup] Persisting session:", sessionObj);
      persistSession(sessionObj);

      if (onSuccess) {
        console.log("[Signup] Calling onSuccess callback");
        onSuccess();
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950/90 px-4 py-12 text-neutral-100">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-8 shadow-2xl">
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

        {submitError ? (
          <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {submitError}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-neutral-300">
            Display name
            <input
              type="text"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/70 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-cotton-candy focus:outline-none"
              placeholder="Your name"
            />
          </label>

          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-neutral-300">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/70 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-cotton-candy focus:outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-neutral-300">
            Password
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/70 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-cotton-candy focus:outline-none"
              placeholder="Create a strong password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-cotton-candy px-4 py-3 text-sm font-semibold text-neutral-900 shadow-md transition hover:bg-babe-pink/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500">
          By creating an account you agree to our terms. Need help? Contact
          support@thebabesclub.com.
        </p>
      </div>
    </div>
  );
};

export default SignupScreen;
