// backend/utils/catchAsync.js
// Version: 1.0.0
// Description: এই ইউটিলিটি ফাংশনটি async ফাংশনের এরর অটোমেটিক্যালি ক্যাচ করে next-এ পাঠায়

/**
 * async ফাংশনের এরর হ্যান্ডলিং করার জন্য হায়ার-অর্ডার ফাংশন
 * @param {Function} fn - async ফাংশন যা এক্সিকিউট হবে
 * @returns {Function} এক্সপ্রেস মিডলওয়্যার ফাংশন
 */
module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
