import React, { useState, useCallback, useMemo, type FormEvent } from "react";
import {
  useAuth,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from "../lib/auth";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as React.CSSProperties["flexDirection"],
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
  } as React.CSSProperties,
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
    textAlign: "center" as React.CSSProperties["textAlign"],
    marginBottom: "2rem",
  } as React.CSSProperties,
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
    flexDirection: "column" as React.CSSProperties["flexDirection"],
    gap: "1.25rem",
  } as React.CSSProperties,
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as React.CSSProperties["flexDirection"],
    gap: "0.5rem",
  } as React.CSSProperties,
  label: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: "0.025em",
  },
  labelOptional: {
    fontSize: "0.7rem",
    fontWeight: 400,
    color: "rgba(255, 255, 255, 0.4)",
    marginLeft: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "1rem",
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  } as React.CSSProperties,
  inputFocus: {
    borderColor: "#FFB6C1",
    background: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 0 0 3px rgba(255, 182, 193, 0.15)",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorMessage: {
    padding: "1rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "12px",
    color: "#fca5a5",
    fontSize: "0.875rem",
    textAlign: "center" as React.CSSProperties["textAlign"],
  } as React.CSSProperties,
  fieldError: {
    color: "#fca5a5",
    fontSize: "0.75rem",
  },
  button: {
    width: "100%",
    padding: "1rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#0a0a0a",
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

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({
  password,
}) => {
  const { score, label } = getPasswordStrength(password);
  const colors: Record<number, string> = {
    0: "rgba(239, 68, 68, 0.8)",
    1: "rgba(245, 158, 11, 0.8)",
    2: "rgba(234, 179, 8, 0.8)",
    3: "rgba(34, 197, 94, 0.8)",
    4: "rgba(16, 185, 129, 0.8)",
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

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
  requireTerms?: boolean;
  termsUrl?: string;
  privacyUrl?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className,
  requireTerms = true,
  termsUrl = "/terms",
  privacyUrl = "/privacy",
}) => {
  const { signup, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(!requireTerms);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const emailError =
    touched.email && !isValidEmail(email)
      ? "Please enter a valid email address"
      : null;
  const passwordValidation = isValidPassword(password);
  const passwordError =
    touched.password && !passwordValidation.valid
      ? passwordValidation.message
      : null;
  const confirmError =
    touched.confirmPassword && password !== confirmPassword
      ? "Passwords do not match"
      : null;
  const termsError =
    touched.terms && requireTerms && !acceptedTerms
      ? "You must accept the terms to continue"
      : null;
  const isFormValid = useMemo(
    () =>
      isValidEmail(email) &&
      passwordValidation.valid &&
      password === confirmPassword &&
      (!requireTerms || acceptedTerms),
    [
      email,
      password,
      confirmPassword,
      acceptedTerms,
      requireTerms,
      passwordValidation,
    ]
  );
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched({
        email: true,
        password: true,
        confirmPassword: true,
        terms: true,
      });
      if (!isFormValid || isSubmitting) return;
      setIsSubmitting(true);
      clearError();
      try {
        await signup(email, password, displayName || undefined);
        onSuccess?.();
      } catch {
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
  const getInputStyle = (field: string, hasError: boolean) => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
    ...(hasError ? styles.inputError : {}),
  });
  const buttonStyle = {
    ...styles.button,
    ...(isHovered && !isSubmitting && isFormValid ? styles.buttonHover : {}),
    ...(isSubmitting || !isFormValid ? styles.buttonDisabled : {}),
  };
  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={styles.container} className={className}>
        <div style={styles.card}>
          <header style={styles.header}>
            <p style={styles.brand}>Babes Club</p>
            <h1 style={styles.title}>Create your account</h1>
            <p style={styles.subtitle}>
              Join the club to access exclusive drops, NFTs, and member perks
            </p>
          </header>
          {error && (
            <div style={styles.errorMessage} role="alert">
              {error.message}
            </div>
          )}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label htmlFor="signup-name" style={styles.label}>
                Display name
                <span style={styles.labelOptional}>(optional)</span>
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onFocus={() => setFocusedField("displayName")}
                onBlur={() => handleBlur("displayName")}
                placeholder="How should we call you?"
                autoComplete="name"
                disabled={isSubmitting}
                style={getInputStyle("displayName", false)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label htmlFor="signup-email" style={styles.label}>
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                style={getInputStyle("email", !!emailError)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <span id="email-error" style={styles.fieldError}>
                  {emailError}
                </span>
              )}
            </div>
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={isSubmitting}
                style={getInputStyle("password", !!passwordError)}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              {passwordError ? (
                <span id="password-error" style={styles.fieldError}>
                  {passwordError}
                </span>
              ) : (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>
            <div style={styles.fieldGroup}>
              <label htmlFor="signup-confirm" style={styles.label}>
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => handleBlur("confirmPassword")}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isSubmitting}
                style={getInputStyle("confirmPassword", !!confirmError)}
                aria-invalid={!!confirmError}
                aria-describedby={confirmError ? "confirm-error" : undefined}
              />
              {confirmError && (
                <span id="confirm-error" style={styles.fieldError}>
                  {confirmError}
                </span>
              )}
            </div>
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
