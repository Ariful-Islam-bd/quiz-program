// backend/middleware/authMiddleware.js
// Version: 2.0.0 - Full Featured

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ✅ ১. প্রোটেক্ট মিডলওয়্যার
exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // ✅ Authorization 헤더 থেকে টোকেন নিন
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('এই রুটে অ্যাক্সেস পেতে লগইন করুন', 401));
    }

    // ✅ টোকেন ভেরিফাই
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(new AppError('ইনভ্যালিড বা এক্সপায়ার্ড টোকেন', 401));
    }

    // ✅ ইউজার চেক
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('এই টোকেনের সাথে মিলে এমন ইউজার নেই', 401));
    }

    // ✅ অ্যাকাউন্ট অ্যাকটিভ কিনা
    if (!user.isActive) {
        return next(new AppError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে', 403));
    }

    // ✅ ইউজার অবজেক্ট রিকোয়েস্টে যোগ
    req.user = user;
    next();
});

// ✅ ২. রোল বেসড অথরাইজেশন
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(
                `ইউজার রোল "${req.user.role}" এই রুটে অ্যাক্সেস পেতে পারে না`,
                403
            ));
        }
        next();
    };
};

// ✅ ৩. অ্যাকাউন্ট ভেরিফাইড কিনা চেক
exports.isVerified = catchAsync(async (req, res, next) => {
    if (!req.user.isVerified) {
        return next(new AppError('অ্যাকাউন্ট ভেরিফাই করা হয়নি', 403));
    }
    next();
});