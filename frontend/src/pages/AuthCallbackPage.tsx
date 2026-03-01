import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      login(token).then(() => navigate("/dashboard", { replace: true }));
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
