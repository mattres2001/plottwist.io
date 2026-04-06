import mongoose from 'mongoose';

const storyboardSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    documentId: {type: String, ref: 'Document', required: true},
    frames: [{
        generatePrompt: {type: String, required: true},
        imageUrl: {type: String, required: true},
        sceneLabel: {type: String}
    }]
}, {timestamps: true, minimize: false});

const Storyboard = mongoose.model('Storyboard', storyboardSchema);

export default Storyboard