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
