import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express';
import sessionRouter from './routes/sessionRoutes.js';
import userRouter from './routes/userRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import { TURN_DURATION_SEC } from '../client/src/components/sessionConstants.js'
import Move from './models/Move.js';
import Session from './models/Session.js';
import Anthropic from '@anthropic-ai/sdk'

const app = express();
const server = http.createServer(app);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PORT = process.env.PORT || 4000;

// Websocket server
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

const sessions = {};

const startTurnLoop = (sessionCode) => {
  const session = sessions[sessionCode];
  if (!session) return;

  const emitTurn = () => {
    session.turnStartedAt = Date.now();

    io.to(sessionCode).emit("turn_update", {
      currentTurnIndex: session.currentTurnIndex,
      turnStartedAt: session.turnStartedAt,
      turnDuration: TURN_DURATION_SEC
    });
  };

  emitTurn();

  session.turnTimeout = setTimeout(function nextTurn() {
    const session = sessions[sessionCode];
    if (!session) return;

    session.currentTurnIndex =
      (session.currentTurnIndex + 1) % session.players.length;

    emitTurn();

    session.turnTimeout = setTimeout(nextTurn, TURN_DURATION_SEC * 1000);
  }, TURN_DURATION_SEC * 1000);
};

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ─── JOIN SESSION ─────────────────────────
    socket.on("join_session", ({ sessionCode, userId, username }) => {
        console.log(`${userId} joining ${sessionCode}`);

        if (!sessions[sessionCode]) {
            sessions[sessionCode] = {
                players: [],
                hostId: userId,
                currentTurnIndex: 0,
                turnStartedAt: Date.now()
            };
        }

        const session = sessions[sessionCode];

        // prevent duplicate users
        const exists = session.players.find(p => p.userId === userId);
        if (!exists) {
            session.players.push({
                userId,
                username,
                socketId: socket.id
            });
        }

        socket.join(sessionCode);

        // send updated players + hostId so every client knows who the host is
        io.to(sessionCode).emit(
            "players_updated",
            { players: session.players, hostId: session.hostId }
        );
    });

    // ─── LEAVE SESSION ────────────────────────
    socket.on("leave_session", ({ sessionCode, userId }) => {
        console.log(`${userId} leaving ${sessionCode}`);

        const session = sessions[sessionCode];
        if (!session) return;

        const leavingIndex = session.players.findIndex(
            p => p.userId === userId
        );

        session.players = session.players.filter(
            p => p.userId !== userId
        );

        if (session.hostId === userId && session.players.length > 0) {
            session.hostId = session.players[0].userId;
        }

        // ✅ adjust turn index
        if (leavingIndex <= session.currentTurnIndex) {
            session.currentTurnIndex =
                Math.max(0, session.currentTurnIndex - 1);
        }

        socket.leave(sessionCode);

        io.to(sessionCode).emit(
            "players_updated",
            { players: session.players, hostId: session.hostId }
        );

        if (session.players.length === 0) {
            delete sessions[sessionCode];
        }
    });

    // ─── START SESSION ────────────────────────
    socket.on("start_session", async (sessionCode) => {
        const session = sessions[sessionCode];
        if (!session) return;

        session.currentTurnIndex = 0;
        session.started = true;
        session.sessionStartedAt = Date.now();

        // Generate the script prompt before broadcasting session_started
        try {
            const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 60,
            messages: [{
                role: "user",
                content: `Generate a single creative screenplay prompt in this exact format:
                    "[GENRE]: [one sentence scenario]"
                    Example: "Horror: A family moves into a house that talks back"
                    Respond with only the prompt, nothing else.`
                }]
            })
            session.scriptPrompt = message.content[0].text.trim()
        } catch (err) {
            console.error("Failed to generate prompt:", err)
            session.scriptPrompt = "Drama: A chance encounter changes two strangers' lives forever"
        }

        io.to(sessionCode).emit("session_started", { 
            sessionStartedAt: session.sessionStartedAt,
            scriptPrompt: session.scriptPrompt 
        });

        startTurnLoop(sessionCode);
    });

    // ─── DISCONNECT ───────────────────────────
    socket.on("disconnect", () => {
        console.log("User disconnected, socket:", socket.id);

        for (const code in sessions) {
            const session = sessions[code];

            const player = session.players.find(
                p => p.socketId === socket.id
            );

            if (player) {
                session.players = session.players.filter(
                    p => p.socketId !== socket.id
                );

                if (session.hostId === player.userId && session.players.length > 0) {
                    session.hostId = session.players[0].userId;
                }

                io.to(code).emit(
                    "players_updated",
                    { players: session.players, hostId: session.hostId }
                );

                if (session.players.length === 0) {
                    delete sessions[code];
                }
            }
        }
    });

    // --- END TURN ------------------------
    socket.on("request_end_turn", ({ sessionCode }) => {
        const session = sessions[sessionCode];
        if (!session) return;

        clearTimeout(session.turnTimeout);

        session.currentTurnIndex =
            (session.currentTurnIndex + 1) % session.players.length;

        startTurnLoop(sessionCode);
    });

    // ─── SUBMIT MOVE ──────────────────────────
    socket.on("submit_move", async ({ sessionCode, userId, type, content }) => {
        const session = sessions[sessionCode];
        if (!session) return;

        try {
            // Cache the DB session ID so we only look it up once per session
            if (!session.dbSessionId) {
                const dbSession = await Session.findOne({ code: sessionCode });
                if (dbSession) session.dbSessionId = dbSession._id;
            }
            if (!session.dbSessionId) return;

            const move = await Move.create({ sessionId: session.dbSessionId, userId, type, content });

            // Broadcast to everyone in the room except the sender
            socket.to(sessionCode).emit("move_broadcast", {
                moveId: move._id,
                userId,
                type,
                content,
                timestamp: move.createdAt
            });
        } catch (err) {
            console.error("submit_move error:", err);
        }
    });

    // ─── REQUEST FULL STATE (reconnect / late join) ───────────────────────────
    socket.on("request_state", async ({ sessionCode }) => {
        const session = sessions[sessionCode];

        try {
            let dbSessionId = session?.dbSessionId;
            if (!dbSessionId) {
                const dbSession = await Session.findOne({ code: sessionCode });
                if (!dbSession) return socket.emit("state_sync", { moves: [], isActive: false });
                dbSessionId = dbSession._id;
                if (session) session.dbSessionId = dbSessionId;
            }

            const moves = await Move.find({ sessionId: dbSessionId }).sort({ createdAt: 1 });
            socket.emit("state_sync", {
                moves,
                isActive: !!session?.started,
                currentTurnIndex: session?.currentTurnIndex ?? 0,
                turnStartedAt: session?.turnStartedAt ?? Date.now(),
                hostId: session?.hostId ?? null,
                sessionStartedAt: session?.sessionStartedAt ?? null,
                scriptPrompt: session?.scriptPrompt ?? null
            });
        } catch (err) {
            console.error("request_state error:", err);
        }
    });

    socket.on("request_dialogue_suggestions", async ({ sessionCode, scriptContent, currentAct }) => {
        const session = sessions[sessionCode]
        if (!session) return

        try {
            const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 200,
            messages: [{
                role: "user",
                content: `You are helping players write a collaborative screenplay.
                    The prompt is: "${session.scriptPrompt}"
                    This is ${currentAct} of 3. ${currentAct === 'Act 1' ? 'Focus on establishing setting and introducing characters.' : currentAct === 'Act 2' ? 'Focus on rising tension and conflict.' : 'Focus on climax and resolution.'}
                    Here is the script so far:
                    ${scriptContent || '(nothing written yet)'}

                    Generate exactly 4 short lines of dialogue that the current character would naturally say next.
                    Each line should be 5-12 words, fit the tone, and feel like natural spoken dialogue.
                    Respond ONLY with a raw JSON array of 4 strings, no markdown, no code fences, no explanation. Example:
                    ["I never thought it would come to this.", "You don't understand what's at stake here.", "We need to leave. Right now.", "Tell me the truth. All of it."]`
                }]
            })

            const raw = message.content[0].text.trim()
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const suggestions = JSON.parse(cleaned)
            socket.emit("dialogue_suggestions", { suggestions })
        } catch (err) {
            console.error("request_dialogue_suggestions error:", err)
            socket.emit("dialogue_suggestions", {
                suggestions: [
                    "I never thought it would come to this.",
                    "You don't understand what's at stake here.",
                    "We need to leave. Right now.",
                    "Tell me the truth. All of it."
                ]
            })
        }
    })

    socket.on("request_action_suggestions", async ({ sessionCode, scriptContent, currentAct }) => {
        const session = sessions[sessionCode]
        if (!session) return

        try {
            const message = await anthropic.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 200,
                messages: [{
                    role: "user",
                    content: `You are helping players write a collaborative screenplay.
                        The prompt is: "${session.scriptPrompt}"
                        This is ${currentAct} of 3. ${currentAct === 'Act 1' ? 'Focus on establishing setting and introducing characters.' : currentAct === 'Act 2' ? 'Focus on rising tension and conflict.' : 'Focus on climax and resolution.'}
                        Here is the script so far:
                        ${scriptContent || '(nothing written yet)'}

                        Generate exactly 4 short action lines that would naturally continue this scene.
                        Each action should be 5-10 words, cinematic, and fit the tone.
                        Respond ONLY with a raw JSON array, no markdown, no code fences, no explanation.
                        Respond ONLY with a JSON array of 4 strings. Example:
                        ["John slams the door and walks away.", "The lights flicker and go dark.", "She picks up the phone and dials.", "A car screeches to a halt outside."]`
                    }]
            })

            const raw = message.content[0].text.trim()
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const suggestions = JSON.parse(cleaned)
            socket.emit("action_suggestions", { suggestions })
        } catch (err) {
            console.error("request_action_suggestions error:", err)
            socket.emit("action_suggestions", {
            suggestions: [
                "The door creaks open slowly.",
                "A shadow moves across the wall.",
                "Someone picks up the phone.",
                "Footsteps echo down the hallway."
            ]
            })
        }
    })

    socket.on("request_scene_suggestions", async ({ sessionCode, scriptContent, currentAct }) => {
        const session = sessions[sessionCode]
        if (!session) return

        try {
            const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 200,
                messages: [{
                    role: "user",
                    content: `You are helping players write a collaborative screenplay.
                        The prompt is: "${session.scriptPrompt}"
                        This is ${currentAct} of 3. ${currentAct === 'Act 1' ? 'Focus on establishing setting and introducing characters.' : currentAct === 'Act 2' ? 'Focus on rising tension and conflict.' : 'Focus on climax and resolution.'}
                        Here is the script so far:
                        ${scriptContent || '(nothing written yet)'}

                        Generate exactly 4 scene headings that would naturally continue this story.
                        Each must follow standard screenplay format: INT. or EXT., then location, then - DAY or - NIGHT.
                        Respond ONLY with a raw JSON array of 4 strings, no markdown, no code fences, no explanation. Example:
                        ["INT. ABANDONED WAREHOUSE - NIGHT", "EXT. HOSPITAL ROOFTOP - DAY", "INT. DOWNTOWN DINER - DAY", "EXT. FOREST CLEARING - NIGHT"]`
                }]
            })

            const raw = message.content[0].text.trim()
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const suggestions = JSON.parse(cleaned)
            socket.emit("scene_suggestions", { suggestions })
        } catch (err) {
            console.error("request_scene_suggestions error:", err)
            socket.emit("scene_suggestions", {
                suggestions: [
                    "INT. ABANDONED WAREHOUSE - NIGHT",
                    "EXT. HOSPITAL ROOFTOP - DAY",
                    "INT. DOWNTOWN DINER - DAY",
                    "EXT. FOREST CLEARING - NIGHT"
                ]
            })
        }
    })

    socket.on("request_character_suggestions", async ({ sessionCode, scriptContent, currentAct }) => {
        const session = sessions[sessionCode]
        if (!session) return

        try {
            const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{
                role: "user",
                content: `You are helping players write a collaborative screenplay.
                    The prompt is: "${session.scriptPrompt}"
                    This is ${currentAct} of 3. ${currentAct === 'Act 1' ? 'Focus on establishing setting and introducing characters.' : currentAct === 'Act 2' ? 'Focus on rising tension and conflict.' : 'Focus on climax and resolution.'}
                    Here is the script so far:
                    ${scriptContent || '(nothing written yet)'}

                    Generate exactly 4 character names that would fit naturally in this story.
                    Mix new characters with any already introduced in the script.
                    Each name should be 1-3 words, feel cinematic, and suit the genre.
                    Respond ONLY with a raw JSON array of 4 strings, no markdown, no code fences, no explanation. Example:
                    ["DETECTIVE HARRIS", "SARAH", "THE STRANGER", "DR. VOSS"]`
                }]
            })

            const raw = message.content[0].text.trim()
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const suggestions = JSON.parse(cleaned)
            socket.emit("character_suggestions", { suggestions })
        } catch (err) {
            console.error("request_character_suggestions error:", err)
            socket.emit("character_suggestions", {
                suggestions: ["DETECTIVE HARRIS", "SARAH", "THE STRANGER", "DR. VOSS"]
            })
        }
    })
});

export { io };

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(clerkMiddleware());

// Routes
app.get('/', (req, res) => res.send("Server is running"));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/session', sessionRouter);
app.use('/api/users', userRouter);

// Start server AFTER DB connects
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
    }
};

startServer();

