import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { syncCalendar } from "../api/calendar";
import { generatePredictions, getPredictions } from "../api/predictions";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance, refresh: refreshWallet } = useWallet();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getPredictions().then(setPredictions).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const res = await syncCalendar();
      setMsg(`Synced ${res.synced} event(s) from Google Calendar.`);
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMsg("");
    try {
      const res = await generatePredictions();
      setPredictions((p) => [...p, ...res.predictions]);
      setMsg(`Generated ${res.generated} new prediction(s).`);
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h1>
        Welcome, {user?.DISPLAY_NAME ?? user?.EMAIL} 👋
      </h1>

      <div style={cardRow}>
        <div style={statCard}>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Wallet</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            ${balance?.toFixed(2) ?? "—"}
          </div>
          <Link to="/wallet" style={linkStyle}>
            View transactions →
          </Link>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Predictions
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {predictions.length}
          </div>
          <Link to="/challenges" style={linkStyle}>
            View challenges →
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={handleSync} disabled={syncing} style={btnStyle}>
          {syncing ? "Syncing…" : "📅 Sync Calendar"}
        </button>
        <button onClick={handleGenerate} disabled={generating} style={btnPrimary}>
          {generating ? "Generating…" : "✨ Generate Predictions"}
        </button>
      </div>

      {msg && (
        <p style={{ color: "#a5f3fc", marginBottom: "1rem" }}>{msg}</p>
      )}

      <h2>Upcoming Events & Predictions</h2>
      {predictions.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No predictions yet. Sync your calendar and generate predictions.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {predictions.map((p: any) => (
            <div key={p.PREDICTION_ID ?? p.event_id} style={predCard}>
              <div style={{ fontWeight: 600 }}>
                {p.TITLE ?? p.event_id}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {p.START_TIME
                  ? new Date(p.START_TIME).toLocaleString()
                  : ""}
              </div>
              <div style={{ marginTop: "0.4rem" }}>
                Predicted:{" "}
                <strong style={{ color: "#a3e635" }}>
                  ${(p.PREDICTED_AMOUNT ?? p.predicted_amount ?? 0).toFixed(2)}
                </strong>
                {(p.SUGGESTED_LIMIT ?? p.suggested_limit) && (
                  <>
                    {" "}· Suggested limit:{" "}
                    <strong style={{ color: "#fb923c" }}>
                      ${(p.SUGGESTED_LIMIT ?? p.suggested_limit).toFixed(2)}
                    </strong>
                  </>
                )}
              </div>
              {(p.REASONING_TEXT ?? p.reasoning) && (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {p.REASONING_TEXT ?? p.reasoning}
                </p>
              )}
              <Link
                to="/challenges"
                style={{ ...linkStyle, marginTop: "0.4rem", display: "block" }}
              >
                Create a challenge →
              </Link>
            </div>
          ))}
        </div>
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

const cardRow: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  marginBottom: "1.25rem",
  flexWrap: "wrap",
};

const statCard: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "10px",
  padding: "1rem 1.5rem",
  minWidth: "160px",
  flex: 1,
};

const predCard: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "10px",
  padding: "1rem",
};

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  borderRadius: "7px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#f8fafc",
  cursor: "pointer",
  fontWeight: 600,
};

const btnPrimary: React.CSSProperties = {
  ...btnStyle,
  background: "#6366f1",
  border: "none",
};

const linkStyle: React.CSSProperties = {
  color: "#818cf8",
  textDecoration: "none",
  fontSize: "0.85rem",
};
