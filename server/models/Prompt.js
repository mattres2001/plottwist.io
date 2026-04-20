import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    sessionId: {type: String, ref: 'Session', required: true},
    content: {type: String, required: true},
    genre: {type: String, required: true}
}, {timestamps: true, minimize: false});

const Prompt = mongoose.model('Prompt', promptSchema);

export default Prompt