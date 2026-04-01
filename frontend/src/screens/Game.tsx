import { useEffect, useState } from "react";
import { socket } from "../nakama";

const OP_CODE_MOVE  = 1;
const OP_CODE_STATE = 2;
const OP_CODE_GAME_OVER = 3;
const OP_CODE_SYNC = 4;

interface GameState {
  board: Array<string | null>;
  marks: { [userId: string]: string };
  turn: string;
  winner: string | null;
  draw: boolean;
}

interface Props {
  matchId: string;
  myUserId: string;
  onGameEnd: (result: { winner: string | null; draw: boolean }) => void;
  onLeaveRoom: () => void;
}

export default function Game({ matchId, myUserId, onGameEnd, onLeaveRoom }: Props) {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    marks: {},
    turn: "",
    winner: null,
    draw: false,
  });

  const [gameOver, setGameOver] = useState<any>(null);

  const myMark = gameState.marks[myUserId];
  const isMyTurn = gameState.turn === myUserId;
  const opponentId = Object.keys(gameState.marks).find((id) => id !== myUserId);

  useEffect(() => {
    if (!gameOver) return;
    onGameEnd({ winner: gameOver.winner, draw: gameOver.draw });
  }, [gameOver, onGameEnd]);

  useEffect(() => {
      console.log("=== Game useEffect running ===");
      console.log("socket:", socket);
      console.log("matchId:", matchId);
      console.log("myUserId:", myUserId);

    // Listen for ALL messages from the server on this match
    socket.onmatchdata = (data: any) => {
      console.log("=== onmatchdata fired ===");
      console.log("op_code:", data.op_code);
      console.log("raw data:", data);

      try {
        const payload = JSON.parse(new TextDecoder().decode(data.data));
        console.log("Received match data:", payload);

        if (data.op_code === OP_CODE_STATE) {
            // Server sent a new game state — update the board
            setGameState(payload);
        }

        if (data.op_code === OP_CODE_GAME_OVER) {
            // Game is over — show result
            setGameOver(payload);
        }
      } catch (e) {
        console.error("Error parsing match data:", e);
      }
    };

    setTimeout(async () => {
        console.log("=== sending sync request ===");
        try {
          await socket.sendMatchState(matchId, OP_CODE_SYNC, JSON.stringify({}));
        } catch (err) {
          console.error("Sync request failed:", err);
        }
    }, 500);

    // Cleanup listener when component unmounts
    return () => {
        socket.onmatchdata = () => {};
        console.log("=== Game useEffect cleanup ===");
    };
  }, []);

  async function handleCellClick(index: number) {
    // Don't allow moves if not your turn or cell taken
    if (!isMyTurn || gameState.board[index] || gameOver) return;

    try {
      // Send move to server — server validates and broadcasts back
      // We do NOT update the board here — we wait for server's broadcast
      await socket.sendMatchState(
        matchId,
        OP_CODE_MOVE,
        JSON.stringify({ position: index }),
      );
    } catch (err) {
      console.error("Failed to send move:", err);
    }
  }

  async function handleLeaveRoom() {
    try {
      await socket.leaveMatch(matchId);
    } catch (err) {
      console.warn("Leave match failed:", err);
    }
    onLeaveRoom();
  }

  function getCellStyle(cell: string | null, index: number) {
    const isClickable = isMyTurn && !cell && !gameOver;
    return {
      width: "100%",
      aspectRatio: "1",
      border: "0.5px solid #e0e0d8",
      borderRadius: 8,
      background: isClickable ? "#fafafa" : "white",
      cursor: isClickable ? "pointer" : "default",
      fontSize: 32,
      fontWeight: 500,
      color: cell === "X" ? "#1D9E75" : "#D85A30",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.1s",
    };
  }

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: 24,
      width: 320,
      border: "0.5px solid #e0e0d8"
    }}>
      {/* Player info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ color: "#888" }}>You: </span>
          <span style={{ fontWeight: 500, color: myMark === "X" ? "#1D9E75" : "#D85A30" }}>
            {myMark || "..."}
          </span>
        </div>
        <div style={{
          fontSize: 12,
          padding: "3px 10px",
          borderRadius: 10,
          background: isMyTurn ? "#E1F5EE" : "#f5f0f0",
          color: isMyTurn ? "#085041" : "#888"
        }}>
          {gameOver ? "Game over" : isMyTurn ? "Your turn" : "Opponent's turn"}
        </div>
      </div>


      {/* Board */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 6,
        marginBottom: 16
      }}>
        {gameState.board.map((cell, i) => (
          <div
            key={i}
            style={getCellStyle(cell, i) as any}
            onClick={() => handleCellClick(i)}
          >
            {cell}
          </div>
        ))}
      </div>

      {/* Game over panel */}
      {gameOver && (
        <div style={{
          background: "#EEEDFE",
          border: "0.5px solid #AFA9EC",
          borderRadius: 10,
          padding: 16,
          textAlign: "center",
          marginBottom: 12
        }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: "#3C3489", marginBottom: 4 }}>
            {gameOver.draw
              ? "It's a draw!"
              : gameOver.winner === myUserId
              ? "You won!"
              : "You lost"}
          </div>
          <div style={{ fontSize: 12, color: "#534AB7" }}>
            {gameOver.reason === "opponent_left" ? "Opponent left the game" : ""}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <button
          onClick={handleLeaveRoom}
          style={{
            width: "100%",
            padding: 10,
            background: "#f5f0f0",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Leave room
        </button>
      </div>
    </div>
  );
}