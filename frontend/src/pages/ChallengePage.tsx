import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChallenge, reportSpend } from "../api/challenges";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh: refreshWallet } = useWallet();
  const [challenge, setChallenge] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) getChallenge(Number(id)).then(setChallenge).catch(() => {});
  }, [id]);

  if (!challenge)
    return (
      <div style={{ ...pageStyle, textAlign: "center" }}>Loading…</div>
    );

  const isInitiator = challenge.INITIATOR_ID === user?.USER_ID;
  const canReport =
    challenge.STATUS === "pending_report" && isInitiator;

  const handleReport = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await reportSpend(Number(id), val);
      setResult(res);
      setChallenge((c: any) => ({ ...c, STATUS: "resolved" }));
      refreshWallet();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h1>{challenge.EVENT_TITLE ?? challenge.EVENT_ID}</h1>
      <p style={{ color: "#94a3b8" }}>
        {challenge.START_TIME
          ? new Date(challenge.START_TIME).toLocaleString()
          : ""}
        {challenge.END_TIME
          ? ` – ${new Date(challenge.END_TIME).toLocaleString()}`
          : ""}
      </p>

      <div style={card}>
        <Row label="Status" value={challenge.STATUS?.replace(/_/g, " ")} />
        <Row label="Initiator" value={challenge.INITIATOR_NAME} />
        <Row label="Friend" value={challenge.FRIEND_NAME} />
        <Row
          label="Spend limit"
          value={`$${(challenge.SPEND_LIMIT ?? 0).toFixed(2)}`}
        />
        <Row
          label="Stake per side"
          value={`$${(challenge.STAKE_PER_SIDE ?? 5).toFixed(2)}`}
        />
        {challenge.REPORT_DEADLINE && (
          <Row
            label="Report deadline"
            value={new Date(challenge.REPORT_DEADLINE).toLocaleString()}
          />
        )}
      </div>

      {result && (
        <div
          style={{
            background: result.winner_id === user?.USER_ID ? "#14532d" : "#450a0a",
            borderRadius: "10px",
            padding: "1rem",
            marginTop: "1rem",
          }}
        >
          {result.winner_id === user?.USER_ID
            ? `🎉 You won $${result.pot}!`
            : `😔 You lost. Better luck next time.`}
        </div>
      )}

      {canReport && !result && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Report Actual Spend</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            Enter what you actually spent at this event.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 42.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleReport} disabled={submitting} style={btnPrimary}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.4rem 0",
        borderBottom: "1px solid #334155",
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: "1.5rem",
  maxWidth: "600px",
  margin: "0 auto",
  fontFamily: "sans-serif",
  color: "#f8fafc",
};

const card: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "10px",
  padding: "1rem",
  marginTop: "1rem",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.6rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "1rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.1rem",
  borderRadius: "7px",
  border: "none",
  background: "#6366f1",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
