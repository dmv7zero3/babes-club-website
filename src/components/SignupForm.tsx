/**
 * Signup Form Component for The Babes Club
 *
 * A polished, branded registration interface with form validation,
 * password strength indicator, password visibility toggle, loading states,
 * and error handling.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  type FormEvent,
  type CSSProperties,
} from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  useAuth,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from "../lib/auth";

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
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
    textAlign: "center",
    marginBottom: "2rem",
  },
  brand: {
    fontSize: "0.7rem",
    letterSpacing: "0.35em",
    textTransform: "uppercase",
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
    flexDirection: "column",
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: "0.025em",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "0.95rem",
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  inputFocus: {
    borderColor: "rgba(255, 182, 193, 0.5)",
    background: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 0 0 3px rgba(255, 182, 193, 0.1)",
  },
  inputError: {
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  passwordInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "0.875rem 3rem 0.875rem 1rem",
    fontSize: "0.95rem",
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  eyeButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: "0.375rem",
    cursor: "pointer",
    color: "rgba(255, 255, 255, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    transition: "color 0.2s ease, background 0.2s ease",
  },
  eyeButtonHover: {
    color: "rgba(255, 255, 255, 0.8)",
    background: "rgba(255, 255, 255, 0.1)",
  },
  fieldError: {
    fontSize: "0.75rem",
    color: "#fca5a5",
    marginTop: "0.25rem",
  },
  errorBox: {
    padding: "1rem",
    borderRadius: "12px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    fontSize: "0.875rem",
    textAlign: "center",
  },
  button: {
    width: "100%",
    padding: "1rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#0a0a0a",
    background: "linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
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
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)",
  },
  footer: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.5)",
  },
  link: {
    color: "#FFB6C1",
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  spinner: {
    display: "inline-block",
    width: "18px",
    height: "18px",
    border: "2px solid transparent",
    borderTopColor: "currentColor",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginRight: "0.5rem",
    verticalAlign: "middle",
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
    textTransform: "capitalize",
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

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [eyeHovered, setEyeHovered] = useState<string | null>(null);

  // Validation
  const emailError =
    touched.email && !isValidEmail(email)
      ? "Please enter a valid email address"
      : null;
  const displayNameError =
    touched.displayName && displayName.length < 2
      ? "Name must be at least 2 characters"
      : null;

  const passwordValidation = isValidPassword(password);
  const passwordError =
    touched.password && !passwordValidation.valid
      ? passwordValidation.message
      : null;

  const confirmError =
    touched.confirm && password !== confirmPassword
      ? "Passwords do not match"
      : null;
  const termsError =
    requireTerms && touched.terms && !acceptedTerms
      ? "You must accept the terms and conditions"
      : null;

  const isFormValid = useMemo(
    () =>
      isValidEmail(email) &&
      displayName.length >= 2 &&
      passwordValidation.valid &&
      password === confirmPassword &&
      (!requireTerms || acceptedTerms),
    [
      email,
      displayName,
      password,
      confirmPassword,
      acceptedTerms,
      requireTerms,
      passwordValidation,
    ]
  );

  // Handlers
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        email: true,
        displayName: true,
        password: true,
        confirm: true,
        terms: true,
      });

      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      clearError();

      try {
        await signup(email, password, displayName);
        onSuccess?.();
      } catch {
        // Error is handled by context
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

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFocusedField(null);
  };

  const getInputStyle = (field: string, hasError: boolean): CSSProperties => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
    ...(hasError ? styles.inputError : {}),
  });

  const getPasswordInputStyle = (
    field: string,
    hasError: boolean
  ): CSSProperties => ({
    ...styles.passwordInput,
    ...(focusedField === field ? styles.inputFocus : {}),
    ...(hasError ? styles.inputError : {}),
  });

  const buttonStyle: CSSProperties = {
    ...styles.button,
    ...(isHovered && !isSubmitting && isFormValid ? styles.buttonHover : {}),
    ...(!isFormValid || isSubmitting ? styles.buttonDisabled : {}),
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={styles.container} className={className}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <p style={styles.brand}>The Babes Club</p>
            <h1 style={styles.title}>Create account</h1>
            <p style={styles.subtitle}>Join our exclusive community</p>
          </div>

          {/* Error Display */}
          {error && <div style={styles.errorBox}>{error.message}</div>}

          {/* Form */}
          <form style={styles.form} onSubmit={handleSubmit}>
            {/* Display Name Field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="signup-name" style={styles.label}>
                Name
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
              <div style={styles.passwordInputWrapper}>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => handleBlur("password")}
                  placeholder="At least 7 characters"
                  disabled={isSubmitting}
                  style={getPasswordInputStyle("password", !!passwordError)}
                  autoComplete="new-password"
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseEnter={() => setEyeHovered("password")}
                  onMouseLeave={() => setEyeHovered(null)}
                  style={{
                    ...styles.eyeButton,
                    ...(eyeHovered === "password" ? styles.eyeButtonHover : {}),
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
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
              <div style={styles.passwordInputWrapper}>
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => handleBlur("confirm")}
                  placeholder="Re-enter your password"
                  disabled={isSubmitting}
                  style={getPasswordInputStyle("confirm", !!confirmError)}
                  autoComplete="new-password"
                  aria-describedby={confirmError ? "confirm-error" : undefined}
                  aria-invalid={!!confirmError}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onMouseEnter={() => setEyeHovered("confirm")}
                  onMouseLeave={() => setEyeHovered(null)}
                  style={{
                    ...styles.eyeButton,
                    ...(eyeHovered === "confirm" ? styles.eyeButtonHover : {}),
                  }}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
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
                  <span style={styles.spinner} />
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
    </>
  );
};

export default SignupForm;
