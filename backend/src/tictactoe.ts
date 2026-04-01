///<reference path="../node_modules/nakama-runtime/index.d.ts" />

// ---- Types ----
interface MatchState {
	board: Array<string | null>;
	marks: { [userId: string]: "X" | "O" };
	usernames: { [userId: string]: string };
	turn: string; 
	winner: string | null;
	draw: boolean;
	ticksEmpty: number; // how many ticks with no players (for cleanup)
}

// Message opcodes
const OP_CODE_MOVE = 1;
const OP_CODE_STATE = 2;
const OP_CODE_GAME_OVER = 3;
const OP_CODE_SYNC = 4;

const SCORE_STORAGE_COLLECTION = "tictactoe_scores";
const SCORE_STORAGE_KEY = "global";
const LEADERBOARD_ID = "tictactoe_global";

interface ScoreRecord {
	score: number;
	username: string;
}

function readScoreboard(nk: nkruntime.Nakama, logger: nkruntime.Logger,): { [userId: string]: ScoreRecord } {
	try {
		const readRequest: any = {
			collection: SCORE_STORAGE_COLLECTION,
			key: SCORE_STORAGE_KEY,
		};
		const objs = nk.storageRead([readRequest]);
		if (objs.length > 0) {
			const value = objs[0].value;
			if (value && typeof value === "object") {
				return value as { [userId: string]: ScoreRecord };
			}
			logger.warn("Scoreboard storage found but value is not an object.");
		}
	} catch (e) {
		logger.warn("Unable to read scoreboard storage: " + e);
	}
	return {};
}

function writeScoreboard(nk: nkruntime.Nakama, logger: nkruntime.Logger, scoreboard: { [userId: string]: ScoreRecord },) {
	try {
		const writeRequest: any = {
			collection: SCORE_STORAGE_COLLECTION,
			key: SCORE_STORAGE_KEY,
			value: scoreboard,
			permissionRead: 2,
			permissionWrite: 1,
		};
		const acks = nk.storageWrite([writeRequest]);
		if (!acks || acks.length === 0) {
			logger.warn("Storage write completed with no acks.");
		} else {
			logger.info(`Wrote scoreboard storage: ${acks.length} ack(s)`);
		}
	} catch (e) {
		logger.error("Unable to write scoreboard storage: " + e);
	}
}

function writeLeaderboardRecord(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, username: string, score: number) {
	const server = nk as any;
	try {
		const metadata = {
			username,
			reachedAt: Date.now(),
		};
		server.leaderboardRecordWrite(LEADERBOARD_ID, score, 0, metadata);
		logger.info(`Leaderboard record written for ${username}: ${score}`);
	} catch (e) {
		logger.warn("Unable to write leaderboard record: " + e);
	}
}

function updateScoreboard(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, username: string | undefined) {
	const scoreboard = readScoreboard(nk, logger);
	const record = scoreboard[userId] || { score: 0, username: username || userId };
	record.score += 1;
	record.username = username || record.username || userId;
	scoreboard[userId] = record;
	writeScoreboard(nk, logger, scoreboard);
	writeLeaderboardRecord(nk, logger, userId, record.username, record.score);
	logger.info(`Scoreboard updated for ${record.username}: ${record.score}`);
	return scoreboard;
}

// ---- Win detection ----
const WIN_LINES = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8], // rows
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8], // cols
	[0, 4, 8],
	[2, 4, 6], // diagonals
];

function checkWinner(board: Array<string | null>): string | null {
	for (const [a, b, c] of WIN_LINES) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a]!; // returns "X" or "O"
		}
	}
	return null;
}

function checkDraw(board: Array<string | null>): boolean {
	return board.every((cell) => cell !== null);
}

// ---- Match handlers ----

const matchInit: nkruntime.MatchInitFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string },) {
	const state: MatchState = {
		board: Array(9).fill(null),
		marks: {},
		usernames: {},
		turn: "",
		winner: null,
		draw: false,
		ticksEmpty: 0,
	};

	logger.info("Match created");

	return {
		state,
		tickRate: 1, // matchLoop runs once per second — fine for turn-based
		label: "tictactoe",
	};
};

const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    presence: nkruntime.Presence,
    metadata: { [key: string]: any },
) {
    const s = state as MatchState;
    logger.info(`matchJoinAttempt: user=${presence.userId}, currentPlayers=${Object.keys(s.marks).length}`);

    const playerCount = Object.keys(s.marks).length;
    if (s.marks[presence.userId]) {
        return {
            state: s,
            accept: false,
            rejectMessage: "User already joined this match",
        };
    }

    if (playerCount >= 2) {
        return { state: s, accept: false, rejectMessage: "Match is full" };
    }

    if (s.winner || s.draw) {
        return { state: s, accept: false, rejectMessage: "Match already finished" };
    }

    logger.info(`matchJoinAttempt metadata: ${JSON.stringify(metadata)}`);
    return { state: s, accept: true };
};

const matchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[],) {
	const s = state as MatchState;

	for (const presence of presences) {
		const playerCount = Object.keys(s.marks).length;
		// First player gets X, second gets O
		s.marks[presence.userId] = playerCount === 0 ? "X" : "O";
		s.usernames[presence.userId] = presence.username || presence.userId;
		logger.info(
			`Player ${presence.userId} joined as ${s.marks[presence.userId]}`,
		);
	}

	if (Object.keys(s.marks).length === 2) {
        s.turn = Object.keys(s.marks).find((id) => s.marks[id] === "X")!;
        logger.info("Both players joined, game starting");

        // Tell both players the initial state
        const stateMsg = JSON.stringify({
            board: s.board,
            marks: s.marks,
            turn: s.turn,
            winner: null,
            draw: false,
        });
        dispatcher.broadcastMessage(OP_CODE_STATE, stateMsg, null, null, true);
	}

	return { state: s };
};

const matchLoop: nkruntime.MatchLoopFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    messages: nkruntime.MatchMessage[],
) {
    const s = state as MatchState;

    // No players — terminate after 10 seconds
    if (Object.keys(s.marks).length === 0) {
        s.ticksEmpty++;
        if (s.ticksEmpty >= 10) return null; // null = end the match
        return { state: s };
    }

    // Game already over — nothing to process
    if (s.winner || s.draw) return { state: s };

    // Process incoming messages
    for (const msg of messages) {
        // Request for the current state (client sync request)
        if (msg.opCode === OP_CODE_SYNC) {
            const stateMsg = JSON.stringify({
                board: s.board,
                marks: s.marks,
                turn: s.turn,
                winner: s.winner,
                draw: s.draw,
            });

            dispatcher.broadcastMessage(
                OP_CODE_STATE,
                stateMsg,
                [msg.sender],
                null,
                true,
            );
            continue;
        }

        // Only process move messages
        if (msg.opCode !== OP_CODE_MOVE) continue;

        // Parse what the client sent
        let move: { position: number };
        try {
            move = JSON.parse(nk.binaryToString(msg.data));
        } catch (e) {
            logger.warn("Invalid move message from " + msg.sender.userId);
            continue;
        }

        const { position } = move;

        // --- Validations (this is the server-authoritative part) ---

        // Is it this player's turn?
        if (msg.sender.userId !== s.turn) {
            logger.warn(`Rejected: not ${msg.sender.userId}'s turn`);
            continue;
        }

        // Is position valid?
        if (position < 0 || position > 8) {
            logger.warn("Rejected: position out of range");
            continue;
        }

        // Is cell empty?
        if (s.board[position] !== null) {
            logger.warn("Rejected: cell already taken");
            continue;
        }

        // --- Apply the move ---
        const mark = s.marks[msg.sender.userId];
        s.board[position] = mark;

        // Check for winner or draw
        const winnerMark = checkWinner(s.board);
        if (winnerMark) {
            // Find the userId who has this mark
            s.winner = Object.keys(s.marks).find((id) => s.marks[id] === winnerMark)!;
        } else if (checkDraw(s.board)) {
            s.draw = true;
        } else {
            // Switch turns
            s.turn = Object.keys(s.marks).find((id) => id !== msg.sender.userId)!;
        }

        // Broadcast new state to both players
        const stateMsg = JSON.stringify({
            board: s.board,
            marks: s.marks,
            turn: s.turn,
            winner: s.winner,
            draw: s.draw,
        });
        dispatcher.broadcastMessage(OP_CODE_STATE, stateMsg, null, null, true);

        // If game over, send a separate game over message
        if (s.winner || s.draw) {
            const gameOverMsg = JSON.stringify({
                winner: s.winner,
                draw: s.draw,
                marks: s.marks,
            });

            dispatcher.broadcastMessage(
                OP_CODE_GAME_OVER,
                gameOverMsg,
                null,
                null,
                true,
            );

            if (s.winner) {
                updateScoreboard(
                    nk,
                    logger,
                    s.winner,
                    s.usernames[s.winner],
                );
            }
            logger.info(`Game over — winner: ${s.winner}, draw: ${s.draw}`);
        }
    }

    return { state: s };
};

