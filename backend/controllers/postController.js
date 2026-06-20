const Post = require('../models/Post');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }

        const post = new Post({
            title,
            description,
            userId: req.user.id // Extract user logically via JWT payload
        });

        const createdPost = await post.save();
        res.status(201).json(createdPost);
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Server Error while creating post' });
    }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
    try {
        // Fetch all posts and sort by latest dynamically
        const posts = await Post.find()
            .populate('userId', 'name')
            .populate('replies.userId', 'name')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Fetch Posts Error:', error);
        res.status(500).json({ message: 'Server Error while fetching posts' });
    }
};

// @desc    Add a reply to a post
// @route   POST /api/posts/:id/reply
// @access  Private
const addReply = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ message: 'Reply text is required.' });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Add reply logic securely linking user to response body payload
        const reply = {
            text,
            userId: req.user.id, // User ID handled properly mapping token
            createdAt: new Date()
        };

        // Append embedded document directly onto parent schema explicitly
        post.replies.push(reply);

        await post.save();

        res.status(201).json({ message: 'Reply securely added.', post });
    } catch (error) {
        console.error('Add Reply Error:', error);
        res.status(500).json({ message: 'Server Error while adding reply' });
    }
};

// @desc    Delete a reply
// @route   DELETE /api/posts/:postId/reply/:replyId
// @access  Private
const deleteReply = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Find the reply
        const reply = post.replies.id(req.params.replyId);
        
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found.' });
        }

        // Removed ownership check per user request so anyone can delete any reply
        // Remove the reply
        post.replies.pull(req.params.replyId);
        await post.save();

        res.json({ message: 'Reply removed' });
    } catch (error) {
        console.error('Delete Reply Error:', error);
        res.status(500).json({ message: 'Server Error while deleting reply' });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Removed ownership check per user request so anyone can delete any post
        await Post.findByIdAndDelete(req.params.id);

        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ message: 'Server Error while deleting post' });
    }
};

// @desc    Like or unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Check if the post has already been liked by this user
        if (post.likes.includes(req.user.id)) {
            // Unlike it
            post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        } else {
            // Like it
            post.likes.push(req.user.id);
        }

        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error('Like Post Error:', error);
        res.status(500).json({ message: 'Server Error while liking post' });
    }
};

module.exports = {
    createPost,
    getPosts,
    addReply,
    deleteReply,
    deletePost,
    likePost
};
