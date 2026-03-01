import { useWallet } from "../contexts/WalletContext";

export default function WalletPage() {
  const { balance, transactions, refresh } = useWallet();

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Wallet</h1>
        <button onClick={refresh} style={btnSmall}>
          Refresh
        </button>
      </div>

      <div style={balanceCard}>
        <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          Virtual Balance
        </div>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#4ade80" }}>
          ${balance?.toFixed(2) ?? "—"}
        </div>
      </div>

      <h2>Transaction History</h2>
      {(transactions as any[]).length === 0 ? (
        <p style={{ color: "#64748b" }}>No transactions yet.</p>
      ) : (
        (transactions as any[]).map((t: any) => (
          <div key={t.TXN_ID} style={txnCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>
                {t.TXN_TYPE?.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: t.AMOUNT >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {t.AMOUNT >= 0 ? "+" : ""}
                ${Math.abs(t.AMOUNT).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.82rem",
                color: "#64748b",
                marginTop: "0.2rem",
              }}
            >
              <span>{t.DESCRIPTION}</span>
              <span>Balance: ${t.BALANCE_AFTER?.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.1rem" }}>
              {t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleString() : ""}
            </div>
          </div>
        ))
      )}
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

const balanceCard: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  textAlign: "center",
};

const txnCard: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "8px",
  padding: "0.8rem 1rem",
  marginBottom: "0.5rem",
};

const btnSmall: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#f8fafc",
  cursor: "pointer",
};
