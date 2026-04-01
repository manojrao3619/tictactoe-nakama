import { useEffect, useState, useRef } from "react";
import { socket } from "../nakama";

interface Props {
  onMatchFound: (matchId: string) => void;
  onCancel: () => void;
}

export default function Matchmaking({ onMatchFound, onCancel }: Props) {
  const [status, setStatus] = useState("Looking for a game...");
  const ticketRef = useRef<string | null>(null);

  useEffect(() => {
    // Handle matchmaker matches before requesting a ticket.
    socket.onmatchmakermatched = async (matched: any) => {
      console.log("Matched!", matched);
      ticketRef.current = null;
      setStatus("Opponent found! Joining...");

      try {
        const match = matched.token
          ? await socket.joinMatch(matched.match_id, matched.token)
          : await socket.joinMatch(matched.match_id);
        console.log("Joined match:", match.match_id);
        onMatchFound(match.match_id);
      } catch (e: any) {
        console.error("Join error:", e);
        setStatus("Error joining: " + e.message);
      }
    };

    startMatchmaking();
    return () => {
      // cleanup on unmount
      if (ticketRef.current) {
        socket.removeMatchmaker(ticketRef.current).catch(() => {});
      }
      socket.onmatchmakermatched = () => {};
    };
  }, []);

  async function startMatchmaking() {
    try {
      setStatus("Finding opponent...");

      // Add to matchmaker queue — Nakama pairs us with another player
      const result = await socket.addMatchmaker(
        "*", // match anyone
        2, // min players
        2, // max players
        {}, // properties
      );
      ticketRef.current = result.ticket;
      console.log("Matchmaker ticket:", result.ticket);
      setStatus("Waiting for opponent...");
    } catch (e: any) {
      console.error("Matchmaking error:", e);
      setStatus("Error: " + e.message);
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
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #e0e0d8",
          borderTopColor: "#534AB7",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{color: "#333", margin: "0 0 8px", fontSize: 18 }}>Finding a game</h2>
      <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
        {status}
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            padding: "8px 20px",
            background: "transparent",
            border: "0.5px solid #ccc",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            color: "#666",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
