// backend/controllers/contentController.js
// Version: 1.0.0 - Content API controllers
// Purpose: Handle CRUD operations for academia content

const Content = require('../models/Content');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ============================================================
// ✅ Helper: Validate topicId format
// ============================================================
const validateTopicId = (topicId) => {
    if (!topicId || typeof topicId !== 'string') {
        throw new AppError('topicId প্রয়োজন', 400);
    }
    if (!/^[A-Za-z0-9-]+$/.test(topicId)) {
        throw new AppError('topicId শুধুমাত্র letters, numbers, এবং hyphens থাকতে পারে', 400);
    }
    return topicId.trim();
};

// ============================================================
// ✅ GET /api/v1/content/:topicId
// Public: Get single content by topicId
// ============================================================
exports.getContentById = catchAsync(async (req, res, next) => {
    const topicId = validateTopicId(req.params.topicId);

    const content = await Content.findByTopicId(topicId);

    if (!content) {
        return next(new AppError(`Content "${topicId}" পাওয়া যায়নি`, 404));
    }

    // ✅ Increment views (non-blocking)
    content.incrementViews().catch(err => {
        console.warn('⚠️ Failed to increment views:', err.message);
    });

    res.status(200).json({
        success: true,
        data: content
    });
});

// ============================================================
// ✅ GET /api/v1/content
// Public: List contents with filters + pagination
// ============================================================
exports.listContents = catchAsync(async (req, res, next) => {
    const {
        board,
        className,
        subject,
        chapter,
        topic,
        search,
        page = 1,
        limit = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
    } = req.query;

    // ✅ Validate sortBy field
    const allowedSortFields = ['updatedAt', 'createdAt', 'name', 'views'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';

    const filters = {
        board: board?.trim(),
        className: className?.trim(),
        subject: subject?.trim(),
        chapter: chapter?.trim(),
        topic: topic?.trim(),
        search: search?.trim()
    };

    // Remove undefined/empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit) || 20, 100),
        sortBy: finalSortBy,
        sortOrder
    };

    // ✅ Execute query
    const [contents, totalCount] = await Promise.all([
        Content.listWithFilters(filters, options),
        Content.countDocuments({ isActive: true, ...buildCountQuery(filters) })
    ]);

    const totalPages = Math.ceil(totalCount / options.limit);

    res.status(200).json({
        success: true,
        count: contents.length,
        total: totalCount,
        page: options.page,
        totalPages,
        data: contents
    });
});

// ============================================================
// ✅ Helper: Build count query from filters
// ============================================================
function buildCountQuery(filters) {
    const query = {};
    if (filters.board) query['category.board'] = filters.board;
    if (filters.className) query['category.className'] = filters.className;
    if (filters.subject) query['category.subject'] = filters.subject;
    if (filters.chapter) query['category.chapter'] = filters.chapter;
    if (filters.topic) query['category.topic'] = filters.topic;
    if (filters.search) query.$text = { $search: filters.search };
    return query;
}

// ============================================================
// ✅ POST /api/v1/content
// Admin: Create new content
// ============================================================
exports.createContent = catchAsync(async (req, res, next) => {
    const {
        topicId,
        name,
        category,
        contentType = 'html',
        html,
        description = '',
        metadata = {}
    } = req.body;

    // ✅ Validate required fields
    if (!topicId) return next(new AppError('topicId প্রয়োজন', 400));
    if (!name) return next(new AppError('name প্রয়োজন', 400));
    if (!category) return next(new AppError('category প্রয়োজন', 400));
    if (!html) return next(new AppError('html content প্রয়োজন', 400));

    // ✅ Validate category structure
    const requiredCategoryFields = ['board', 'className', 'subject', 'chapter', 'topic'];
    const missingFields = requiredCategoryFields.filter(f => !category[f]);
    if (missingFields.length > 0) {
        return next(new AppError(`category-তে প্রয়োজন: ${missingFields.join(', ')}`, 400));
    }

    // ✅ Check for duplicate
    const existing = await Content.findOne({ topicId });
    if (existing) {
        return next(new AppError(`topicId "${topicId}" ইতিমধ্যে বিদ্যমান`, 409));
    }

    // ✅ Create content
    const content = await Content.create({
        topicId: validateTopicId(topicId),
        name: name.trim(),
        category: {
            board: category.board.trim(),
            className: category.className.trim(),
            subject: category.subject.trim(),
            chapter: category.chapter.trim(),
            topic: category.topic.trim()
        },
        contentType,
        html,
        description: description.trim(),
        metadata
    });

    res.status(201).json({
        success: true,
        message: '✅ Content সফলভাবে তৈরি হয়েছে',
        data: content
    });
});

