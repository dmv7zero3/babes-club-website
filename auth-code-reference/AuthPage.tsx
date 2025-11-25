/**
 * Auth Page Component for The Babes Club
 * 
 * A unified authentication page that allows users to switch
 * between login and signup views with smooth transitions.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

// ============================================================================
// Types
// ============================================================================

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  /** Initial mode (login or signup) */
  initialMode?: AuthMode;
  /** Path to redirect after successful auth */
  redirectTo?: string;
  /** Callback when auth is successful */
  onSuccess?: () => void;
  /** Terms URL for signup */
  termsUrl?: string;
  /** Privacy policy URL for signup */
  privacyUrl?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  redirectTo = '/dashboard',
  onSuccess,
  termsUrl = '/terms',
  privacyUrl = '/privacy',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Get initial mode from URL or prop
  const urlMode = searchParams.get('mode') as AuthMode | null;
  const [mode, setMode] = useState<AuthMode>(urlMode || initialMode);

  // Sync mode with URL
  useEffect(() => {
    const newMode = searchParams.get('mode') as AuthMode | null;
    if (newMode && (newMode === 'login' || newMode === 'signup')) {
      setMode(newMode);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from ?? redirectTo;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, redirectTo]);

  // Handle successful authentication
  const handleSuccess = useCallback(() => {
    onSuccess?.();
    const from = (location.state as { from?: string })?.from ?? redirectTo;
    navigate(from, { replace: true });
  }, [navigate, location.state, redirectTo, onSuccess]);

  // Switch between modes
  const switchToLogin = useCallback(() => {
    setMode('login');
    setSearchParams({ mode: 'login' });
  }, [setSearchParams]);

  const switchToSignup = useCallback(() => {
    setMode('signup');
    setSearchParams({ mode: 'signup' });
  }, [setSearchParams]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    // Navigate to password reset page or show modal
    navigate('/forgot-password');
  }, [navigate]);

  // Render appropriate form based on mode
  if (mode === 'signup') {
    return (
      <SignupForm
        onSuccess={handleSuccess}
        onSwitchToLogin={switchToLogin}
        requireTerms={true}
        termsUrl={termsUrl}
        privacyUrl={privacyUrl}
      />
    );
  }

  return (
    <LoginForm
      onSuccess={handleSuccess}
      onSwitchToSignup={switchToSignup}
      onForgotPassword={handleForgotPassword}
    />
  );
};

// ============================================================================
// Standalone Pages
// ============================================================================

/**
 * Standalone Login Page
 */
export const LoginPage: React.FC<{ redirectTo?: string }> = ({ 
  redirectTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from ?? redirectTo;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, redirectTo]);

  const handleSuccess = useCallback(() => {
    const from = (location.state as { from?: string })?.from ?? redirectTo;
    navigate(from, { replace: true });
  }, [navigate, location.state, redirectTo]);

  return (
    <LoginForm
      onSuccess={handleSuccess}
      onSwitchToSignup={() => navigate('/signup')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
};

/**
 * Standalone Signup Page
 */
export const SignupPage: React.FC<{ 
  redirectTo?: string;
  termsUrl?: string;
  privacyUrl?: string;
}> = ({ 
  redirectTo = '/dashboard',
  termsUrl = '/terms',
  privacyUrl = '/privacy',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from ?? redirectTo;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, redirectTo]);

  const handleSuccess = useCallback(() => {
    const from = (location.state as { from?: string })?.from ?? redirectTo;
    navigate(from, { replace: true });
  }, [navigate, location.state, redirectTo]);

  return (
    <SignupForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => navigate('/login')}
      requireTerms={true}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
    />
  );
};

export default AuthPage;
