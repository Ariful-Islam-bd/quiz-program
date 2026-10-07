// backend/services/cloudinaryService.js
// Version: 1.0.0 - Cloudinary storage wrapper
// Replaces r2Service.js — free tier, no credit card required

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// ============================================================
// ✅ Cloudinary Configuration
// ============================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// ============================================================
// ✅ Check if Cloudinary is configured
// ============================================================
const isConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

// ============================================================
// ✅ Upload file to Cloudinary
// ============================================================
const uploadFile = async (buffer, key, folder = 'avatars') => {
    if (!isConfigured()) {
        throw new Error('Cloudinary is not configured. Check environment variables.');
    }

    // ✅ Extract public_id from key (remove extension)
    const publicId = key.replace(/\.[^/.]+$/, '');

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                folder: folder === 'avatars' ? 'quiz-program/avatars' : 'quiz-program/covers',
                resource_type: 'image',
                overwrite: true,
                invalidate: true,
                transformation: [
                    { quality: 'auto:good', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                }
                if (!result || !result.secure_url) {
                    return reject(new Error('Cloudinary returned invalid response'));
                }

                resolve({
                    key: result.public_id,
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        const bufferStream = Readable.from(buffer);
        bufferStream.pipe(uploadStream);
    });
};

// ============================================================
// ✅ Delete file from Cloudinary
// ============================================================
const deleteFile = async (publicId) => {
    if (!isConfigured()) {
        throw new Error('Cloudinary is not configured.');
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: 'image'
        });
        return { success: true, result };
    } catch (error) {
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
};

// ============================================================
// ✅ Extract public_id from Cloudinary URL
// ============================================================
const extractKeyFromURL = (url) => {
    if (!url || typeof url !== 'string') return null;

    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Failed to extract key from URL:', url, error.message);
        return null;
    }
};

// ============================================================
// ✅ Generate storage key (public_id)
// ============================================================
const generateKey = (folder, userId, extension) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${userId}-${timestamp}-${random}.${extension}`;
};

// ============================================================
// ✅ Export
// ============================================================
module.exports = {
    uploadFile,
    deleteFile,
    extractKeyFromURL,
    generateKey,
    isConfigured,
    cloudinary
};