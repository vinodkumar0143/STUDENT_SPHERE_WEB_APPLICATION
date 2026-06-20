const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    let token;

    // Check if authorization header strictly exists containing a Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the secure token string from header
            token = req.headers.authorization.split(' ')[1];

            // Verify and decode token via JWT SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Bind the decoded secure userId to the Request object directly
            req.user = { id: decoded.userId };

            next();
        } catch (error) {
            console.error('Secure Middleware JWT Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no securely provided token' });
    }
};

module.exports = authMiddleware;
