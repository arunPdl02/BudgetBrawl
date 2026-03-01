import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptChallenge,
  declineChallenge,
  getChallenges,
} from "../api/challenges";
import { useAuth } from "../contexts/AuthContext";

const STATUS_COLOR: Record<string, string> = {
  pending_friend: "#fb923c",
  active: "#4ade80",
  pending_report: "#facc15",
  resolved: "#818cf8",
  auto_forfeited: "#f87171",
  declined: "#64748b",
};

export default function ChallengesListPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);

  const reload = () =>
    getChallenges().then(setChallenges).catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const handleAccept = async (id: number) => {
    await acceptChallenge(id);
    reload();
  };

  const handleDecline = async (id: number) => {
    await declineChallenge(id);
    reload();
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Challenges</h1>
        <Link to="/challenges/new" style={btnPrimary as any}>
          + New Challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No challenges yet. Create one from the Dashboard.
        </p>
      ) : (
        challenges.map((c: any) => {
          const isInitiator = c.INITIATOR_ID === user?.USER_ID;
          const isFriend = c.FRIEND_ID === user?.USER_ID;
          return (
            <div key={c.CHALLENGE_ID} style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>
                    {c.EVENT_TITLE ?? c.EVENT_ID}
                  </span>{" "}
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {c.START_TIME
                      ? new Date(c.START_TIME).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: STATUS_COLOR[c.STATUS] ?? "#94a3b8",
                    textTransform: "uppercase",
                  }}
                >
                  {c.STATUS?.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {isInitiator ? "You challenged" : c.INITIATOR_NAME} vs{" "}
                {isFriend ? "you" : c.FRIEND_NAME} · Limit $
                {(c.SPEND_LIMIT ?? 0).toFixed(2)} · Stake $
                {(c.STAKE_PER_SIDE ?? 5).toFixed(2)} each
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <Link to={`/challenges/${c.CHALLENGE_ID}`} style={linkBtn}>
                  Details
                </Link>

                {c.STATUS === "pending_friend" && isFriend && (
                  <>
                    <button
                      onClick={() => handleAccept(c.CHALLENGE_ID)}
                      style={{ ...btn, background: "#16a34a" }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(c.CHALLENGE_ID)}
                      style={{ ...btn, background: "#dc2626" }}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: "1.5rem",
  maxWidth: "720px",
  margin: "0 auto",
  fontFamily: "sans-serif",
  color: "#f8fafc",
};

const card: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "10px",
  padding: "1rem",
  marginBottom: "0.75rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "7px",
  border: "none",
  background: "#6366f1",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "0.9rem",
};

const btn: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "5px",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};

const linkBtn: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "5px",
  background: "#334155",
  color: "#f8fafc",
  textDecoration: "none",
  fontSize: "0.85rem",
};
