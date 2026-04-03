import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true},
    hostId: { type: String, required: true },   // user who started the session
    players: [{ type: String, ref: 'User' }],  // list of user IDs
    document: { type: String, default: "" },   // optional: shared story/document
    status: { type: String, enum: ['waiting','active','ended'], default: 'waiting' }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;