// ============================================================
// ✅ PUT /api/v1/content/:topicId
// Admin: Update existing content
// ============================================================
exports.updateContent = catchAsync(async (req, res, next) => {
    const topicId = validateTopicId(req.params.topicId);
    const {
        name,
        category,
        contentType,
        html,
        description,
        isActive,
        metadata
    } = req.body;

    // ✅ Find content
    const content = await Content.findOne({ topicId });
    if (!content) {
        return next(new AppError(`Content "${topicId}" পাওয়া যায়নি`, 404));
    }

    // ✅ Apply updates (only provided fields)
    if (name !== undefined) content.name = name.trim();
    if (contentType !== undefined) content.contentType = contentType;
    if (html !== undefined) content.html = html;
    if (description !== undefined) content.description = description.trim();
    if (isActive !== undefined) content.isActive = isActive;
    if (metadata !== undefined) content.metadata = { ...content.metadata, ...metadata };

    // ✅ Update category fields individually
    if (category) {
        const requiredCategoryFields = ['board', 'className', 'subject', 'chapter', 'topic'];
        requiredCategoryFields.forEach(field => {
            if (category[field] !== undefined) {
                content.category[field] = category[field].trim();
            }
        });
    }

    // ✅ Increment version
    content.version += 1;

    await content.save();

    res.status(200).json({
        success: true,
        message: '✅ Content সফলভাবে আপডেট হয়েছে',
        data: content
    });
});

// ============================================================
// ✅ DELETE /api/v1/content/:topicId
// Admin: Soft delete content
// ============================================================
exports.deleteContent = catchAsync(async (req, res, next) => {
    const topicId = validateTopicId(req.params.topicId);
    const { hard = false } = req.query;

    const content = await Content.findOne({ topicId });
    if (!content) {
        return next(new AppError(`Content "${topicId}" পাওয়া যায়নি`, 404));
    }

    if (hard === 'true' || hard === true) {
        // ✅ Hard delete (permanent)
        await Content.deleteOne({ topicId });
        return res.status(200).json({
            success: true,
            message: `🗑️ Content "${topicId}" স্থায়ীভাবে ডিলিট করা হয়েছে`
        });
    }

    // ✅ Soft delete (default)
    await content.softDelete();

    res.status(200).json({
        success: true,
        message: `✅ Content "${topicId}" নিষ্ক্রিয় করা হয়েছে`,
        data: { topicId, isActive: false }
    });
});

// ============================================================
// ✅ GET /api/v1/content/stats/summary
// Public: Get content statistics
// ============================================================
exports.getStats = catchAsync(async (req, res, next) => {
    const stats = await Content.getStats();

    res.status(200).json({
        success: true,
        data: stats
    });
});

// ============================================================
// ✅ POST /api/v1/content/:topicId/restore
// Admin: Restore soft-deleted content
// ============================================================
exports.restoreContent = catchAsync(async (req, res, next) => {
    const topicId = validateTopicId(req.params.topicId);

    const content = await Content.findOne({ topicId });
    if (!content) {
        return next(new AppError(`Content "${topicId}" পাওয়া যায়নি`, 404));
    }

    if (content.isActive) {
        return next(new AppError(`Content "${topicId}" ইতিমধ্যে সক্রিয়`, 400));
    }

    await content.restore();

    res.status(200).json({
        success: true,
        message: `✅ Content "${topicId}" পুনরুদ্ধার করা হয়েছে`,
        data: content
    });
});

// ============================================================
// ✅ GET /api/v1/content/categories
// Public: Get unique categories for navigation
// ============================================================
exports.getCategories = catchAsync(async (req, res, next) => {
    const { board, className, subject, chapter } = req.query;

    const matchStage = { isActive: true };
    if (board) matchStage['category.board'] = board;
    if (className) matchStage['category.className'] = className;
    if (subject) matchStage['category.subject'] = subject;
    if (chapter) matchStage['category.chapter'] = chapter;

    const [boards, classes, subjects, chapters, topics] = await Promise.all([
        Content.distinct('category.board', matchStage),
        Content.distinct('category.className', matchStage),
        Content.distinct('category.subject', matchStage),
        Content.distinct('category.chapter', matchStage),
        Content.distinct('category.topic', matchStage)
    ]);

    res.status(200).json({
        success: true,
        data: {
            boards: boards.filter(Boolean).sort(),
            classes: classes.filter(Boolean).sort(),
            subjects: subjects.filter(Boolean).sort(),
            chapters: chapters.filter(Boolean).sort(),
            topics: topics.filter(Boolean).sort()
        }
    });
});