import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String, required: true},
    full_name: {type: String, required: true},
    username: {type: String, unique: true},
    profile_picture: {type: String, default: ''}
}, {timestamps: true, minimize: false});

const User = mongoose.model('User', userSchema);

export default User