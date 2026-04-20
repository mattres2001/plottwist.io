import { io } from 'socket.io-client'

export const socket = io(import.meta.env.VITE_BASEURL, {
    transports: ['websocket'],
    autoConnect: false // 👈 important
});

// Debug logs
socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("❌ Connection error:", err.message);
});