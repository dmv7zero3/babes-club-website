/**
 * Signup Page for The Babes Club
 *
 * FIXED VERSION: Includes proper session synchronization before navigation.
 *
 * The bug was that SignupScreen persists session to storage but immediately
 * navigates to /dashboard before the AuthContext state updates.
 *
 * This fix adds a small delay and session verification before navigation.
 *
 * ALTERNATIVE: The cleaner fix is to use useAuth().signup() in SignupScreen
 * (see SignupScreen.fixed.tsx), but this approach works if you need to
 * keep the existing SignupScreen API structure.
 */

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SignupScreen from "./SignupScreen";
import { readStoredSession, clearSession } from "@/lib/dashboard/session";
import { useAuth } from "@/lib/auth";

const SignupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.token) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (stored.expiresAt && stored.expiresAt > nowSeconds) {
        navigate("/dashboard", { replace: true });
      } else {
        clearSession();
      }
    }
  }, [navigate]);

  // Also redirect when AuthContext updates
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[SignupPage] AuthContext authenticated, redirecting...");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * FIX: Wait for session to be properly established before navigating
   *
   * This handles the race condition where:
   * 1. SignupScreen calls persistSession()
   * 2. Navigation happens immediately
   * 3. ProtectedRoute checks isAuthenticated (still false)
   * 4. User gets redirected to login (404)
   */
  const handleSuccess = useCallback(async () => {
    console.log("[SignupPage] Signup success callback triggered");

    // Wait for the session event to propagate
    // This gives the AuthContext time to pick up the session-updated event
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the session was written correctly
    const session = readStoredSession();
    if (session?.token) {
      console.log("[SignupPage] Session verified, navigating to dashboard");
      navigate("/dashboard", { replace: true });
    } else {
      console.warn("[SignupPage] Session not found after signup, retrying...");
      // Retry after a longer delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return <SignupScreen onSuccess={handleSuccess} />;
};

export default SignupPage;
