import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true},
    hostId: { type: String, ref: 'User', required: true },   // user who started the session
    players: [{ type: String, ref: 'User' }],  // list of user IDs
    documentId: { type: String, ref: 'Document' },   // optional: shared story/document
    status: { type: String, enum: ['waiting','active','ended'], default: 'waiting', required: true },
    roundId: [{type: String, ref: 'Round'}],
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;