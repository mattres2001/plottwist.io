import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    authorId: [{type: String, ref: 'User', required: true}],
    sessionId: {type: String, ref: 'Session', required: true},
    promptId: {type: String, ref: 'Prompt'},
    title: {type: String},
    content: {type: String}
}, {timestamps: true, minimize: false});

const Document = mongoose.model('Document', documentSchema);

export default Document