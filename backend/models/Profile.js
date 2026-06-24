const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    skills: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    age: {
        type: Number
    },
    schooling: {
        type: String,
        default: ''
    },
    intermediate: {
        type: String,
        default: ''
    },
    extraProjects: {
        type: String,
        default: ''
    },
    experience: {
        type: String,
        default: ''
    },
    certifications: {
        type: String,
        default: ''
    },
    achievements: {
        type: String,
        default: ''
    },
    extracurricular: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
