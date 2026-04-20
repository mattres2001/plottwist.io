import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js'
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express';
import sessionRouter from './routes/sessionRoutes.js'
import http from 'http'
import { Server } from 'socket.io'

const app = express();
const server = http.createServer(app)

const PORT = process.env.PORT || 4000;

// Websocket server
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

const sessions = {};

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ─── JOIN SESSION ─────────────────────────
    socket.on("join_session", ({ sessionCode, userId, username }) => {
        console.log(`${userId} joining ${sessionCode}`);

        if (!sessions[sessionCode]) {
            sessions[sessionCode] = {
                players: [],
                hostId: userId,
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

        session.players = session.players.filter(
            p => p.userId !== userId
        );

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
        console.log("Starting session:", sessionCode);

        const session = sessions[sessionCode];
        if (!session) return;

        io.to(sessionCode).emit("session_started");
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
                    session.players.map(p => p.userId)
                );

                if (session.players.length === 0) {
                    delete sessions[code];
                }
            }
        }
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

