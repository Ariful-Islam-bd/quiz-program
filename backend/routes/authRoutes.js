// backend/routes/authRoutes.js
// Version: 2.5.0 - verifyAltEmailPage যোগ

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyOTP,
    sendResetOptions,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    validateResetToken,
    cancelOTP,
    cancelResetToken,
    sendAltEmailVerification,
    verifyAltEmail,
    verifyAltEmailPage   // ✅ ✅ ✅ এই লাইনটি যোগ করুন
} = require('../controllers/authController');

// ============================================================
// ✅ পাবলিক রাউট
// ============================================================
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// ============================================================
// ✅ পাসওয়ার্ড রিসেট (উভয় পদ্ধতি)
// ============================================================
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.post('/verify-otp', verifyOTP);
router.post('/send-reset-options', sendResetOptions);

// ============================================================
// ✅ টোকেন ভ্যালিডেশন
// ============================================================
router.get('/validate-reset-token', validateResetToken);

// ============================================================
// ✅ ক্যান্সেল এন্ডপয়েন্ট
// ============================================================
router.post('/cancel-otp', cancelOTP);
router.post('/cancel-reset-token', cancelResetToken);

// ============================================================
// ✅ ✅ ✅ বিকল্প ইমেইল ভেরিফিকেশন
// ============================================================
// ✅ পেজ রিডাইরেক্ট (পাবলিক - লগইন ছাড়া অ্যাক্সেসযোগ্য)
router.get('/verify-alt-email-page', verifyAltEmailPage);

// ✅ API এন্ডপয়েন্ট (লগইন প্রয়োজন)
router.post('/send-alt-email-verification', protect, sendAltEmailVerification);
router.get('/verify-alt-email', protect, verifyAltEmail);

// ============================================================
// ✅ প্রাইভেট রাউট (লগইন প্রয়োজন)
// ============================================================
router.use(protect);
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.delete('/me', deleteAccount);

module.exports = router;