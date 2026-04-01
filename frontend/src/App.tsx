import { useState } from "react";
import Login from "./screens/Login";
import Matchmaking from "./screens/Matchmaking";
import Game from "./screens/Game";
import Leaderboard from "./screens/Leaderboard";

type Screen = "login" | "matchmaking" | "game" | "leaderboard";

interface GameResult {
  winner: string | null;
  draw: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [matchId, setMatchId] = useState<string>("");
  const [myUserId, setMyUserId] = useState<string>("");
  const [lastGameResult, setLastGameResult] = useState<GameResult | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f0",
      fontFamily: "sans-serif"
    }}>
      {screen === "login" && (
        <Login
          onLogin={(userId) => {
            setMyUserId(userId);
            setScreen("matchmaking");
          }}
        />
      )}
      {screen === "matchmaking" && (
        <Matchmaking
          onMatchFound={(id) => {
            setMatchId(id);
            setScreen("game");
          }}
          onCancel={() => setScreen("login")}
        />
      )}
      {screen === "game" && (
        <Game
          matchId={matchId}
          myUserId={myUserId}
          onGameEnd={(result) => {
            setLastGameResult(result);
            setScreen("leaderboard");
          }}
          onLeaveRoom={() => setScreen("matchmaking")}
        />
      )}
      {screen === "leaderboard" && (
        <Leaderboard
          gameResult={lastGameResult}
          myUserId={myUserId}
          onPlayAgain={() => {
            setLastGameResult(null);
            setScreen("matchmaking");
          }}
        />
      )}
    </div>
  );
}