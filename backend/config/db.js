const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to always prefer IPv4 addresses when resolving hostnames.
// This fixes the 'querySrv ECONNREFUSED' crash on Windows with MongoDB Atlas SRV URIs.
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        // Fix for Node.js "ECONNREFUSED" DNS SRV resolution issues on some ISP networks
        // Let Windows/OS handle native resolution instead of forcing Google DNS

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4 // Force IPv4 routing to bypass Windows/ISP DNS SRV packet drops explicitly resolving ECONNREFUSED/ETIMEOUTs
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
