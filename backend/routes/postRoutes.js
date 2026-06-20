const express = require('express');
const router = express.Router();

const { createPost, getPosts, addReply, deleteReply, deletePost, likePost } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// Define security explicitly and sequentially connect the specific routes
router.post('/', authMiddleware, createPost);
router.get('/', authMiddleware, getPosts);
router.post('/:id/reply', authMiddleware, addReply);
router.delete('/:postId/reply/:replyId', authMiddleware, deleteReply);
router.delete('/:id', authMiddleware, deletePost);
router.put('/:id/like', authMiddleware, likePost);

module.exports = router;
