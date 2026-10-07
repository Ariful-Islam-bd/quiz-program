// frontend/js/utils/constants.js
// Version: 2.0.0 - Split architecture ready (no hardcoded URLs)
// Purpose: Frontend constants + runtime config integration

// ============================================================
// ✅ Import runtime config service (loads API URL from config.json)
// ============================================================
import { getApiBaseUrl, loadRuntimeConfig } from './runtimeConfig.js';

// ============================================================
// ✅ API Base URL — resolves dynamically from runtime config
// ============================================================
/**
 * Get current API base URL.
 * Returns from runtime config (loaded from config.json).
 * Falls back to localhost if config not loaded yet.
 */
export const getApiBase = () => {
    return getApiBaseUrl();
};

// ✅ Legacy compatibility: Some old code may reference API_BASE_URL directly.
// This is a getter-like constant that returns the current value.
// ⚠️ Prefer `getApiBase()` in new code.
export const API_BASE_URL = {
    toString: () => getApiBase(),
    valueOf: () => getApiBase()
};

// ============================================================
// ✅ Question Types (unchanged)
// ============================================================
export const QUESTION_TYPES = {
    MCQ: 'MCQ',
    BLANK_TYPE_A: 'Blank-Type-A',
    BLANK_TYPE_B: 'Blank-Type-B',
    BLANK_SUFFIX_PREFIX: 'Blank-Suffix-Prefix',
    SENTENCE_REARRANGING: 'Sentence-Rearranging',
    MATCHING: 'Matching'
};

// ============================================================
// ✅ Answer Status (unchanged)
// ============================================================
export const ANSWER_STATUS = {
    CORRECT: 'correct',
    PARTIAL: 'partial',
    WRONG: 'wrong',
    SKIPPED: 'skipped',
    TIMED_OUT: 'timed_out',
    UNANSWERED: 'unanswered'
};

// ============================================================
// ✅ Timer Config (unchanged)
// ============================================================
export const TIMER_CONFIG = {
    DEFAULT_PER_QUESTION: 60,
    MIN_PER_QUESTION: 10,
    MAX_PER_QUESTION: 90,
    STEP: 5
};

// ============================================================
// ✅ Storage Keys (unchanged)
// ============================================================
export const STORAGE_KEYS = {
    // User settings
    SELECTED_TIME: 'user_selected_time',
    DARK_MODE: 'user_dark_mode',
    FULL_TIMER_MODE: 'user_full_timer_mode',

    // User profile
    PROFILE: 'user_profile',
    TIMES_HUNDRED: 'user_times_hundred',

    // User data
    LEADERBOARD: 'user_leaderboard',
    TOKEN: 'user_auth_token',

    // Authentication
    USER: 'user_data',
    REMEMBER_ME: 'user_remember_me',
    GUEST_MODE: 'user_guest_mode',
    LAST_LOGIN: 'user_last_login',

    // Quiz progress
    QUIZ_PROGRESS: 'user_quiz_progress',

    // Avatar system
    RESIZED_IMAGE: 'resized_image',
    CROP_SETTINGS: 'crop_settings',

    // Session
    SESSION_CLEARED: 'session_cleared'
};

// ============================================================
// ✅ API Endpoints — resolved dynamically via getApiBase()
// ============================================================
/**
 * Build an API endpoint URL using current runtime config.
 * @param {string} path - Endpoint path (e.g., '/auth/login')
 */
export const buildApiUrl = (path) => {
    const base = getApiBase();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
};

// ✅ Static endpoints structure (relative paths — no domain)
export const API_ENDPOINTS = {
    // Base URL — getter returns current value
    get BASE() {
        return getApiBase();
    },
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh-token',
        ME: '/auth/me',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_OTP: '/auth/verify-otp',
        SEND_RESET_OPTIONS: '/auth/send-reset-options',
        VALIDATE_RESET_TOKEN: '/auth/validate-reset-token',
        CANCEL_OTP: '/auth/cancel-otp',
        CANCEL_RESET_TOKEN: '/auth/cancel-reset-token',
        SEND_ALT_EMAIL_VERIFICATION: '/auth/send-alt-email-verification',
        VERIFY_ALT_EMAIL: '/auth/verify-alt-email',
        CHANGE_PASSWORD: '/auth/change-password'
    },
    QUIZZES: {
        BASE: '/quizzes',
        FILTER: '/quizzes/filter',
        SUBMIT: '/quizzes/submit'
    },
    CATEGORIES: '/categories',
    UPLOADS: {
        AVATAR: '/uploads/avatar',
        COVER: '/uploads/cover'
    },
    HEALTH: '/health'
};

// ============================================================
// ✅ Event Names (unchanged)
// ============================================================
export const EVENT_NAMES = {
    QUESTION_ANSWERED: 'questionAnswered',
    QUIZ_COMPLETED: 'quizCompleted',
    TIMER_TICK: 'timerTick',
    TIMER_END: 'timerEnd'
};

// ============================================================
// ✅ App Info (from runtime config)
// ============================================================
export const APP_INFO = {
    NAME: 'Quiz Program',
    VERSION: '2.0.0'
};

// ============================================================
// ✅ Initialize — ensure config is loaded
// ============================================================
/**
 * Call this in app.js before making any API calls.
 * Resolves when config.json is loaded (or fallback used).
 */
export const initializeConstants = async () => {
    await loadRuntimeConfig();
    console.log('✅ Constants initialized with API base:', getApiBase());
};

// ✅ Auto-load when this module is imported
initializeConstants().catch((err) => {
    console.error('❌ Constants initialization failed:', err);
});