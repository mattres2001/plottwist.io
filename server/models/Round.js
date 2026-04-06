import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    sessionId: {type: String, ref: 'Document', required: true},
    content: {type: String}
}, {timestamps: true, minimize: false});

const Round = mongoose.model('Round', roundSchema);

export default Round