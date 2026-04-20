import mongoose from 'mongoose';

const moveSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    userId: {type: String, ref: 'User', required: true},
    type: {type: String, enum: ['Dialogue', 'Character', 'Scene', 'Action'], required: true},
    content: {type: String}
}, {timestamps: true, minimize: false});

const Round = mongoose.model('Round', roundSchema);

export default Round