// backend/utils/appError.js
// Version: 1.0.1 - Fixed export

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// ✅ সঠিক এক্সপোর্ট
module.exports = AppError;