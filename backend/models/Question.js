/* File: D:QUIZ_PROGRAM/backend/models/Question.js
   Version: 2.0.0
   Description: categoryInfo converted to ARRAY for multi-category support.
                একটি প্রশ্ন একাধিক board/class/subject/chapter/exercise-এ থাকতে পারে।
*/

const mongoose = require('mongoose');

// ✅ Single category sub-schema
const categorySubSchema = new mongoose.Schema({
    board: { type: String, required: true },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    exercise: { type: String, required: true },
    examTags: { type: [String], default: [] }
}, { _id: false });  // ✅ No _id for subdocuments (cleaner data)

const questionSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    stimulant: {
        type: String
    },
    questions: [{
        subId: String,
        order: { type: Number, default: 0 },
        q: { type: String, required: true },
        instruction: String,
        type: { type: String, required: true },
        options: [String],
        answer: mongoose.Schema.Types.Mixed,
        explain: mongoose.Schema.Types.Mixed,
        marks: { type: Number, default: 1 }
    }],
    // ✅ ✅ ✅ CHANGED: Single object → Array of objects
    categoryInfo: {
        type: [categorySubSchema],
        required: true,
        validate: {
            validator: (arr) => Array.isArray(arr) && arr.length > 0,
            message: 'categoryInfo must be a non-empty array'
        }
    },
    level: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'easy'
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ Compound index for fast filter queries
questionSchema.index({
    'categoryInfo.board': 1,
    'categoryInfo.class': 1,
    'categoryInfo.subject': 1,
    'categoryInfo.chapter': 1,
    'categoryInfo.exercise': 1
});

module.exports = mongoose.model('Question', questionSchema);