const matchLeave: nkruntime.MatchLeaveFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    presences: nkruntime.Presence[],
) {
    const s = state as MatchState;
    for (const presence of presences) {
        logger.info(`Player ${presence.userId} left`);
        // If someone leaves mid-game, the other player wins
        if (!s.winner && !s.draw) {
            s.winner = Object.keys(s.marks).find((id) => id !== presence.userId) || null;
            if (s.winner) {
                const gameOverMsg = JSON.stringify({
                    winner: s.winner,
                    draw: false,
                    reason: "opponent_left",
                    marks: s.marks,
                });
                
                dispatcher.broadcastMessage(
                    OP_CODE_GAME_OVER,
                    gameOverMsg,
                    null,
                    null,
                    true,
                );

                updateScoreboard(
                    nk,
                    logger,
                    s.winner,
                    s.usernames[s.winner],
                );
            }
        }
    }
    return { state: s };
};

const matchTerminate: nkruntime.MatchTerminateFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    graceSeconds: number,
) {
    return { state };
};

const matchSignal: nkruntime.MatchSignalFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
) {
    return { state };
};

const createMatch: nkruntime.RpcFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string,
): string {
    const matchId = nk.matchCreate("tictactoe", {});
    logger.info("=== match created: " + matchId + " ===");
    return JSON.stringify({ matchId });
};

const getLeaderboard: nkruntime.RpcFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string,
): string {
    logger.info("=== getLeaderboard RPC called ===");
    let limit = 10;
    try {
        const params = payload ? JSON.parse(payload) : {};
        if (typeof params.limit === "number") {
            limit = params.limit;
        }
    } catch (e) {
        logger.warn("Invalid leaderboard payload, using default limit");
    }

    const server = nk as any;
    let records: any[] = [];

    try {
        const leaderboardResult = server.leaderboardRecordsList(LEADERBOARD_ID, limit, null);
        const rawRecords = Array.isArray(leaderboardResult)
            ? leaderboardResult
            : leaderboardResult?.records || [];

        for (const rec of rawRecords) {
            const metadata = rec?.metadata && typeof rec.metadata === "object" ? rec.metadata : {};
            records.push({
                owner_id: rec.owner_id,
                username: metadata.username || rec.owner_id,
                score: rec.score || 0,
                reachedAt: typeof metadata.reachedAt === "number" ? metadata.reachedAt : 0,
            });
        }
    } catch (e) {
        logger.warn("Unable to read leaderboard records, falling back to storage: " + e);
        const scoreboard = readScoreboard(nk, logger);
        for (const owner_id in scoreboard) {
            if (Object.prototype.hasOwnProperty.call(scoreboard, owner_id)) {
                const record = scoreboard[owner_id];
                records.push({
                    owner_id,
                    username: record.username,
                    score: record.score,
                    reachedAt: 0,
                });
            }
        }
    }

    records.sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const timeDiff = (a.reachedAt || 0) - (b.reachedAt || 0);
        if (timeDiff !== 0) return timeDiff;
        const nameA = a.username || "";
        const nameB = b.username || "";
        const nameDiff = nameA.localeCompare(nameB);
        if (nameDiff !== 0) return nameDiff;
        return a.owner_id.localeCompare(b.owner_id);
    });
    logger.info(`Leaderboard returning ${records.length} record(s)`);

    return JSON.stringify({ records: records.slice(0, limit) });
};

const matchmakerMatched: nkruntime.MatchmakerMatchedFunction = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    matches: nkruntime.MatchmakerResult[],
): string {
    logger.info("=== matchmakerMatched called, creating authoritative match ===");
    // This tells Nakama to create an authoritative match using our handler
    const matchId = nk.matchCreate("tictactoe", {});
    logger.info("=== matchmaker created match: " + matchId + " ===");
    return matchId;
};

// ---- Register everything with Nakama ----
// This is the entry point — Nakama calls InitModule on startup
function InitModule(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    initializer: nkruntime.Initializer,
): Error {
    logger.info("=== InitModule START ===");

    try {
        initializer.registerRpc("create_match", createMatch);
        initializer.registerRpc("get_leaderboard", getLeaderboard);
        logger.info("=== RPC registered ===");
    } catch (e) {
        logger.error("RPC register failed: " + e);
    }

    try {
        initializer.registerMatch("tictactoe", {
            matchInit,
            matchJoinAttempt,
            matchJoin,
            matchLeave,
            matchLoop,
            matchTerminate,
            matchSignal,
        });
        logger.info("=== Match registered ===");
    } catch (e) {
        logger.error("Match register failed: " + e);
    }

    try {
        initializer.registerMatchmakerMatched(matchmakerMatched);
        logger.info("=== Matchmaker registered ===");
    } catch (e) {
        logger.error("Matchmaker register failed: " + e);
    }

    logger.info("=== InitModule END ===");

    return null as any;
}

// DO NOT touch globalThis — Nakama finds InitModule by scanning for the function name
// @ts-ignore
!InitModule && InitModule.bind(null);
