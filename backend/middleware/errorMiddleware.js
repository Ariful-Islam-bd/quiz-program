// backend/middleware/errorMiddleware.js
// Version: 1.0.0
// Description: গ্লোবাল এরর হ্যান্ডলিং মিডলওয়্যার - সব ধরনের এরর এখানে হ্যান্ডল করা হবে

const AppError = require('../utils/appError');

/**
 * MongoDB Cast Error হ্যান্ডলার
 * যেমন: ভুল ID ফরম্যাট
 */
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

/**
 * Duplicate Field Error হ্যান্ডলার
 * যেমন: ইউনিক ইমেইল ফিল্ডে ডুপ্লিকেট এন্ট্রি
 */
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. দয়া করে অন্য ভ্যালু ব্যবহার করুন!`;
    return new AppError(message, 400);
};

/**
 * Validation Error হ্যান্ডলার
 * যেমন: মডেল ভ্যালিডেশন ফেইল করলে
 */
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * JWT Error হ্যান্ডলার
 */
const handleJWTError = () => 
    new AppError('Invalid token. দয়া করে আবার লগইন করুন!', 401);

const handleJWTExpiredError = () => 
    new AppError('Your token has expired! দয়া করে আবার লগইন করুন!', 401);

/**
 * ডেভেলপমেন্ট এনভায়রনমেন্টে এরর রেসপন্স
 * - ডিটেইলড এরর ইনফরমেশন পাঠায়
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * প্রোডাকশন এনভায়রনমেন্টে এরর রেসপন্স
 * - শুধুমাত্র প্রয়োজনীয় তথ্য পাঠায়
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            success: false,
            message: 'কিছু একটা সমস্যা হয়েছে!'
        });
    }
};

/**
 * গ্লোবাল এরর হ্যান্ডলিং মিডলওয়্যার
 */
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // বিভিন্ন ধরনের এরর চিহ্নিত করে হ্যান্ডল করা
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};