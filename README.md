# TicTacToe Nakama

A cross-device TicTacToe game built with React + TypeScript frontend and Nakama runtime backend.

## Project structure

- `frontend/`: React + Vite app
- `backend/`: Nakama module source and compiled build
- `docker-compose.yml`: local Nakama + PostgreSQL setup

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Backend setup

1. Install Docker and Docker Compose
2. Start Nakama + Postgres

```bash
docker compose up -d
```

3. Build backend module (TypeScript → JS), then mount in Nakama config

```bash
cd backend
npm install
# ensure build outputs build/tictactoe.js
npm run build
```

4. Configure Nakama to load the runtime module (usually in `nakama/modules.yml` or `nakama.yml`) with `build/tictactoe.js`.

## Default flow

1. Login screen
2. Matchmaking -> game
3. Game ends -> leaderboard
4. Play again/cancel

## Scoreboard + leaderboard

- Backend stores scores in Nakama storage
- Uses Nakama leaderboard API `leaderboardRecordWrite` + `leaderboardRecordsList`
- Tie score ordering by first score timestamp (`reachedAt`)

## Deployment recommendations

- Frontend: Netlify / Vercel / Cloudflare Pages
- Backend: Docker + VPS / Fly.io / Railway (if supported for custom containers) / local Docker

## Notes

- `requirements.txt` included for compatibility but this project is Node-based.
- Set environment variable `VITE_NAKAMA_HOST` before deployment to point to the Nakama host.
