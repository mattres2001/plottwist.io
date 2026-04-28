import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true},
    hostId: { type: String, ref: 'User', required: true },   // user who started the session
    players: [{ type: String, ref: 'User' }],  // list of user IDs
    status: { type: String, enum: ['waiting','active','ended'], default: 'waiting', required: true },
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;