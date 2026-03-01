/** Shared theme constants — Duolingo/Venmo-inspired light playful theme */

export const colors = {
  // Backgrounds
  pageBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  navBg: "#FFFFFF",
  inputBg: "#F4F4F2",

  // Brand
  primary: "#7C5CFC",
  primaryHover: "#6A4CE0",

  // Text
  textPrimary: "#1A1A2E",
  textSecondary: "#8E8E93",
  textMuted: "#B0B0B8",

  // Status
  green: "#58CC02",
  coral: "#FF6B6B",
  orange: "#FFB020",
  blue: "#4A9DFF",

  // Borders
  border: "#E8E8E8",
  borderLight: "#F0F0F0",
};

export const pageStyle: React.CSSProperties = {
  padding: "1.5rem",
  maxWidth: "720px",
  margin: "0 auto",
  fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
  color: colors.textPrimary,
};

export const cardStyle: React.CSSProperties = {
  background: colors.cardBg,
  borderRadius: "16px",
  padding: "1rem 1.25rem",
  marginBottom: "0.75rem",
  border: `1px solid ${colors.borderLight}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.9rem",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: colors.inputBg,
  color: colors.textPrimary,
  fontSize: "1rem",
  boxSizing: "border-box",
  outline: "none",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
};

export const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  borderRadius: "12px",
  border: "none",
  background: colors.primary,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "1rem",
};

export const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  background: colors.cardBg,
  color: colors.textPrimary,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};

export const btnSmall: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "8px",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};

export const linkStyle: React.CSSProperties = {
  color: colors.primary,
  textDecoration: "none",
  fontSize: "0.85rem",
  fontWeight: 600,
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "1rem",
  marginBottom: "0.4rem",
  color: colors.textSecondary,
  fontSize: "0.9rem",
  fontWeight: 600,
};
