const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createNote, getNotes, filterNotes, deleteNote, viewNoteFile } = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');

const fs = require('fs');

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure robust disk storage allocating file boundaries natively
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Enforce specific security parameters explicitly allowing PDFs ONLY
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB cutoff Limit
    fileFilter: function(req, file, cb) {
        if(file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only exclusively PDF files are authorized!'), false);
        }
    }
});

// Bind Multer middleware handling explicit multipart/form-data natively 
router.post('/', authMiddleware, upload.single('pdfFile'), createNote);
router.get('/', authMiddleware, getNotes);
router.get('/filter', authMiddleware, filterNotes);
router.get('/:id/view', authMiddleware, viewNoteFile);
router.delete('/:id', authMiddleware, deleteNote);

module.exports = router;
