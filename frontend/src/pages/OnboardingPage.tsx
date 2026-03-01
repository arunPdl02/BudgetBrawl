import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitQuiz } from "../api/onboarding";
import { useAuth } from "../contexts/AuthContext";

const QUESTIONS = [
  {
    key: "lunch_last_3",
    label: "How much did you spend on lunch in your last 3 outings?",
    placeholder: "e.g. $12, $8, $15",
  },
  {
    key: "transport_last_week",
    label: "How much did you spend on transport last week?",
    placeholder: "e.g. $35 on Uber",
  },
  {
    key: "going_out_last_weekend",
    label: "How much did you spend going out last weekend?",
    placeholder: "e.g. $60 at dinner + drinks",
  },
];

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const q = QUESTIONS[step];

  const handleNext = async () => {
    if (!answers[q.key]?.trim()) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setLoading(true);
      try {
        await submitQuiz(
          QUESTIONS.map((q) => ({
            question_key: q.key,
            answer_text: answers[q.key] ?? "",
          }))
        );
        await refreshUser();
        navigate("/dashboard", { replace: true });
      } catch (e) {
        alert("Failed to save answers. Try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>Tell us about your habits</h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Step {step + 1} of {QUESTIONS.length}
      </p>

      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: 600,
          }}
        >
          {q.label}
        </label>
        <input
          style={{
            width: "100%",
            padding: "0.6rem 0.8rem",
            borderRadius: "6px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: "1rem",
            boxSizing: "border-box",
          }}
          placeholder={q.placeholder}
          value={answers[q.key] ?? ""}
          onChange={(e) =>
            setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
          }
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
        <button
          onClick={handleNext}
          disabled={loading || !answers[q.key]?.trim()}
          style={{
            marginTop: "1.25rem",
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Saving…"
            : step < QUESTIONS.length - 1
            ? "Next →"
            : "Finish Setup"}
        </button>
      </div>
    </div>
  );
}
