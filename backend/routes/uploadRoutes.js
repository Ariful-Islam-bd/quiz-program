// backend/routes/uploadRoutes.js
// Version: 1.0.0 - Upload endpoints (Cloudflare R2)
// Endpoints: avatar upload/delete, cover upload/delete

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

// ============================================================
// ✅ Multer — memory storage (buffer → R2 direct upload)
// ============================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('শুধুমাত্র image ফাইল আপলোড করা যাবে (jpeg/png/webp/gif)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1 // একবারে একটি ফাইল
    }
});

// ============================================================
// ✅ Multer error handler
// ============================================================
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'ফাইল সাইজ 5 MB-এর বেশি হতে পারবে না'
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

// Avatar
router.post('/avatar', upload.single('avatar'), handleMulterError, uploadAvatar);
router.delete('/avatar', deleteAvatar);

// Cover
router.post('/cover', upload.single('cover'), handleMulterError, uploadCover);
router.delete('/cover', deleteCover);

module.exports = router;