FROM node:alpine AS node-builder

WORKDIR /backend

COPY /backend/package*.json .
RUN npm install

COPY /backend/tsconfig.json .
COPY /backend/src/*.ts /backend/src/
RUN npx tsc

FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY /backend/local.yml /nakama/data/

ENTRYPOINT ["/bin/sh", "-ecx", \
  "/nakama/nakama migrate up --database.address $DATABASE_URL && \
  exec /nakama/nakama \
  --database.address $DATABASE_URL \
  --socket.address 0.0.0.0 \
  --runtime.js_entrypoint build/tictactoe.js \
  --logger.level INFO"]
