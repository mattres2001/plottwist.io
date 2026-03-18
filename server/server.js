import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js'
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express';
import sessionRouter from './routes/sessionRoutes.js'
// import { handleClerkWebhook } from './routes/webhookClerk.js';


const app = express();

await connectDB();

// app.post("/webhooks/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send("Server is running"));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/session', sessionRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`))
