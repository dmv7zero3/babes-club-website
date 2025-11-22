import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignupScreen from "./SignupScreen";
import { readStoredSession, clearSession } from "@/lib/dashboard/session";

const SignupPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.token) {
      // Fix 1.2: Validate token expiry before redirect
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (stored.expiresAt && stored.expiresAt > nowSeconds) {
        navigate("/dashboard", { replace: true });
      } else {
        clearSession();
      }
    }
  }, [navigate]);

  return (
    <SignupScreen onSuccess={() => navigate("/dashboard", { replace: true })} />
  );
};

export default SignupPage;
