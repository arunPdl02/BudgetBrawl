import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFriends } from "../api/friends";
import { getPredictions } from "../api/predictions";
import { createChallenge } from "../api/challenges";

export default function NewChallengePage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [friendId, setFriendId] = useState("");
  const [predictionIdx, setPredictionIdx] = useState<number>(-1);
  const [spendLimit, setSpendLimit] = useState("");
  const [stake, setStake] = useState("5.00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getFriends().then(setFriends).catch(() => {});
    getPredictions().then(setPredictions).catch(() => {});
  }, []);

  const selectedPrediction = predictionIdx >= 0 ? predictions[predictionIdx] : null;

  useEffect(() => {
    if (selectedPrediction) {
      setSpendLimit(
        (selectedPrediction.SUGGESTED_LIMIT ?? selectedPrediction.suggested_limit ?? "").toString()
      );
    }
  }, [predictionIdx]);

  const handleSubmit = async () => {
    if (!friendId) {
      setError("Select a friend to challenge.");
      return;
    }
    if (!selectedPrediction) {
      setError("Select an event.");
      return;
    }
    const limit = parseFloat(spendLimit);
    if (isNaN(limit) || limit <= 0) {
      setError("Enter a valid spend limit.");
      return;
    }
    const stakeVal = parseFloat(stake);
    if (isNaN(stakeVal) || stakeVal <= 0) {
      setError("Enter a valid stake amount.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createChallenge({
        friend_id: friendId,
        prediction_id: selectedPrediction.PREDICTION_ID ?? selectedPrediction.prediction_id,
        event_id: selectedPrediction.EVENT_ID ?? selectedPrediction.event_id,
        spend_limit: limit,
        stake_per_side: stakeVal,
      });
      navigate("/challenges");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Failed to create challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h1>New Challenge</h1>

      <label style={labelStyle}>Event</label>
      <select
        style={selectStyle}
        value={predictionIdx}
        onChange={(e) => setPredictionIdx(Number(e.target.value))}
      >
        <option value={-1}>Select an event…</option>
        {predictions.map((p: any, i: number) => (
          <option key={p.PREDICTION_ID ?? p.event_id ?? i} value={i}>
            {p.TITLE ?? p.EVENT_TITLE ?? p.event_id} —{" "}
            {p.START_TIME ? new Date(p.START_TIME).toLocaleDateString() : ""} · Predicted $
            {(p.PREDICTED_AMOUNT ?? p.predicted_amount ?? 0).toFixed(2)}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Challenge a Friend</label>
      <select
        style={selectStyle}
        value={friendId}
        onChange={(e) => setFriendId(e.target.value)}
      >
        <option value="">Select a friend…</option>
        {friends.map((f: any) => (
          <option key={f.USER_ID} value={f.USER_ID}>
            {f.DISPLAY_NAME ?? f.EMAIL}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Spend Limit ($)</label>
      <input
        style={inputStyle}
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g. 25.00"
        value={spendLimit}
        onChange={(e) => setSpendLimit(e.target.value)}
      />

      <label style={labelStyle}>Stake per Side ($)</label>
      <input
        style={inputStyle}
        type="number"
        min="0"
        step="0.01"
        placeholder="5.00"
        value={stake}
        onChange={(e) => setStake(e.target.value)}
      />

      {error && <p style={{ color: "#f87171", marginTop: "0.5rem" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ ...btnPrimary, marginTop: "1.25rem", width: "100%" }}
      >
        {submitting ? "Creating…" : "Create Challenge"}
      </button>
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

const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "1rem",
  marginBottom: "0.35rem",
  color: "#94a3b8",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "1rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.2rem",
  borderRadius: "7px",
  border: "none",
  background: "#6366f1",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "1rem",
};
