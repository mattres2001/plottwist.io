import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js'
import { handleClerkWebhook } from './routes/webhookClerk.js';

const app = express();

await connectDB();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send("Server is running"));
app.post('/webhooks/clerk', handleClerkWebhook); // Clerk webhook endpoint

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`))
