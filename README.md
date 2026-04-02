# 🎮 TicTacToe Multiplayer (Nakama + React)

A real-time, cross-device multiplayer TicTacToe game built with a **server-authoritative backend using Nakama** and a **React + TypeScript frontend**.

---
## 🔗 Live Links

- 🌐 Frontend (Live App): https://tictactoe-nakama-sable.vercel.app
- ⚙️ Backend API: https://tictactoe-nakama-production-b230.up.railway.app
- 🎥 Demo Video: https://drive.google.com/file/d/1kQU3gH1IFrK6MVvqgsn9XXTTzd97UYad/view?usp=drive_link


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

# 🚀 Deployment

## Backend (Nakama)

1. Deploy Nakama using Docker to Railway
2. Configure PostgreSQL database
3. Set database connection:

--database.address postgresql://USER:PASSWORD@HOST:5432/DB
or --database.address DATABASE_URL
and set the DATABASE_URL=your-database-url

4. Ensure server listens on:

--socket.address 0.0.0.0

5. Expose port 7350 (API)

---

## Frontend

1. Deploy to Vercel
2. Set environment variable:

VITE_NAKAMA_HOST=your-backend-domain

3. Ensure HTTPS connection (port 443)

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

# ⚙️ Server Configuration

- Default server key: `defaultkey`
- API Port: `7350`
- Console Port: `7351`

### Client Configuration Example

```js
const client = new Client(
  "defaultkey",
  "your-backend-domain",
  "443",
  true
);
```

---

# 🧪 Testing Multiplayer

1. Open the app in two browser tabs (or two devices)
2. Login as two different users
3. Create or join the same match
4. Play moves alternately

### Expected Behavior:
- Moves sync in real-time
- Turn enforcement is correct
- Invalid moves are rejected
- Winner is detected correctly
- Scoreboard updates after game ends

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
