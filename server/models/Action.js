import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // uuid from client

    sessionCode: {
        type: String,
        required: true,
        index: true
    },

    order: {
        type: Number,
        required: true // strictly increasing (server assigns)
    },

    userId: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ['SCENE', 'ACTION', 'CHARACTER', 'DIALOGUE', 'TRANSITION'],
        required: true
    },

    payload: {
        type: Object,
        required: true
        // Examples:
        // SCENE: { intExt, location, dayNight }
        // CHARACTER: { name }
        // DIALOGUE: { text }
        // ACTION: { text }
        // TRANSITION: { value }
    },

    turnIndex: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Number, // server timestamp (Date.now())
        required: true
    }

}, {
    minimize: false
});

const Action = mongoose.model('Action', actionSchema);

export default Action;