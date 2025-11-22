import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignupScreen from "./SignupScreen";
import { readStoredSession } from "@/lib/dashboard/session";

const SignupPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = readStoredSession();

    if (stored?.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <SignupScreen onSuccess={() => navigate("/dashboard", { replace: true })} />
  );
};

export default SignupPage;
