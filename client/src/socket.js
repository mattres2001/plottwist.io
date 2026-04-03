import { io } from 'socket.io-client'

export const socket = io('http://localhost:4000', {
    transports: ['websocket']
});

// 🔥 ADD THESE
socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("❌ Connection error:", err.message);
});