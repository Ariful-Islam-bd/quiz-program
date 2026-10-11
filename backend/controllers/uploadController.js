// backend/controllers/uploadController.js
// Version: 3.0.0 - Centralized upload limits (avatar: 50 KB, cover: 100 KB)

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cloudinaryService = require('../services/cloudinaryService');
const User = require('../models/User');

// ✅ Import centralized config
const {
    UPLOAD_LIMITS,
    AVATAR_MAX_SIZE_BYTES,
    COVER_MAX_SIZE_BYTES,
    DEFAULT_MAX_SIZE_BYTES,
    formatSize
} = require('../config/upload');

// ============================================================
// ✅ Validate uploaded file (type + size)
// ============================================================
const validateFile = (file, maxSizeBytes, maxSizeKB, fileType = 'ফাইল') => {
    if (!file) {
        throw new AppError(`${fileType} আপলোড করা হয়নি`, 400);
    }
    if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new AppError(`শুধুমাত্র image ফাইল আপলোড করা যাবে (jpeg/png/webp/gif)`, 400);
    }
    if (file.size > maxSizeBytes) {
        throw new AppError(`${fileType} সাইজ ${formatSize(maxSizeKB)}-এর বেশি হতে পারবে না`, 400);
    }
};

// ============================================================
// ✅ Check Cloudinary configuration
// ============================================================
const ensureStorageConfigured = () => {
    if (!cloudinaryService.isConfigured()) {
        throw new AppError('Storage service is not configured. Please contact support.', 503);
    }
};

// ============================================================
// ✅ POST /api/v1/uploads/avatar
// ============================================================
exports.uploadAvatar = catchAsync(async (req, res, next) => {
    console.log('📤 Avatar upload request received');
    ensureStorageConfigured();
    
    // ✅ Validate: max 50 KB
    validateFile(
        req.file,
        AVATAR_MAX_SIZE_BYTES,
        UPLOAD_LIMITS.AVATAR_MAX_SIZE_KB,
        'অ্যাভাটার'
    );

    const userId = req.user.id;
    const extension = UPLOAD_LIMITS.EXTENSION_MAP[req.file.mimetype] || 'jpg';
    const key = cloudinaryService.generateKey('avatars', userId, extension);

    const user = await User.findById(userId);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    // ✅ Delete old avatar if exists
    if (user.profile?.avatar) {
        const oldKey = cloudinaryService.extractKeyFromURL(user.profile.avatar);
        if (oldKey) {
            try {
                await cloudinaryService.deleteFile(oldKey);
                console.log('🗑️ Old avatar deleted:', oldKey);
            } catch (err) {
                console.warn('⚠️ Failed to delete old avatar:', err.message);
            }
        }
    }

    // ✅ Upload new avatar
    const { url, publicId } = await cloudinaryService.uploadFile(
        req.file.buffer,
        key,
        'avatars'
    );

    if (!user.profile) user.profile = {};
    user.profile.avatar = url;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Avatar uploaded: ${publicId} (${formatSize(req.file.size / 1024)})`);

    res.status(200).json({
        success: true,
        message: '✅ অ্যাভাটার সফলভাবে আপলোড হয়েছে',
        data: { url, key: publicId, size: req.file.size }
    });
});

// ============================================================
// ✅ POST /api/v1/uploads/cover
// ============================================================
exports.uploadCover = catchAsync(async (req, res, next) => {
    console.log('📤 Cover upload request received');
    ensureStorageConfigured();
    
    // ✅ Validate: max 100 KB
    validateFile(
        req.file,
        COVER_MAX_SIZE_BYTES,
        UPLOAD_LIMITS.COVER_MAX_SIZE_KB,
        'কভার'
    );

    const userId = req.user.id;
    const extension = UPLOAD_LIMITS.EXTENSION_MAP[req.file.mimetype] || 'jpg';
    const key = cloudinaryService.generateKey('covers', userId, extension);

    const user = await User.findById(userId);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    // ✅ Delete old cover if exists
    if (user.profile?.coverImage) {
        const oldKey = cloudinaryService.extractKeyFromURL(user.profile.coverImage);
        if (oldKey) {
            try {
                await cloudinaryService.deleteFile(oldKey);
                console.log('🗑️ Old cover deleted:', oldKey);
            } catch (err) {
                console.warn('⚠️ Failed to delete old cover:', err.message);
            }
        }
    }

    // ✅ Upload new cover
    const { url, publicId } = await cloudinaryService.uploadFile(
        req.file.buffer,
        key,
        'covers'
    );

    if (!user.profile) user.profile = {};
    user.profile.coverImage = url;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Cover uploaded: ${publicId} (${formatSize(req.file.size / 1024)})`);

    res.status(200).json({
        success: true,
        message: '✅ কভার ইমেজ সফলভাবে আপলোড হয়েছে',
        data: { url, key: publicId, size: req.file.size }
    });
});

// ============================================================
// ✅ DELETE /api/v1/uploads/avatar
// ============================================================
exports.deleteAvatar = catchAsync(async (req, res, next) => {
    ensureStorageConfigured();

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    if (user.profile?.avatar) {
        const key = cloudinaryService.extractKeyFromURL(user.profile.avatar);
        if (key) {
            try {
                await cloudinaryService.deleteFile(key);
                console.log('🗑️ Avatar deleted:', key);
            } catch (err) {
                console.warn('⚠️ Failed to delete avatar:', err.message);
            }
        }
        user.profile.avatar = '';
        await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
        success: true,
        message: '✅ অ্যাভাটার ডিলিট করা হয়েছে'
    });
});

// ============================================================
// ✅ DELETE /api/v1/uploads/cover
// ============================================================
exports.deleteCover = catchAsync(async (req, res, next) => {
    ensureStorageConfigured();

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    if (user.profile?.coverImage) {
        const key = cloudinaryService.extractKeyFromURL(user.profile.coverImage);
        if (key) {
            try {
                await cloudinaryService.deleteFile(key);
                console.log('🗑️ Cover deleted:', key);
            } catch (err) {
                console.warn('⚠️ Failed to delete cover:', err.message);
            }
        }
        user.profile.coverImage = '';
        await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
        success: true,
        message: '✅ কভার ইমেজ ডিলিট করা হয়েছে'
    });
});