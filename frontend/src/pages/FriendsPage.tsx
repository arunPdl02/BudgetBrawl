import { useEffect, useState } from "react";
import {
  acceptRequest,
  declineRequest,
  getFriends,
  getPending,
  sendRequest,
} from "../api/friends";

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const reload = () => {
    getFriends().then(setFriends).catch(() => {});
    getPending().then(setPending).catch(() => {});
  };

  useEffect(() => {
    reload();
  }, []);

  const handleAdd = async () => {
    if (!email.trim()) return;
    try {
      await sendRequest(email.trim());
      setMsg(`Friend request sent to ${email}.`);
      setEmail("");
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Failed.");
    }
  };

  const handleAccept = async (id: number) => {
    await acceptRequest(id);
    reload();
  };

  const handleDecline = async (id: number) => {
    await declineRequest(id);
    reload();
  };

  return (
    <div style={pageStyle}>
      <h1>Friends</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          style={inputStyle}
          placeholder="friend@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} style={btnPrimary}>
          Add Friend
        </button>
      </div>
      {msg && <p style={{ color: "#a5f3fc" }}>{msg}</p>}

      {pending.length > 0 && (
        <>
          <h2>Pending Requests</h2>
          {pending.map((p: any) => (
            <div key={p.FRIENDSHIP_ID} style={card}>
              <span>{p.DISPLAY_NAME ?? p.EMAIL}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleAccept(p.FRIENDSHIP_ID)}
                  style={{ ...btnSmall, background: "#16a34a" }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(p.FRIENDSHIP_ID)}
                  style={{ ...btnSmall, background: "#dc2626" }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <h2>My Friends ({friends.length})</h2>
      {friends.length === 0 ? (
        <p style={{ color: "#64748b" }}>No friends yet. Add someone!</p>
      ) : (
        friends.map((f: any) => (
          <div key={f.FRIENDSHIP_ID} style={card}>
            <div>
              <div style={{ fontWeight: 600 }}>{f.DISPLAY_NAME ?? f.EMAIL}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {f.EMAIL}
              </div>
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

const card: React.CSSProperties = {
  background: "#1e293b",
  borderRadius: "10px",
  padding: "0.9rem 1rem",
  marginBottom: "0.6rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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

const btnSmall: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "5px",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};
