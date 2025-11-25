/**
 * Login Form Component for The Babes Club
 * 
 * A polished, branded login interface with form validation,
 * loading states, and error handling.
 */

import React, { useState, useCallback, type FormEvent } from 'react';
import { useAuth, isValidEmail } from '../lib/auth';

// ============================================================================
// Styles (CSS-in-JS for portability)
// ============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem',
    borderRadius: '24px',
    background: 'rgba(26, 26, 26, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  brand: {
    fontSize: '0.7rem',
    letterSpacing: '0.35em',
    textTransform: 'uppercase' as const,
    color: '#FFB6C1', // Cotton candy pink
    marginBottom: '0.75rem',
    fontWeight: 500,
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '0.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: '0.025em',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
  },
  inputFocus: {
    borderColor: '#FFB6C1',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 0 0 3px rgba(255, 182, 193, 0.15)',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorMessage: {
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    color: '#fca5a5',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
  },
  button: {
    width: '100%',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0a0a0a',
    background: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  },
  buttonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 10px 25px -5px rgba(255, 182, 193, 0.4)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '1.5rem 0',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '0.8rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  link: {
    color: '#FFB6C1',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  spinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid transparent',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '0.5rem',
    verticalAlign: 'middle',
  },
};

// Add keyframes for spinner
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Validation
  const emailError = touched.email && !isValidEmail(email) 
    ? 'Please enter a valid email address' 
    : null;
  const passwordError = touched.password && password.length < 1 
    ? 'Password is required' 
    : null;
  const isFormValid = isValidEmail(email) && password.length >= 1;

  // Handlers
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
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
  }, [email, password, isFormValid, isSubmitting, login, clearError, onSuccess]);

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFocusedField(null);
  };

  const getInputStyle = (field: 'email' | 'password', hasError: boolean) => ({
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
          {/* Header */}
          <header style={styles.header}>
            <p style={styles.brand}>Babes Club</p>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>
              Sign in to access your orders, NFTs, and membership perks
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage} role="alert">
              {error.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Email Field */}
            <div style={styles.fieldGroup}>
              <label htmlFor="login-email" style={styles.label}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                style={getInputStyle('email', !!emailError)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <span 
                  id="email-error" 
                  style={{ color: '#fca5a5', fontSize: '0.75rem' }}
                >
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div style={styles.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password" style={styles.label}>
                  Password
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    style={{
                      ...styles.link,
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      padding: 0,
                    }}
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
                onFocus={() => setFocusedField('password')}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                style={getInputStyle('password', !!passwordError)}
                aria-invalid={!!passwordError}
              />
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
                  <span style={styles.spinner} />
                  Signing in...
                </>
              ) : (
                'Sign in'
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
                    background: 'none',
                    border: 'none',
                    fontSize: 'inherit',
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
