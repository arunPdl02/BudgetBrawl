import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { syncCalendar } from "../api/calendar";
import { generatePredictions, getPredictions } from "../api/predictions";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, btnPrimary, btnSecondary, linkStyle } from "../theme";

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
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.hero, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.25rem" }}>
        Welcome, {user?.DISPLAY_NAME ?? user?.EMAIL}
      </h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="hover-card" style={{ ...cardStyle, flex: 1, minWidth: "160px" }}>
          <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, fontWeight: 500 }}>Wallet</div>
          <div style={{ fontSize: fontSize.display, fontWeight: 600, color: colors.green, lineHeight: lineHeight.tight }}>
            ${balance?.toFixed(2) ?? "---"}
          </div>
          <Link to="/wallet" className="hover-link" style={linkStyle}>
            View transactions
          </Link>
        </div>
        <div className="hover-card" style={{ ...cardStyle, flex: 1, minWidth: "160px" }}>
          <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, fontWeight: 500 }}>
            Predictions
          </div>
          <div style={{ fontSize: fontSize.display, fontWeight: 600, lineHeight: lineHeight.tight }}>
            {predictions.length}
          </div>
          <Link to="/challenges" className="hover-link" style={linkStyle}>
            View challenges
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={handleSync} disabled={syncing} className="hover-btn-secondary" style={btnSecondary}>
          {syncing ? "Syncing..." : "Sync Calendar"}
        </button>
        <button onClick={handleGenerate} disabled={generating} className="hover-btn-primary" style={btnPrimary}>
          {generating ? "Generating..." : "Generate Predictions"}
        </button>
      </div>

      {msg && (
        <p style={{ color: colors.primary, marginBottom: "1rem", fontSize: fontSize.bodySmall, fontWeight: 500 }}>{msg}</p>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Upcoming Events & Predictions</h2>
      {predictions.length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
          No predictions yet. Sync your calendar and generate predictions.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {predictions.map((p: any) => (
            <div key={p.PREDICTION_ID ?? p.event_id} className="hover-card" style={cardStyle}>
              <div style={{ fontWeight: 600, fontSize: fontSize.body, color: colors.textPrimary }}>
                {p.TITLE ?? p.event_id}
              </div>
              <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
                {p.START_TIME
                  ? new Date(p.START_TIME).toLocaleString()
                  : ""}
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: fontSize.body }}>
                Predicted:{" "}
                <strong style={{ color: colors.green, fontWeight: 600 }}>
                  ${(p.PREDICTED_AMOUNT ?? p.predicted_amount ?? 0).toFixed(2)}
                </strong>
                {(p.SUGGESTED_LIMIT ?? p.suggested_limit) && (
                  <>
                    {" "} · Suggested limit:{" "}
                    <strong style={{ color: colors.orange, fontWeight: 600 }}>
                      ${(p.SUGGESTED_LIMIT ?? p.suggested_limit).toFixed(2)}
                    </strong>
                  </>
                )}
              </div>
              {(p.REASONING_TEXT ?? p.reasoning) && (
                <p
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize.bodySmall,
                    lineHeight: lineHeight.body,
                    marginTop: "0.25rem",
                  }}
                >
                  {p.REASONING_TEXT ?? p.reasoning}
                </p>
              )}
              <Link
                to={`/challenges/new?predictionId=${p.PREDICTION_ID ?? p.prediction_id}`}
                className="hover-link"
                style={{ ...linkStyle, marginTop: "0.4rem", display: "block" }}
              >
                Create a challenge
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
