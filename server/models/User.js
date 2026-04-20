import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    email: {type: String, required: true},
    username: {type: String, unique: true},
    profile_picture: {type: String, default: ''},
    scriptId: {type: String, ref: 'Document'}
    bio: { type: String, default: '' },
    favoriteGenre: { type: String, default: '' },
    location: { type: String, default: '' }
}, {timestamps: true, minimize: false});

const User = mongoose.model('User', userSchema);

export default User;