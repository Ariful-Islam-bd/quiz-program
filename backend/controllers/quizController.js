// backend/controllers/quizController.js
// Version: 2.3.0 - Strict base-ID resolution

const Question = require('../models/Question');
const { MAIN_QUIZ_DATA_MAP } = require('../../mainQuizData');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ============================================================
// ✅ Helper: Strip -sqN suffix to get base ID
// ============================================================
const getBaseId = (rawId) => {
    if (typeof rawId !== 'string') return '';
    return rawId.replace(/(-sq\d+)+$/i, '');
};

// ============================================================
// ✅ Filtered Quizzes — resolves IDs from assortedData
// ============================================================
exports.getFilteredQuizzes = catchAsync(async (req, res, next) => {
    const { board, className, subject, chapter, exercise } = req.query;

    if (!board || !className || !subject || !chapter || !exercise) {
        return next(new AppError('অনুগ্রহ করে সব ফিল্টার প্যারামিটার প্রদান করুন', 400));
    }

    const { ASSORTED_QUIZ_INDEX } = require('../../assortedData');

    // ✅ 1. Lookup raw IDs from assortedData
    const rawIds = ASSORTED_QUIZ_INDEX?.[board]?.[className]?.[subject]?.[chapter]?.[exercise];

    if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return next(new AppError('এই নির্বাচনে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    }

    // ✅ 2. Extract unique base IDs
    const baseIds = [...new Set(rawIds.map(getBaseId).filter(Boolean))];

    if (baseIds.length === 0) {
        return next(new AppError('এই নির্বাচনে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    }

    // ✅ 3. Find questions by base ID (Question.id is base ID)
    const questions = await Question.find({ id: { $in: baseIds } });

    if (!questions?.length) {
        return next(new AppError('এই নির্বাচনে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    }

    // ✅ 4. Preserve order from assortedData
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const orderedQuestions = baseIds
        .map(baseId => questionMap.get(baseId))
        .filter(Boolean);

    const data = orderedQuestions.map(q => {
        const obj = q.toObject();
        if (obj.questions?.length) {
            obj.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return obj;
    });

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

// ============================================================
// ✅ Other methods (unchanged from previous version)
// ============================================================
exports.createQuestion = catchAsync(async (req, res, next) => {
    if (req.user) req.body.createdBy = req.user.id;
    if (req.body.categoryInfo && !Array.isArray(req.body.categoryInfo)) {
        req.body.categoryInfo = [req.body.categoryInfo];
    }
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
});

exports.getQuestions = catchAsync(async (req, res, next) => {
    const questions = await Question.find();
    const data = questions.map(q => {
        const obj = q.toObject();
        if (obj.questions?.length) {
            obj.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        return obj;
    });
    res.status(200).json({ success: true, count: data.length, data });
});

exports.getQuestionById = catchAsync(async (req, res, next) => {
    const question = await Question.findById(req.params.id);
    if (!question) return next(new AppError('এই আইডি দিয়ে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    res.status(200).json({ success: true, data: question });
});

exports.updateQuestion = catchAsync(async (req, res, next) => {
    if (req.body.categoryInfo && !Array.isArray(req.body.categoryInfo)) {
        req.body.categoryInfo = [req.body.categoryInfo];
    }
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!question) return next(new AppError('এই আইডি দিয়ে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    res.status(200).json({ success: true, data: question });
});

exports.deleteQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return next(new AppError('এই আইডি দিয়ে কোনো প্রশ্ন পাওয়া যায়নি', 404));
    res.status(200).json({ success: true, message: 'প্রশ্নটি সফলভাবে ডিলিট করা হয়েছে' });
});