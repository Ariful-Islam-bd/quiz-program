// backend/server.js
// Version: 2.1.0 - Added Content API routes
// Changes: Registered /api/v1/content routes for academia content

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// ✅ Load env vars FIRST (before any other imports that need them)
dotenv.config();

// ✅ Validate environment (fail-fast if critical vars missing)
const { validateEnv } = require('./utils/config');
validateEnv();

// ✅ Now safe to import CORS config (uses env vars)
const { getCorsOptions, logCorsConfig } = require('./config/cors');

// ✅ Connect to MongoDB
connectDB();

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

// ============================================================
// ✅ CORS — Split architecture (Cloudflare Pages frontend)
// ============================================================
app.use(cors(getCorsOptions()));

// ✅ Handle Chrome Private Network Access (PNA) preflight
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Access-Control-Request-Private-Network');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return res.sendStatus(204);
    }
    next();
});

logCorsConfig();

// ============================================================
// ✅ Body parsers
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// ✅ Request logging (development only)
// ============================================================
if (isDev) {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.originalUrl}`);
        next();
    });
}

// ============================================================
// ✅ Health check endpoint (for UptimeRobot)
// ============================================================
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'quiz-program-backend',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ✅ Root endpoint (for quick manual check)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Quiz Program API is running.',
        version: '2.1.0',
        endpoints: {
            auth: '/api/v1/auth',
            quizzes: '/api/v1/quizzes',
            categories: '/api/v1/categories',
            uploads: '/api/v1/uploads',
            content: '/api/v1/content',
            health: '/api/v1/health'
        }
    });
});

// ============================================================
// ✅ API Routes
// ============================================================
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/quizzes', require('./routes/quizRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/uploads', require('./routes/uploadRoutes'));
app.use('/api/v1/content', require('./routes/contentRoutes'));  // ✅ NEW

// ============================================================
// ✅ 404 handler (API-only backend)
// ============================================================
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
        hint: 'The frontend is served separately at the Cloudflare Pages URL.'
    });
});

// ============================================================
// ✅ Global error handler (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// ✅ Start server
// ============================================================
const PORT = process.env.PORT || 5000;

// ✅ Bind to 0.0.0.0 — required for Render/Docker
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Mode: ${isDev ? 'Development' : 'Production'}`);
    console.log(`🌐 Backend URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    console.log(`🎨 Frontend URL: ${process.env.FRONTEND_URL || '(not set)'}`);
    console.log(`💚 Health check: /api/v1/health`);
    console.log(`📚 Content API: /api/v1/content`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
});

// ============================================================
// ✅ Graceful shutdown (Render sends SIGTERM on redeploy)
// ============================================================
const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('✅ HTTP server closed.');
        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
            console.log('✅ MongoDB connection closed.');
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================
// ✅ Unhandled errors
// ============================================================
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

module.exports = app;