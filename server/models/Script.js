import mongoose from 'mongoose';

const scriptSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
    content: { type: String, required: true },
    prompt: { type: String },
    players: [{ type: String, ref: 'User' }],
    averageRating: { type: Number, default: null },
    ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

const Script = mongoose.model('Script', scriptSchema);

export default Script;
