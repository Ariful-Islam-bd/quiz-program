// backend/controllers/uploadController.js
// Version: 2.0.0 - Cloudinary integration (replaces R2)

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cloudinaryService = require('../services/cloudinaryService');
const User = require('../models/User');

// ============================================================
// ✅ Constants
// ============================================================
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const EXTENSION_MAP = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

// ============================================================
// ✅ Validate uploaded file
// ============================================================
const validateFile = (file) => {
    if (!file) {
        throw new AppError('কোনো ফাইল আপলোড করা হয়নি', 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new AppError(`শুধুমাত্র image ফাইল আপলোড করা যাবে (jpeg/png/webp/gif)`, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new AppError('ফাইল সাইজ 5 MB-এর বেশি হতে পারবে না', 400);
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
    validateFile(req.file);

    const userId = req.user.id;
    const extension = EXTENSION_MAP[req.file.mimetype] || 'jpg';
    const key = cloudinaryService.generateKey('avatars', userId, extension);

    // ✅ Find user
    const user = await User.findById(userId);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    // ✅ Delete old avatar if exists
    if (user.profile?.avatar) {
        const oldKey = cloudinaryService.extractKeyFromURL(user.profile.avatar);
        if (oldKey) {
            try {
                await cloudinaryService.deleteFile(oldKey);
                console.log('🗑️ Old avatar deleted from Cloudinary:', oldKey);
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

    // ✅ Update user profile
    if (!user.profile) user.profile = {};
    user.profile.avatar = url;
    await user.save({ validateBeforeSave: false });

    console.log('✅ Avatar uploaded to Cloudinary:', publicId);

    res.status(200).json({
        success: true,
        message: '✅ অ্যাভাটার সফলভাবে আপলোড হয়েছে',
        data: { url, key: publicId }
    });
});

// ============================================================
// ✅ POST /api/v1/uploads/cover
// ============================================================
exports.uploadCover = catchAsync(async (req, res, next) => {
    console.log('📤 Cover upload request received');
    ensureStorageConfigured();
    validateFile(req.file);

    const userId = req.user.id;
    const extension = EXTENSION_MAP[req.file.mimetype] || 'jpg';
    const key = cloudinaryService.generateKey('covers', userId, extension);

    const user = await User.findById(userId);
    if (!user) return next(new AppError('ইউজার পাওয়া যায়নি', 404));

    // ✅ Delete old cover if exists
    if (user.profile?.coverImage) {
        const oldKey = cloudinaryService.extractKeyFromURL(user.profile.coverImage);
        if (oldKey) {
            try {
                await cloudinaryService.deleteFile(oldKey);
                console.log('🗑️ Old cover deleted from Cloudinary:', oldKey);
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

    console.log('✅ Cover uploaded to Cloudinary:', publicId);

    res.status(200).json({
        success: true,
        message: '✅ কভার ইমেজ সফলভাবে আপলোড হয়েছে',
        data: { url, key: publicId }
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
                console.log('🗑️ Avatar deleted from Cloudinary:', key);
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
                console.log('🗑️ Cover deleted from Cloudinary:', key);
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