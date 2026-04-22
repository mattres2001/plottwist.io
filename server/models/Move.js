import mongoose from 'mongoose';

const moveSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    userId: { type: String, ref: 'User', required: true },
    type: { type: String, enum: ['SCENE', 'ACTION', 'CHARACTER', 'DIALOGUE', 'TRANSITION'], required: true },
    content: { type: String }
}, { timestamps: true });

const Move = mongoose.model('Move', moveSchema);

export default Move;
