const Note = require('../models/Note');

// @desc    Create a new note mapped to specific user
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    try {
        const { title, subject, semester } = req.body;

        if (!title || !subject || !semester) {
            return res.status(400).json({ message: 'Please add all required fields (title, subject, semester)' });
        }

        // Connect physical server file path explicitly if explicitly attached
        let pdfLink = '';
        if (req.file) {
            pdfLink = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        // Securely insert the note mapped strictly to the token-authenticated active user
        const note = await Note.create({
            title,
            subject,
            semester,
            pdfLink,
            userId: req.user.id
        });

        res.status(201).json({
            message: "Note successfully created",
            note
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ message: 'Server error while creating note' });
    }
};

// @desc    Get solely the logged-in user's personal notes 
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        // Enforces retrieving all Notes globally with populated creator names
        const notes = await Note.find().populate('userId', 'name email').sort({ createdAt: -1 });
        
        res.status(200).json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ message: 'Server error while fetching notes' });
    }
};

// @desc    Filter through all notes globally
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

module.exports = {
    createNote,
    getNotes,
    filterNotes,
    deleteNote
};
