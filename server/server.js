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

const app = express();
const server = http.createServer(app);

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

        // send updated players
        io.to(sessionCode).emit(
            "players_updated",
            session.players
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

        // ✅ adjust turn index
        if (leavingIndex <= session.currentTurnIndex) {
            session.currentTurnIndex =
                Math.max(0, session.currentTurnIndex - 1);
        }

        socket.leave(sessionCode);

        io.to(sessionCode).emit(
            "players_updated",
            session.players
        );

        if (session.players.length === 0) {
            delete sessions[sessionCode];
        }
    });

    // ─── START SESSION ────────────────────────
    socket.on("start_session", (sessionCode) => {
        const session = sessions[sessionCode];
        if (!session) return;

        session.currentTurnIndex = 0;

        io.to(sessionCode).emit("session_started");

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

                io.to(code).emit(
                    "players_updated",
                    session.players
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

