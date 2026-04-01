import { useEffect, useState } from "react";
import { socket } from "../nakama";

interface LeaderboardEntry {
  owner_id: string;
  username?: string;
  score?: number;
  reachedAt?: number;
}

interface GameResult {
  winner: string | null;
  draw: boolean;
}

interface Props {
  gameResult: GameResult | null;
  myUserId: string;
  onPlayAgain: () => void;
}

export default function Leaderboard({ gameResult, myUserId, onPlayAgain }: Props) {
  const [records, setRecords] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLeaderboard() {
    setLoading(true);
    setError("");

    try {
      const response: any = await socket.rpc("get_leaderboard", JSON.stringify({ limit: 20 }));
      const payload = response?.payload ? JSON.parse(response.payload) : null;
      const items = Array.isArray(payload?.records) ? payload.records : [];
      setRecords(items);
    } catch (e: any) {
      console.error("Leaderboard load failed:", e);
      setError("Unable to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const sortedRecords = [...records].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const timeDiff = (a.reachedAt ?? 0) - (b.reachedAt ?? 0);
    if (timeDiff !== 0) return timeDiff;
    const nameA = a.username ?? "";
    const nameB = b.username ?? "";
    const nameDiff = nameA.localeCompare(nameB);
    if (nameDiff !== 0) return nameDiff;
    return a.owner_id.localeCompare(b.owner_id);
  });

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: 24,
      width: 360,
      border: "0.5px solid #e0e0d8"
    }}>
      <div style={{ marginBottom: 16 }}>
        
        {gameResult && (
          <div style={{
            background: "#EEEDFE",
            border: "0.5px solid #AFA9EC",
            borderRadius: 12,
            padding: 14,
            color: "#3C3489",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {gameResult.draw
                ? "Last game ended in a draw"
                : gameResult.winner === myUserId
                ? "You won the game!"
                : "You lost the game"}
            </div>
            {!gameResult.draw && (
              <div style={{ fontSize: 13, color: "#555" }}>
                {gameResult.winner === myUserId ? "Great job!" : "Better luck next time."}
              </div>
            )}
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Leaderboard</div>
      </div>

      {loading ? (
        <div style={{ color: "#666", fontSize: 14 }}>Loading leaderboard...</div>
      ) : error ? (
        <div style={{ color: "#c0392b", fontSize: 14 }}>{error}</div>
      ) : records.length === 0 ? (
        <div style={{ color: "#666", fontSize: 14 }}>No leaderboard entries yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sortedRecords.map((entry, index) => (
            <div key={entry.owner_id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              background: "#fafafa",
              borderRadius: 12,
              border: "1px solid #ececec"
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{index + 1}. {entry.username ?? "Player"}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>{entry.score ?? 0}</div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onPlayAgain}
        style={{
          width: "100%",
          padding: "12px 14px",
          marginTop: 20,
          background: "#1D9E75",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Play again
      </button>
    </div>
  );
}
