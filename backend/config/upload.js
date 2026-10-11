// backend/config/upload.js
// Version: 1.0.0 - Centralized upload configuration
// Purpose: Single source of truth for file size limits
//
// ⚠️ DEVELOPMENT PHASE: 50/100 KB limits for bandwidth optimization
// ⚠️ When upgrading to paid plan, increase these values

const UPLOAD_LIMITS = {
    AVATAR_MAX_SIZE_KB: 50,      // Avatar: 50 KB
    COVER_MAX_SIZE_KB: 100,      // Cover: 100 KB
    DEFAULT_MAX_SIZE_KB: 50,     // Fallback

    ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ],

    EXTENSION_MAP: {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    }
};

const KB_TO_BYTES = (kb) => kb * 1024;

const formatSize = (kb) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

const AVATAR_MAX_SIZE_BYTES = KB_TO_BYTES(UPLOAD_LIMITS.AVATAR_MAX_SIZE_KB);
const COVER_MAX_SIZE_BYTES = KB_TO_BYTES(UPLOAD_LIMITS.COVER_MAX_SIZE_KB);
const DEFAULT_MAX_SIZE_BYTES = KB_TO_BYTES(UPLOAD_LIMITS.DEFAULT_MAX_SIZE_KB);

console.log('📁 Upload limits configured:');
console.log(`   • Avatar:  ${formatSize(UPLOAD_LIMITS.AVATAR_MAX_SIZE_KB)}`);
console.log(`   • Cover:   ${formatSize(UPLOAD_LIMITS.COVER_MAX_SIZE_KB)}`);

module.exports = {
    UPLOAD_LIMITS,
    KB_TO_BYTES,
    formatSize,
    AVATAR_MAX_SIZE_BYTES,
    COVER_MAX_SIZE_BYTES,
    DEFAULT_MAX_SIZE_BYTES
};