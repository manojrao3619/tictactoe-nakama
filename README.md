# 🎮 TicTacToe Multiplayer (Nakama + React)

A real-time, cross-device multiplayer TicTacToe game built with a **server-authoritative backend using Nakama** and a **React + TypeScript frontend**.

---

# 🚀 Live Overview

This project demonstrates:

* Real-time multiplayer game architecture
* Server-authoritative game logic (no client-side cheating)
* State synchronization across players
* Persistent scoreboard using Nakama storage & leaderboard APIs

---

# 🧠 Architecture

```text
Frontend (React - Vercel)
        ↓
Nakama Server (TypeScript runtime modules)
        ↓
PostgreSQL (persistent storage)
```

### Flow:

1. User connects → authenticates via Nakama
2. Player joins or creates match
3. Moves are sent to Nakama server
4. Server validates move → updates game state
5. Updated state is broadcast to all players

---

# ⚙️ Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Nakama (Go-based game server)
* TypeScript runtime modules
* Docker

### Database

* PostgreSQL (via Nakama)

---

# 🎯 Features

## 🧩 Core Gameplay

* Real-time multiplayer TicTacToe
* Turn-based system with strict validation
* Winner detection and game state sync

## 🔐 Server-Authoritative Design

* All moves validated on server
* Prevents:

  * invalid positions
  * out-of-turn moves
  * state manipulation

## 🧮 Scoreboard System

* Tracks player wins
* Uses Nakama storage + leaderboard APIs
* Tie-breaking using earliest win timestamp

## 🔄 Match Lifecycle

* Player join/leave handling
* Match state persistence
* Game restart flow

---

# 🏗️ Key Design Decisions

## 1. Server-Authoritative Architecture

All game logic runs on the backend.

**Why?**

* Prevent cheating
* Maintain consistent game state
* Simplify frontend logic

---

## 2. Nakama for Multiplayer Backend

Used Nakama instead of building custom WebSocket server.

**Advantages:**

* Built-in matchmaking & sessions
* Real-time messaging
* Scalable architecture

**Tradeoff:**

* Requires understanding Nakama lifecycle
* Limited JS runtime (Goja → ES5 constraints)

---

## 3. TypeScript for Backend Logic

Game logic written in TypeScript and compiled to JS.

**Advantages:**

* Type safety
* Better maintainability

**Tradeoff:**

* Must adapt to Nakama runtime limitations

---

## 4. Stateless Frontend

Frontend only renders state from server.

**Advantages:**

* No desync issues
* Simplified UI logic

---

# ⚖️ Tradeoffs & Limitations

* Nakama JS runtime supports limited ES features (ES5)
* Deployment complexity (Docker + networking)
* No advanced matchmaking (basic implementation)
* No reconnection handling (can be extended)

---

# 📦 Project Structure

```text
frontend/     → React application
backend/      → Nakama TypeScript modules
docker-compose.yml → local development setup
```

---

# 🧪 Local Development

## Backend

```bash
docker compose up -d
cd backend
npm install
npm run build
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🌐 Deployment

## Frontend

* Vercel

## Backend

* Docker-based deployment
* Railway

---

# 🔧 Environment Variables

Frontend:

```bash
VITE_NAKAMA_HOST=your-backend-url
```

Backend:
```bash
DATABASE_URL=your_database_url
```

---

# 🧠 Learning Outcomes

This project helped in understanding:

* Real-time system design
* Multiplayer synchronization
* Server-authoritative game logic
* Containerized deployment (Docker)
* Debugging distributed systems

---

# 🚀 Future Improvements

* Matchmaking queue system
* Player reconnection handling
* Spectator mode
* Better UI/UX
* Analytics (match history)

---

# 📌 Conclusion

This project showcases the ability to:

* Design and build real-time multiplayer systems
* Handle backend architecture and state synchronization
* Work with distributed systems and containerized environments

---

**Author:** Manoj Rao
