import { useState } from "react";
import { client, setSession, setSocket } from "../nakama";

interface Props {
  onLogin: (userId: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!username.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Device auth
      console.log("Authenticating with device ID:", username);
      const deviceId = "device-" + username.toLowerCase().replace(/\s/g, "-");
      console.log("Authenticating with device ID:", deviceId);
      const session = await client.authenticateDevice(deviceId, true, username);
      setSession(session);
      console.log("Authenticated! User ID:", session.user_id);
      // Open a WebSocket connection to Nakama with the session
      const socket = client.createSocket(false, false);
      await socket.connect(session, true);
      setSocket(socket);

      onLogin(session.user_id!);
    } catch (e: any) {
      console.error("Login error:", e, username);
      setError("Login failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 32,
        width: 320,
        border: "0.5px solid #e0e0d8",
      }}
    >
      <h2 style={{ color:"#8f0ba3", margin: "0 0 4px", fontSize: 20 }}>Tic-Tac-Toe</h2>
      <p style={{ margin: "0 0 20px", color: "#888", fontSize: 14 }}>
        Enter a username to start
      </p>

      <input
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "0.5px solid #ccc",
          fontSize: 14,
          boxSizing: "border-box",
          marginBottom: 12,
        }}
      />

      {error && (
        <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading || !username.trim()}
        style={{
          width: "100%",
          padding: "10px",
          background: "#534AB7",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Connecting..." : "Play"}
      </button>
    </div>
  );
}
