// backend/routes/uploadRoutes.js
// Version: 2.0.0 - Centralized upload limits

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    uploadAvatar,
    uploadCover,
    deleteAvatar,
    deleteCover
} = require('../controllers/uploadController');

// ✅ Import centralized config
const {
    UPLOAD_LIMITS,
    DEFAULT_MAX_SIZE_BYTES,
    AVATAR_MAX_SIZE_BYTES,
    COVER_MAX_SIZE_BYTES,
    formatSize
} = require('../config/upload');

// ============================================================
// ✅ Multer — memory storage (buffer → Cloudinary direct upload)
// ============================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('শুধুমাত্র image ফাইল আপলোড করা যাবে (jpeg/png/webp/gif)'), false);
    }
};

// ✅ Avatar upload middleware (50 KB limit)
const uploadAvatarMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: AVATAR_MAX_SIZE_BYTES,
        files: 1
    }
});

// ✅ Cover upload middleware (100 KB limit)
const uploadCoverMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: COVER_MAX_SIZE_BYTES,
        files: 1
    }
});

// ============================================================
// ✅ Multer error handler
// ============================================================
const handleMulterError = (maxSizeKB) => (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `ফাইল সাইজ ${formatSize(maxSizeKB)}-এর বেশি হতে পারবে না`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'একবারে শুধু একটি ফাইল আপলোড করা যাবে'
            });
        }
        return res.status(400).json({
            success: false,
            message: `ফাইল আপলোড সমস্যা: ${err.message}`
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'ফাইল আপলোডে সমস্যা হয়েছে'
        });
    }
    next();
};

// ============================================================
// ✅ Routes (all require authentication)
// ============================================================
router.use(protect);

// Avatar — 50 KB limit
router.post(
    '/avatar',
    uploadAvatarMiddleware.single('avatar'),
    handleMulterError(UPLOAD_LIMITS.AVATAR_MAX_SIZE_KB),
    uploadAvatar
);
router.delete('/avatar', deleteAvatar);

// Cover — 100 KB limit
router.post(
    '/cover',
    uploadCoverMiddleware.single('cover'),
    handleMulterError(UPLOAD_LIMITS.COVER_MAX_SIZE_KB),
    uploadCover
);
router.delete('/cover', deleteCover);

module.exports = router;