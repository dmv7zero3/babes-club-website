/**
 * Login Form Component for The Babes Club
 *
 * A polished, branded login interface with form validation,
 * loading states, and error handling.
 */

import React, { useState, useCallback, useMemo, type FormEvent } from "react";
import { useAuth, isValidEmail } from "../lib/auth";
import { InlineSpinner } from "./LoadingIcon";

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "2.5rem",
    borderRadius: "24px",
    background: "rgba(26, 26, 26, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "2rem",
  },
  brand: {
    fontSize: "0.7rem",
    letterSpacing: "0.35em",
    textTransform: "uppercase" as const,
    color: "#FFB6C1",
    marginBottom: "0.75rem",
    fontWeight: 500,
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 600,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.025em",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: "0.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: "0.025em",
  },
  input: {
    padding: "0.875rem 1rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.2s ease",
  },
  inputFocus: {
    borderColor: "#FFB6C1",
    boxShadow: "0 0 0 3px rgba(255, 182, 193, 0.15)",
  },
  inputError: {
    borderColor: "#f87171",
    boxShadow: "0 0 0 3px rgba(248, 113, 113, 0.15)",
  },
  fieldError: {
    fontSize: "0.75rem",
    color: "#f87171",
    marginTop: "0.25rem",
  },
  alert: {
    padding: "0.875rem 1rem",
    borderRadius: "12px",
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    color: "#fca5a5",
    fontSize: "0.85rem",
  },
  forgotLink: {
    alignSelf: "flex-end",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "0.5rem",
  },
  buttonHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 10px 25px -5px rgba(255, 182, 193, 0.4)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    margin: "1.5rem 0",
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: "0.8rem",
  } as React.CSSProperties,
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)",
  },
  footer: {
    textAlign: "center" as React.CSSProperties["textAlign"],
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.5)",
  } as React.CSSProperties,
  link: {
    color: "#FFB6C1",
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
};

// ============================================================================
// Component
// ============================================================================

interface LoginFormProps {
  /** Callback when login is successful */
  onSuccess?: () => void;
  /** Callback to switch to signup view */
  onSwitchToSignup?: () => void;
  /** Callback for forgot password */
  onForgotPassword?: () => void;
  /** Custom class name */
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  onForgotPassword,
  className,
}) => {
  // Auth context
  const { login, isLoading, error, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    {
      email: false,
      password: false,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Validation
  const emailError =
    touched.email && !isValidEmail(email)
      ? "Please enter a valid email address"
      : null;
  const passwordError =
    touched.password && password.length < 1 ? "Password is required" : null;
  const isFormValid = isValidEmail(email) && password.length >= 1;

  // Handlers
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      clearError();

      try {
        await login(email, password);
        onSuccess?.();
      } catch {
        // Error is handled by auth context
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, isFormValid, isSubmitting, login, clearError, onSuccess]
  );

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFocusedField(null);
  };

  // Dynamic styles
  const getInputStyle = (field: "email" | "password", hasError: boolean) => ({
    ...styles.input,
    ...(focusedField === field && !hasError ? styles.inputFocus : {}),
    ...(hasError ? styles.inputError : {}),
  });

  const buttonStyle = useMemo(
    () => ({
      ...styles.button,
      ...(isHovered && isFormValid && !isSubmitting ? styles.buttonHover : {}),
      ...(!isFormValid || isSubmitting ? styles.buttonDisabled : {}),
    }),
    [isHovered, isFormValid, isSubmitting]
  );

  return (
    <div style={styles.container} className={className}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.brand}>The Babes Club</p>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.alert} role="alert">
            {error.message || "An error occurred. Please try again."}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email Field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="login-email" style={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => handleBlur("email")}
              placeholder="you@example.com"
              disabled={isSubmitting}
              style={getInputStyle("email", !!emailError)}
              autoComplete="email"
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={!!emailError}
            />
            {emailError && (
              <span id="email-error" style={styles.fieldError}>
                {emailError}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div style={styles.fieldGroup}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label htmlFor="login-password" style={styles.label}>
                Password
              </label>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => handleBlur("password")}
              placeholder="••••••••"
              disabled={isSubmitting}
              style={getInputStyle("password", !!passwordError)}
              autoComplete="current-password"
              aria-describedby={passwordError ? "password-error" : undefined}
              aria-invalid={!!passwordError}
            />
            {passwordError && (
              <span id="password-error" style={styles.fieldError}>
                {passwordError}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={buttonStyle}
          >
            {isSubmitting ? (
              <>
                <InlineSpinner size={18} color="#ffffff" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer */}
        {onSwitchToSignup && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span>New here?</span>
              <span style={styles.dividerLine} />
            </div>
            <p style={styles.footer}>
              <button
                type="button"
                onClick={onSwitchToSignup}
                style={{
                  ...styles.link,
                  background: "none",
                  border: "none",
                  fontSize: "inherit",
                }}
              >
                Create an account
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
