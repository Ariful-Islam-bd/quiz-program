// backend/config/cors.js
// Version: 1.0.0 - Centralized CORS configuration
// Purpose: Allow requests from Cloudflare Pages frontend + localhost dev

/**
 * Allowed origins — add your Cloudflare Pages URL here
 * In production, FRONTEND_URL env var will be used (comma-separated for multiple)
 */
const getAllowedOrigins = () => {
    const envOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

    // Development fallbacks
    const devOrigins = [
        'http://localhost:5000',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:3000'
    ];

    // Production origins (from env) take priority
    // Always include dev origins for local testing
    const combined = [...new Set([...envOrigins, ...devOrigins])];

    return combined;
};

/**
 * CORS options object (for `cors` middleware)
 */
const getCorsOptions = () => {
    const allowedOrigins = getAllowedOrigins();

    return {
        origin: (origin, callback) => {
            // ✅ Allow requests with no origin (curl, Postman, mobile apps)
            if (!origin) {
                return callback(null, true);
            }

            // ✅ Allow if origin is in whitelist
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // ✅ Allow any *.pages.dev subdomain (Cloudflare Pages preview deployments)
            if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) {
                return callback(null, true);
            }

            // ✅ Allow any *.onrender.com subdomain (Render preview deployments)
            if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) {
                return callback(null, true);
            }

            // ❌ Reject unknown origins
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
            'Cache-Control',
            'Pragma',
            'Access-Control-Request-Private-Network'
        ],
        exposedHeaders: ['Content-Length', 'X-Request-Id'],
        maxAge: 86400, // 24 hours — preflight cache
        optionsSuccessStatus: 200
    };
};

/**
 * Log current CORS configuration (for debugging)
 */
const logCorsConfig = () => {
    const origins = getAllowedOrigins();
    console.log('🌐 CORS allowed origins:');
    origins.forEach((origin) => console.log(`   • ${origin}`));
    console.log('   • *.pages.dev (auto-allowed)');
    console.log('   • *.onrender.com (auto-allowed)');
};

module.exports = {
    getCorsOptions,
    getAllowedOrigins,
    logCorsConfig
};