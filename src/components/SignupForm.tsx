/**
 * Signup Form Component for The Babes Club
 *
 * A polished, branded registration interface with form validation,
 * password strength indicator, loading states, and error handling.
 */

import React, { useState, useCallback, useMemo, type FormEvent } from "react";
import {
  useAuth,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from "../lib/auth";
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
    padding: "3rem 1rem",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
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
    fontSize: "1.875rem",
    fontWeight: 600,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.025em",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: "0.75rem",
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
  strengthContainer: {
    marginTop: "0.5rem",
  },
  strengthBar: {
    display: "flex",
    gap: "4px",
    marginBottom: "0.25rem",
  },
  strengthSegment: {
    flex: 1,
    height: "4px",
    borderRadius: "2px",
    background: "rgba(255, 255, 255, 0.1)",
    transition: "background 0.2s ease",
  },
  strengthLabel: {
    fontSize: "0.7rem",
    textTransform: "capitalize" as const,
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginTop: "2px",
    accentColor: "#FFB6C1",
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.5,
  },
};

// ============================================================================
// Password Strength Indicator
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({
  password,
}) => {
  const { score, label } = getPasswordStrength(password);

  const colors: Record<number, string> = {
    0: "rgba(239, 68, 68, 0.8)", // Red
    1: "rgba(245, 158, 11, 0.8)", // Orange
    2: "rgba(234, 179, 8, 0.8)", // Yellow
    3: "rgba(34, 197, 94, 0.8)", // Green
    4: "rgba(16, 185, 129, 0.8)", // Emerald
  };

  const labelColors: Record<number, string> = {
    0: "#fca5a5",
    1: "#fcd34d",
    2: "#fde047",
    3: "#86efac",
    4: "#6ee7b7",
  };

  if (!password) return null;

  return (
    <div style={styles.strengthContainer}>
      <div style={styles.strengthBar}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            style={{
              ...styles.strengthSegment,
              background: index <= score ? colors[score] : undefined,
            }}
          />
        ))}
      </div>
      <span style={{ ...styles.strengthLabel, color: labelColors[score] }}>
        {label}
      </span>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

interface SignupFormProps {
  /** Callback when signup is successful */
  onSuccess?: () => void;
  /** Callback to switch to login view */
  onSwitchToLogin?: () => void;
  /** Custom class name */
  className?: string;
  /** Whether to show terms checkbox */
  requireTerms?: boolean;
  /** Terms and conditions URL */
  termsUrl?: string;
  /** Privacy policy URL */
  privacyUrl?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className,
  requireTerms = false,
  termsUrl = "/terms-of-service",
  privacyUrl = "/privacy-policy",
}) => {
  // Auth context
  const { signup, isLoading, error, clearError } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState<{
    email: boolean;
    displayName: boolean;
    password: boolean;
    confirm: boolean;
    terms: boolean;
  }>({
    email: false,
    displayName: false,
    password: false,
    confirm: false,
    terms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Validation
  const emailError =
    touched.email && !isValidEmail(email)
      ? "Please enter a valid email address"
      : null;
  const displayNameError =
    touched.displayName && displayName.length < 2
      ? "Name must be at least 2 characters"
      : null;
  const passwordError =
    touched.password && !isValidPassword(password)
      ? "Password must be at least 8 characters with uppercase, lowercase, and number"
      : null;
  const confirmError =
    touched.confirm && password !== confirmPassword
      ? "Passwords do not match"
      : null;
  const termsError =
    requireTerms && touched.terms && !acceptedTerms
      ? "You must accept the terms and conditions"
      : null;

  const isFormValid =
    isValidEmail(email) &&
    displayName.length >= 2 &&
    isValidPassword(password) &&
    password === confirmPassword &&
    (!requireTerms || acceptedTerms);

  // Handlers
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      clearError();

      try {
        await signup(email, password, displayName);
        onSuccess?.();
      } catch {
        // Error is handled by auth context
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      email,
      password,
      displayName,
      isFormValid,
      isSubmitting,
      signup,
      clearError,
      onSuccess,
    ]
  );

  const handleBlur = (
    field: "email" | "displayName" | "password" | "confirm" | "terms"
  ) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFocusedField(null);
  };

  // Dynamic styles
  const getInputStyle = (field: string, hasError: boolean) => ({
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
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join our community</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.alert} role="alert">
            {error.message || "An error occurred. Please try again."}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Display Name Field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="signup-name" style={styles.label}>
              Display Name
            </label>
            <input
              id="signup-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onFocus={() => setFocusedField("displayName")}
              onBlur={() => handleBlur("displayName")}
              placeholder="Your name"
              disabled={isSubmitting}
              style={getInputStyle("displayName", !!displayNameError)}
              autoComplete="name"
              aria-describedby={displayNameError ? "name-error" : undefined}
              aria-invalid={!!displayNameError}
            />
            {displayNameError && (
              <span id="name-error" style={styles.fieldError}>
                {displayNameError}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="signup-email" style={styles.label}>
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" style={styles.label}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => handleBlur("password")}
              placeholder="••••••••"
              disabled={isSubmitting}
              style={getInputStyle("password", !!passwordError)}
              autoComplete="new-password"
              aria-describedby={passwordError ? "password-error" : undefined}
              aria-invalid={!!passwordError}
            />
            <PasswordStrengthIndicator password={password} />
            {passwordError && (
              <span id="password-error" style={styles.fieldError}>
                {passwordError}
              </span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="signup-confirm" style={styles.label}>
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => handleBlur("confirm")}
              placeholder="••••••••"
              disabled={isSubmitting}
              style={getInputStyle("confirm", !!confirmError)}
              autoComplete="new-password"
              aria-describedby={confirmError ? "confirm-error" : undefined}
              aria-invalid={!!confirmError}
            />
            {confirmError && (
              <span id="confirm-error" style={styles.fieldError}>
                {confirmError}
              </span>
            )}
          </div>

          {/* Terms Checkbox */}
          {requireTerms && (
            <div style={styles.checkboxContainer}>
              <input
                id="signup-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                onBlur={() => handleBlur("terms")}
                disabled={isSubmitting}
                style={styles.checkbox}
              />
              <label htmlFor="signup-terms" style={styles.checkboxLabel}>
                I agree to the{" "}
                <a
                  href={termsUrl}
                  style={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href={privacyUrl}
                  style={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          )}
          {termsError && <span style={styles.fieldError}>{termsError}</span>}

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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Footer */}
        {onSwitchToLogin && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span>Already a member?</span>
              <span style={styles.dividerLine} />
            </div>
            <p style={styles.footer}>
              <button
                type="button"
                onClick={onSwitchToLogin}
                style={{
                  ...styles.link,
                  background: "none",
                  border: "none",
                  fontSize: "inherit",
                }}
              >
                Sign in instead
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupForm;
