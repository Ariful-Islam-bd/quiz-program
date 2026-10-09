// backend/models/Content.js
// Version: 1.0.0 - Academia content MongoDB model
// Purpose: Store HTML content for academia topics with hierarchical categorization

const mongoose = require('mongoose');

// ============================================================
// ✅ Category Sub-Schema (hierarchical structure)
// ============================================================
const categorySubSchema = new mongoose.Schema({
    board: { 
        type: String, 
        required: [true, 'Board is required'],
        trim: true,
        index: true
    },
    className: { 
        type: String, 
        required: [true, 'Class name is required'],
        trim: true,
        index: true
    },
    subject: { 
        type: String, 
        required: [true, 'Subject is required'],
        trim: true,
        index: true
    },
    chapter: { 
        type: String, 
        required: [true, 'Chapter is required'],
        trim: true,
        index: true
    },
    topic: { 
        type: String, 
        required: [true, 'Topic is required'],
        trim: true,
        index: true
    }
}, { _id: false });

// ============================================================
// ✅ Main Content Schema
// ============================================================
const contentSchema = new mongoose.Schema({
    // ✅ Unique topic identifier (e.g., 'HSC-Math-3A-Q01-Q02')
    topicId: {
        type: String,
        required: [true, 'topicId is required'],
        unique: true,
        trim: true,
        index: true,
        match: [/^[A-Za-z0-9-]+$/, 'topicId must contain only letters, numbers, and hyphens']
    },

    // ✅ Display name (Bengali/English)
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },

    // ✅ Hierarchical category
    category: {
        type: categorySubSchema,
        required: [true, 'Category is required']
    },

    // ✅ Content type
    contentType: {
        type: String,
        enum: {
            values: ['html', 'markdown', 'text'],
            message: 'contentType must be html, markdown, or text'
        },
        default: 'html'
    },

    // ✅ HTML content (main payload)
    html: {
        type: String,
        required: [true, 'HTML content is required'],
        maxlength: [500000, 'HTML content cannot exceed 500KB'] // ~500KB limit
    },

    // ✅ Optional description/summary
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },

    // ✅ View counter (analytics)
    views: {
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative']
    },

    // ✅ Soft delete flag
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // ✅ Content version (for cache busting)
    version: {
        type: Number,
        default: 1,
        min: 1
    },

    // ✅ Source file path (for migration tracking)
    sourcePath: {
        type: String,
        trim: true,
        default: ''
    },

    // ✅ Content hash (for duplicate detection during migration)
    contentHash: {
        type: String,
        trim: true,
        default: ''
    },

    // ✅ Metadata
    metadata: {
        wordCount: { type: Number, default: 0 },
        hasMath: { type: Boolean, default: false },
        hasImages: { type: Boolean, default: false },
        estimatedReadTime: { type: Number, default: 0 } // minutes
    },

    // ✅ Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // Auto-manage createdAt/updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================================
// ✅ Compound Index for hierarchical queries
// ============================================================
contentSchema.index({
    'category.board': 1,
    'category.className': 1,
    'category.subject': 1,
    'category.chapter': 1,
    'category.topic': 1
});

// ============================================================
// ✅ Text Search Index (name + description)
// ============================================================
contentSchema.index({
    name: 'text',
    description: 'text',
    'category.subject': 'text',
    'category.chapter': 'text'
}, {
    weights: {
        name: 10,
        'category.subject': 5,
        'category.chapter': 3,
        description: 1
    },
    name: 'content_text_search'
});

// ============================================================
// ✅ Index for active content listing
// ============================================================
contentSchema.index({ isActive: 1, updatedAt: -1 });

// ============================================================
// ✅ Pre-save middleware: Auto-calculate metadata
// ============================================================
contentSchema.pre('save', function() {
    // ✅ Update timestamp
    this.updatedAt = new Date();

    // ✅ Calculate metadata if HTML changed
    if (this.isModified('html')) {
        const html = this.html || '';
        
        // Word count (rough estimate: strip HTML tags)
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        this.metadata.wordCount = textContent.split(/\s+/).filter(Boolean).length;
        
        // Estimated read time (200 words per minute)
        this.metadata.estimatedReadTime = Math.ceil(this.metadata.wordCount / 200);
        
        // Check for math content (KaTeX)
        this.metadata.hasMath = /katex|\\\(|\\\[|\$\$/.test(html);
        
        // Check for images
        this.metadata.hasImages = /<img/i.test(html);
        
        // Content hash for duplicate detection
        this.contentHash = require('crypto')
            .createHash('md5')
            .update(html)
            .digest('hex');
    }
});

// ============================================================
// ✅ Virtual: Full category path
// ============================================================
contentSchema.virtual('categoryPath').get(function() {
    if (!this.category) return '';
    const c = this.category;
    return [c.board, c.className, c.subject, c.chapter, c.topic]
        .filter(Boolean)
        .join(' → ');
});

// ============================================================
// ✅ Static: Find by topicId (active only)
// ============================================================
contentSchema.statics.findByTopicId = function(topicId) {
    return this.findOne({ topicId, isActive: true });
};

// ============================================================
// ✅ Static: List with filters
// ============================================================
contentSchema.statics.listWithFilters = function(filters = {}, options = {}) {
    const query = { isActive: true };

    // Apply category filters
    if (filters.board) query['category.board'] = filters.board;
    if (filters.className) query['category.className'] = filters.className;
    if (filters.subject) query['category.subject'] = filters.subject;
    if (filters.chapter) query['category.chapter'] = filters.chapter;
    if (filters.topic) query['category.topic'] = filters.topic;

    // Text search
    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    // Pagination
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
    const skip = (page - 1) * limit;

    // Sort options
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return this.find(query)
        .select('-html') // Exclude HTML for list view (performance)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);
};

// ============================================================
// ✅ Static: Get statistics
// ============================================================
contentSchema.statics.getStats = async function() {
    const [total, active, inactive, byCategory] = await Promise.all([
        this.countDocuments({}),
        this.countDocuments({ isActive: true }),
        this.countDocuments({ isActive: false }),
        this.aggregate([
            { $match: { isActive: true } },
            { $group: {
                _id: {
                    board: '$category.board',
                    className: '$category.className',
                    subject: '$category.subject'
                },
                count: { $sum: 1 },
                totalViews: { $sum: '$views' }
            }},
            { $sort: { count: -1 } },
            { $limit: 20 }
        ])
    ]);

    const totalViews = await this.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    return {
        total,
        active,
        inactive,
        totalViews: totalViews[0]?.total || 0,
        byCategory
    };
};

// ============================================================
// ✅ Instance: Increment views
// ============================================================
contentSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save({ validateBeforeSave: false });
    return this.views;
};

// ============================================================
// ✅ Instance: Soft delete
// ============================================================
contentSchema.methods.softDelete = async function() {
    this.isActive = false;
    await this.save({ validateBeforeSave: false });
    return this;
};

// ============================================================
// ✅ Instance: Restore
// ============================================================
contentSchema.methods.restore = async function() {
    this.isActive = true;
    await this.save({ validateBeforeSave: false });
    return this;
};

module.exports = mongoose.model('Content', contentSchema);