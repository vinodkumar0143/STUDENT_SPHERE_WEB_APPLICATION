const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createNote, getNotes, filterNotes, deleteNote } = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure robust disk storage allocating file boundaries natively
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
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
router.delete('/:id', authMiddleware, deleteNote);

module.exports = router;
