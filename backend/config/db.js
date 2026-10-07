/* File: backend/config/db.js
   Version: 2.0.0 - Mongoose 9.x compatible
   Description: MongoDB Connection using Mongoose (production-grade)
*/

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // ✅ Mongoose 7+ automatically handles these options
        // No need for: useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10s timeout
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 (some cloud providers have IPv6 issues)
            maxPoolSize: 10, // Connection pool
            minPoolSize: 2
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // ✅ Connection event handlers
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected.');
        });

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        // ✅ Don't exit immediately in production (Render handles restarts)
        if (process.env.NODE_ENV === 'production') {
            console.error('⚠️ Retrying in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;