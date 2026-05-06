import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true},
    hostId: { type: String, ref: 'User', required: true },
    players: [{ type: String, ref: 'User' }],
    status: { type: String, enum: ['waiting','active','ended'], default: 'waiting', required: true },
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;