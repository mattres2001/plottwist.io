import mongoose from 'mongoose';

const storyboardSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    roundId: {type: String, ref: 'Round', required: true},
    frames: [{
        generatePrompt: {type: String, required: true},
        imageUrl: {type: String, required: true},
        sceneLabel: {type: String}
    }]
}, {timestamps: true, minimize: false});

const Storyboard = mongoose.model('Storyboard', storyboardSchema);

export default Storyboard