
// backend/config/constants.js
// Version: 2.0.0 - Backend-safe constants (no browser APIs)
// FIX: Removed window.location usage (backend has no window object)

// ============================================================
// ✅ Backend API base URL — derived from environment
// ============================================================
const getBackendBaseURL = () => {
    // Priority 1: Explicit env var
    if (process.env.BACKEND_URL) {
        return process.env.BACKEND_URL;
    }

    // Priority 2: Render auto-detects its public URL
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }

    // Priority 3: Localhost development
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}`;
};

// ============================================================
// ✅ Frontend base URL — where the SPA lives (Cloudflare Pages in prod)
// ============================================================
const getFrontendBaseURL = () => {
    if (process.env.FRONTEND_URL) {
        // If comma-separated, use the first one
        return process.env.FRONTEND_URL.split(',')[0].trim();
    }
    return 'http://localhost:5000';
};

module.exports = {
    // User Roles
    USER_ROLES: {
        ACADEMIC: 'academic',
        NON_ACADEMIC: 'non-academic',
        ADMIN: 'admin'
    },

    // Question Types
    QUESTION_TYPES: {
        MCQ: 'MCQ',
        BLANK_TYPE_A: 'Blank-Type-A',
        BLANK_TYPE_B: 'Blank-Type-B',
        BLANK_SUFFIX_PREFIX: 'Blank-Suffix-Prefix',
        SENTENCE_REARRANGING: 'Sentence-Rearranging',
        MATCHING: 'Matching'
    },

    // Answer Status
    ANSWER_STATUS: {
        CORRECT: 'correct',
        WRONG: 'wrong',
        SKIPPED: 'skipped',
        TIMED_OUT: 'timed_out',
        UNANSWERED: 'unanswered'
    },

    // Difficulty Levels
    DIFFICULTY_LEVELS: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },

    // HTTP Status Codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER: 500
    },

    // Timer Defaults
    TIMER: {
        DEFAULT_PER_QUESTION: 60,
        MIN_PER_QUESTION: 10,
        MAX_PER_QUESTION: 90,
        STEP: 5
    },

    // ✅ URL helpers (backend-safe)
    getBackendBaseURL,
    getFrontendBaseURL
};