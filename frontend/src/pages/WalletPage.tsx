import { useWallet } from "../contexts/WalletContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, btnSecondary } from "../theme";

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
        <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>Wallet</h1>
        <button type="button" onClick={refresh} className="hover-btn-secondary" style={btnSecondary}>
          Refresh
        </button>
      </div>

      <div
        className="hover-card"
        style={{
          ...cardStyle,
          textAlign: "center",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall, fontWeight: 500 }}>
          Virtual Balance
        </div>
        <div style={{ fontSize: fontSize.display, fontWeight: 600, lineHeight: lineHeight.tight, color: colors.green }}>
          ${balance?.toFixed(2) ?? "---"}
        </div>
      </div>

      <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Transaction History</h2>
      {(transactions as any[]).length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>No transactions yet.</p>
      ) : (
        (transactions as any[]).map((t: any) => (
          <div key={t.TXN_ID} className="hover-card" style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: fontSize.body }}>
              <span style={{ fontWeight: 600 }}>
                {t.TXN_TYPE?.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontWeight: 600,
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
                fontSize: fontSize.bodySmall,
                color: colors.textSecondary,
                marginTop: "0.2rem",
              }}
            >
              <span>{t.DESCRIPTION}</span>
              <span>Balance: ${t.BALANCE_AFTER?.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: fontSize.caption, color: colors.textMuted, marginTop: "0.1rem" }}>
              {t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleString() : ""}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
