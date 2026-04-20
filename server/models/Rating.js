import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    documentId: {type: String, ref: 'Document', required: true},
    userId: {type: String, ref: 'User', required: true},
    score: {type: Number, required: true}
}, {timestamps: true, minimize: false});

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating