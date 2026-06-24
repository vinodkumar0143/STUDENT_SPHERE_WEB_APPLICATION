// Force Google DNS 8.8.8.8 — local Windows DNS refuses SRV record lookups for MongoDB Atlas
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Securely map local storage bucket for frontend fetching explicitly
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// Connect Database
connectDB().then(() => {
    // Start Server only after DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// Route Files
const authRoutes = require('./routes/authRoutes');
const notesRoutes = require('./routes/notesRoutes');
const postRoutes = require('./routes/postRoutes');
const profileRoutes = require('./routes/profileRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Base Route
app.get('/', (req, res) => {
    res.send('API Running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler to catch Multer and other uncaught errors
app.use((err, req, res, next) => {
    console.error('Express Global Error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'An unexpected server error occurred.' });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
