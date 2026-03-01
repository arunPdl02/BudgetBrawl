import { useWallet } from "../contexts/WalletContext";
import { colors, pageStyle, cardStyle, btnSecondary } from "../theme";

export default function WalletPage() {
  const { balance, transactions, refresh } = useWallet();

  return (
    <div style={{ ...pageStyle, maxWidth: "600px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontWeight: 800 }}>Wallet</h1>
        <button onClick={refresh} style={btnSecondary}>
          Refresh
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          textAlign: "center",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
          Virtual Balance
        </div>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: colors.green }}>
          ${balance?.toFixed(2) ?? "---"}
        </div>
      </div>

      <h2 style={{ fontWeight: 700 }}>Transaction History</h2>
      {(transactions as any[]).length === 0 ? (
        <p style={{ color: colors.textSecondary }}>No transactions yet.</p>
      ) : (
        (transactions as any[]).map((t: any) => (
          <div key={t.TXN_ID} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>
                {t.TXN_TYPE?.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: t.AMOUNT >= 0 ? colors.green : colors.coral,
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
                color: colors.textSecondary,
                marginTop: "0.2rem",
              }}
            >
              <span>{t.DESCRIPTION}</span>
              <span>Balance: ${t.BALANCE_AFTER?.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: colors.textMuted, marginTop: "0.1rem" }}>
              {t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleString() : ""}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
