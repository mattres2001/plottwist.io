import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    _id: { type: String, required: true },      // could be a short code
    code: { type: String, requried: true},
    hostId: { type: String, required: true },   // user who started the session
    players: [{ type: String, ref: 'User' }],  // list of user IDs
    document: { type: String, default: "" },   // optional: shared story/document
    status: { type: String, enum: ['waiting','active','ended'], default: 'waiting' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;