// backend/utils/otpGenerator.js
// Version: 1.0.0 - OTP Generator

const crypto = require('crypto');

/**
 * ৬-ডিজিট OTP জেনারেট করে
 * @returns {string} ৬-ডিজিট OTP
 */
exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * OTP এক্সপায়ারি সময় (৫ মিনিট)
 * @returns {Date} ৫ মিনিট পরে
 */
exports.getOTPExpiry = () => {
    return new Date(Date.now() + 5 * 60 * 1000);
};

/**
 * OTP হ্যাশ করা (সিকিউরিটির জন্য)
 * @param {string} otp - ৬-ডিজিট OTP
 * @returns {string} হ্যাশ করা OTP
 */
exports.hashOTP = (otp) => {
    return crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');
};

/**
 * OTP ভ্যালিড কিনা চেক
 * @param {Object} otpData - ইউজারের OTP ডেটা
 * @param {string} enteredOTP - ইউজার ইনপুট
 * @returns {Object} { valid: boolean, message: string }
 */
exports.verifyOTP = (otpData, enteredOTP) => {
    console.log('🔍 verifyOTP called with:', { otpData, enteredOTP });
    
    if (!otpData || !otpData.code) {
        console.log('❌ No OTP data found');
        return { valid: false, message: 'OTP পাঠানো হয়নি' };
    }

    // ✅ OTP ম্যাচ চেক
    const otpHash = exports.hashOTP(enteredOTP);
    console.log('🔑 Entered OTP hash:', otpHash);
    console.log('🔑 Stored OTP hash:', otpData.code);
    console.log('🔑 Match:', otpData.code === otpHash);
    
    if (otpData.code !== otpHash) {
        return { valid: false, message: 'OTP সঠিক নয়' };
    }

    // ✅ OTP এক্সপায়ার চেক
    const now = new Date();
    const expiry = new Date(otpData.expires);
    console.log('⏰ Now:', now);
    console.log('⏰ Expiry:', expiry);
    console.log('⏰ Is expired:', now > expiry);
    
    if (now > expiry) {
        return { valid: false, message: 'OTP এক্সপায়ার হয়েছে' };
    }

    return { valid: true, message: 'OTP সঠিক' };
};