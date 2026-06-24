const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Note title is required']
        },
        subject: {
            type: String,
            required: [true, 'Subject is required']
        },
        semester: {
            type: String,
            required: [true, 'Semester is required']
        },
        pdfLink: {
            type: String
        },
        fileData: {
            type: String // Base64 encoded file data
        },
        fileName: {
            type: String // Original file name
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { 
        timestamps: true 
    }
);

module.exports = mongoose.model('Note', noteSchema);
