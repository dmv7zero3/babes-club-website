import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

// Unified AuthPage component
export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") setMode("signup");
    else setMode("login");
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-toggle">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </div>
      {mode === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
};

export const LoginPage: React.FC = () => <LoginForm />;
export const SignupPage: React.FC = () => <SignupForm />;

export default AuthPage;
