import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const code = params.get("code");
    const state = params.get("state");
    if (token) {
      login(token).then(() => navigate("/dashboard", { replace: true }));
    } else if (code && state) {
      window.location.href = `${API}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } else {
      navigate("/login", { replace: true });
    }
  }, [params, login, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      Signing you in…
    </div>
  );
}
