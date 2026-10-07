// backend/services/r2Service.js
// Version: 1.0.0 - Cloudflare R2 storage wrapper (S3-compatible API)

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require('@aws-sdk/client-s3');

// ============================================================
// ✅ R2 Client (S3-compatible)
// ============================================================
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY
    }
});

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxxx.r2.dev or custom domain

// ============================================================
// ✅ Check if R2 is configured
// ============================================================
const isConfigured = () => {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY &&
        process.env.R2_SECRET_KEY &&
        process.env.R2_BUCKET &&
        process.env.R2_PUBLIC_URL
    );
};

// ============================================================
// ✅ Upload file to R2
// ============================================================
/**
 * @param {Buffer} buffer - File buffer
 * @param {string} key - Storage key (e.g., 'avatars/user123.jpg')
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<{key: string, url: string}>}
 */
const uploadFile = async (buffer, key, contentType) => {
    if (!isConfigured()) {
        throw new Error('R2 storage is not configured. Check environment variables.');
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable' // 1 year
    });

    await r2Client.send(command);

    return {
        key,
        url: `${PUBLIC_URL}/${key}`
    };
};

// ============================================================
// ✅ Delete file from R2
// ============================================================
/**
 * @param {string} key - Storage key to delete
 */
const deleteFile = async (key) => {
    if (!isConfigured()) {
        throw new Error('R2 storage is not configured.');
    }

    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    await r2Client.send(command);
    return { success: true, key };
};

// ============================================================
// ✅ Extract key from public URL
// ============================================================
/**
 * Given a public URL, extract the R2 storage key
 * e.g., 'https://pub-xxx.r2.dev/avatars/user123.jpg' → 'avatars/user123.jpg'
 */
const extractKeyFromURL = (url) => {
    if (!url || !PUBLIC_URL) return null;
    if (!url.startsWith(PUBLIC_URL)) return null;
    return url.substring(PUBLIC_URL.length + 1).split('?')[0];
};

// ============================================================
// ✅ Generate storage key
// ============================================================
/**
 * @param {string} folder - 'avatars' | 'covers' | etc.
 * @param {string} userId - User ID
 * @param {string} extension - File extension without dot (e.g., 'jpg')
 */
const generateKey = (folder, userId, extension) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${folder}/${userId}/${timestamp}-${random}.${extension}`;
};

module.exports = {
    uploadFile,
    deleteFile,
    extractKeyFromURL,
    generateKey,
    isConfigured,
    r2Client,
    BUCKET,
    PUBLIC_URL
};