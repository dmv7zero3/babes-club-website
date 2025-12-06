/**
 * Login Form Component for The Babes Club
 *
 * A polished, branded login interface with form validation,
 * password visibility toggle, loading states, and error handling.
 */

import React, {
  useState,
  useCallback,
  type FormEvent,
  type CSSProperties,
} from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth, isValidEmail } from "../lib/auth";

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
    marginBottom: "1rem",
  },
  forgotPassword: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "right",
    marginTop: "-0.5rem",
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
};

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [eyeHovered, setEyeHovered] = useState(false);

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

      // Mark all fields as touched
      setTouched({ email: true, password: true });

      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      clearError();

      try {
        await login(email, password);
        onSuccess?.();
      } catch {
        // Error is handled by context
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, isFormValid, isSubmitting, login, clearError, onSuccess]
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

  const getPasswordInputStyle = (hasError: boolean): CSSProperties => ({
    ...styles.passwordInput,
    ...(focusedField === "password" ? styles.inputFocus : {}),
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
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>Sign in to your account</p>
          </div>

          {/* Error Display */}
          {error && <div style={styles.errorBox}>{error.message}</div>}

          {/* Form */}
          <form style={styles.form} onSubmit={handleSubmit}>
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
              <label htmlFor="login-password" style={styles.label}>
                Password
              </label>
              <div style={styles.passwordInputWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  style={getPasswordInputStyle(!!passwordError)}
                  autoComplete="current-password"
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseEnter={() => setEyeHovered(true)}
                  onMouseLeave={() => setEyeHovered(false)}
                  style={{
                    ...styles.eyeButton,
                    ...(eyeHovered ? styles.eyeButtonHover : {}),
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {passwordError && (
                <span id="password-error" style={styles.fieldError}>
                  {passwordError}
                </span>
              )}
            </div>

            {/* Forgot Password Link */}
            {onForgotPassword && (
              <div style={styles.forgotPassword}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    ...styles.link,
                    background: "none",
                    border: "none",
                    fontSize: "inherit",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

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
                <span>New to Babes Club?</span>
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
    </>
  );
};

export default LoginForm;
