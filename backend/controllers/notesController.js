const Note = require('../models/Note');
const fs = require('fs');

// @desc    Create a new note metadata mapped to specific user (instantly)
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    try {
        const { title, subject, semester } = req.body;

        if (!title || !subject || !semester) {
            return res.status(400).json({ message: 'Please add all required fields (title, subject, semester)' });
        }

        // Create the Note document in the database with empty file fields initially
        const note = await Note.create({
            title,
            subject,
            semester,
            fileData: '',
            fileName: '',
            pdfLink: '',
            userId: req.user.id
        });

        res.status(201).json({
            message: "Note metadata successfully created",
            note
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ message: 'Server error while creating note', error: error.message });
    }
};

// @desc    Upload note PDF file in the background and attach it to the note
// @route   POST /api/notes/:id/upload
// @access  Private
const uploadNoteFile = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Verify the logged-in user securely owns the note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to upload files for this note' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Read physical file and convert to Base64 asynchronously
        const filePath = req.file.path;
        const fileBuffer = await fs.promises.readFile(filePath);
        const fileData = fileBuffer.toString('base64');
        const fileName = req.file.originalname;

        // Clean up temporary local file asynchronously to save space
        try {
            await fs.promises.unlink(filePath);
        } catch (err) {
            console.error('Failed to clean up temp file:', err);
        }

        // Generate absolute pdfLink
        let protocol = req.protocol;
        if (req.headers['x-forwarded-proto']) {
            protocol = req.headers['x-forwarded-proto'];
        }
        const pdfLink = `${protocol}://${req.get('host')}/api/notes/${note._id}/view`;

        // Save PDF data to Note document
        note.fileData = fileData;
        note.fileName = fileName;
        note.pdfLink = pdfLink;
        await note.save();

        res.status(200).json({
            message: "PDF successfully uploaded for note",
            note
        });
    } catch (error) {
        console.error('Upload note file error:', error);
        res.status(500).json({ message: 'Server error while uploading PDF file', error: error.message });
    }
};

// @desc    Get all notes globally (so every user can see and download all notes)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ message: 'Server error while fetching notes' });
    }
};

// @desc    Filter through all notes globally (so every user can filter all notes)
// @route   GET /api/notes/filter
// @access  Private
const filterNotes = async (req, res) => {
    try {
        const { subject, semester } = req.query;
        
        // Base query targeting all notes
        let query = {};

        // Process conditional URL queries seamlessly 
        if (subject) query.subject = subject;
        if (semester) query.semester = semester;

        const filteredNotes = await Note.find(query).populate('userId', 'name email').sort({ createdAt: -1 });

        res.status(200).json(filteredNotes);
    } catch (error) {
        console.error('Filter notes error:', error);
        res.status(500).json({ message: 'Server error while filtering notes dynamically' });
    }
};

// @desc    Delete a specific note linked to token user
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Verify the logged-in user securely owns the note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this note' });
        }

        await note.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'Note successfully deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Server error while deleting note' });
    }
};

// @desc    Serve the actual PDF file from the database directly
// @route   GET /api/notes/:id/view
// @access  Private
const viewNoteFile = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.fileData) {
            return res.status(404).send('Note PDF file not found or has been deleted.');
        }

        // Decode Base64 string back to binary buffer
        const fileBuffer = Buffer.from(note.fileData, 'base64');

        // Set response headers to serve PDF natively in browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${note.fileName || 'note.pdf'}"`);

        res.send(fileBuffer);
    } catch (error) {
        console.error('Error viewing note file:', error);
        res.status(500).send('Server error retrieving file.');
    }
};

module.exports = {
    createNote,
    getNotes,
    filterNotes,
    deleteNote,
    viewNoteFile,
    uploadNoteFile
};
