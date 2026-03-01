import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ChallengePage from "./pages/ChallengePage";
import ChallengesListPage from "./pages/ChallengesListPage";
import NewChallengePage from "./pages/NewChallengePage";
import DashboardPage from "./pages/DashboardPage";
import FriendsPage from "./pages/FriendsPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import WalletPage from "./pages/WalletPage";

function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const navLink = (to: string, label: string) => (
    <a
      href={to}
      style={{
        color: loc.pathname === to ? "#818cf8" : "#94a3b8",
        textDecoration: "none",
        fontWeight: loc.pathname === to ? 700 : 400,
      }}
    >
      {label}
    </a>
  );

  if (!user) return null;
  return (
    <nav
      style={{
        background: "#1e293b",
        padding: "0.75rem 1.5rem",
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        borderBottom: "1px solid #334155",
      }}
    >
      <span style={{ fontWeight: 800, color: "#f8fafc", marginRight: "auto" }}>
        💸 BudgetBrawl
      </span>
      {navLink("/dashboard", "Dashboard")}
      {navLink("/friends", "Friends")}
      {navLink("/challenges", "Challenges")}
      {navLink("/wallet", "Wallet")}
      <button
        onClick={logout}
        style={{
          padding: "0.3rem 0.7rem",
          borderRadius: "5px",
          border: "1px solid #334155",
          background: "transparent",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        Sign out
      </button>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontFamily: "sans-serif",
        }}
      >
        Loading…
      </div>
    );

  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;

  if (!user.ONBOARDING_DONE && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      <Nav />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <ChallengesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/new"
          element={
            <ProtectedRoute>
              <NewChallengePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id"
          element={
            <ProtectedRoute>
              <ChallengePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
