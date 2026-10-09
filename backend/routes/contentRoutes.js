// backend/routes/contentRoutes.js
// Version: 1.0.0 - Content API routes
// Purpose: Express routes for academia content

const express = require('express');
const router = express.Router();

const {
    getContentById,
    listContents,
    createContent,
    updateContent,
    deleteContent,
    getStats,
    restoreContent,
    getCategories
} = require('../controllers/contentController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ============================================================
// ✅ Public Routes (no authentication required)
// ============================================================

// ✅ GET /api/v1/content - List all contents with filters
router.get('/', listContents);

// ✅ GET /api/v1/content/categories - Get unique categories
router.get('/categories', getCategories);

// ✅ GET /api/v1/content/stats/summary - Get statistics
router.get('/stats/summary', getStats);

// ✅ GET /api/v1/content/:topicId - Get single content
router.get('/:topicId', getContentById);

// ============================================================
// ✅ Admin Routes (authentication + admin role required)
// ============================================================

// ✅ POST /api/v1/content - Create new content
router.post(
    '/',
    protect,
    authorize('admin'),
    createContent
);

// ✅ PUT /api/v1/content/:topicId - Update content
router.put(
    '/:topicId',
    protect,
    authorize('admin'),
    updateContent
);

// ✅ DELETE /api/v1/content/:topicId - Soft delete content
router.delete(
    '/:topicId',
    protect,
    authorize('admin'),
    deleteContent
);

// ✅ POST /api/v1/content/:topicId/restore - Restore soft-deleted content
router.post(
    '/:topicId/restore',
    protect,
    authorize('admin'),
    restoreContent
);

module.exports = router;