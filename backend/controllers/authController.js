// backend/controllers/authController.js
// Version: 2.5.0 - Added Validate Reset Token

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
    sendEmail,
    sendWelcomeEmail,
    sendResetPasswordEmail,
    sendOTPEmail,
    sendResetOptionsEmail,
    sendResetPasswordToAltEmail,
    sendSecurityNotification,
    sendAltEmailVerificationEmail
} = require('../services/emailService');
const { generateOTP, getOTPExpiry, hashOTP, verifyOTP } = require('../utils/otpGenerator');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ================================================================
// ✅ ইউটিলিটি ফাংশন
// ================================================================
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email.trim());
};

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

const signRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    });
};

const createSendToken = async (user, statusCode, res) => {
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.stats.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const userObj = user.toJSON();

    res.status(statusCode).json({
        success: true,
        token,
        refreshToken,
        user: userObj
    });
};

// ================================================================
// ✅ ১. রেজিস্টার
// ================================================================

exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, phone, profile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট আছে', 400));
    }

    const user = await User.create({
        name,
        email,
        password,
        phone: phone || undefined,
        profile: profile || {}
    });

    // ✅ ওয়েলকাম ইমেইল পাঠান (ব্যাকগ্রাউন্ডে)
    sendWelcomeEmail(user).catch(err => {
        console.warn('⚠️ Welcome email failed:', err.message);
    });

    await createSendToken(user, 201, res);
});

// ================================================================
// ✅ ২. লগইন
// ================================================================

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('দয়া করে ইমেইল ও পাসওয়ার্ড দিন', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return next(new AppError('ইমেইল বা পাসওয়ার্ড সঠিক নয়', 401));
    }

    if (!user.isActive) {
        return next(new AppError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে', 403));
    }

    await createSendToken(user, 200, res);
});

// ================================================================
// ✅ ৩. লগআউট
// ================================================================

exports.logout = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await User.findOneAndUpdate(
            { refreshToken },
            { refreshToken: null }
        );
    }

    res.status(200).json({
        success: true,
        message: 'সফলভাবে লগআউট করা হয়েছে'
    });
});

// ================================================================
// ✅ ৪. রিফ্রেশ টোকেন
// ================================================================

exports.refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('রিফ্রেশ টোকেন প্রয়োজন', 400));
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return next(new AppError('ইনভ্যালিড বা এক্সপায়ার্ড রিফ্রেশ টোকেন', 401));
    }

    const user = await User.findOne({
        _id: decoded.id,
        refreshToken: refreshToken
    });

    if (!user) {
        return next(new AppError('ইনভ্যালিড রিফ্রেশ টোকেন', 401));
    }

    const token = signToken(user._id);

    res.status(200).json({
        success: true,
        token
    });
});

// ================================================================
// ✅ ৫. ফরগট পাসওয়ার্ড
// ================================================================

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email, method } = req.body;

    if (!email) {
        return next(new AppError('দয়া করে ইমেইল দিন', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('এই ইমেইলে কোনো ইউজার নেই', 404));
    }

    const selectedMethod = method || 'primary';

    // ✅ যদি "বিকল্প ইমেইল" পদ্ধতি সিলেক্ট করা হয়
    if (selectedMethod === 'altEmail') {
        // ১. বিকল্প ইমেইল চেক
        if (!user.profile.altEmail || !user.profile.altEmailVerified) {
            return next(new AppError('এই অ্যাকাউন্টে কোনো ভেরিফাইড বিকল্প ইমেইল নেই', 400));
        }

        // ২. রিসেট টোকেন জেনারেট
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // ৩. টোকেন সংরক্ষণ
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        user.resetMethod = 'altEmail';
        await user.save({ validateBeforeSave: false });

        // ৪. বিকল্প ইমেইলে লিংক পাঠান
        try {
            await sendResetPasswordToAltEmail(user, resetToken);
            
            // ৫. প্রধান ইমেইলে নিরাপত্তা নোটিফিকেশন
            await sendSecurityNotification(user);

            res.status(200).json({
                success: true,
                method: 'altEmail',
                message: 'রিসেট লিংক আপনার বিকল্প ইমেইলে পাঠানো হয়েছে'
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new AppError('ইমেইল পাঠাতে সমস্যা হয়েছে', 500));
        }
        return;
    }

    // ✅ প্রধান ইমেইল পদ্ধতি (লিংক)
    if (selectedMethod === 'link' || selectedMethod === 'primary') {
        // ... আগের লিংক পদ্ধতি কোড
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        user.resetMethod = 'primary';
        await user.save({ validateBeforeSave: false });

        try {
            await sendResetPasswordEmail(user, resetToken);
            res.status(200).json({
                success: true,
                method: 'link',
                message: 'রিসেট লিংক ইমেইলে পাঠানো হয়েছে'
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new AppError('ইমেইল পাঠাতে সমস্যা হয়েছে', 500));
        }
        return;
    }

    // ✅ OTP পদ্ধতি
    if (selectedMethod === 'otp') {
        // ... আগের OTP পদ্ধতি কোড
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const otpExpiry = getOTPExpiry();

        user.otp = {
            code: otpHash,
            expires: otpExpiry
        };
        await user.save({ validateBeforeSave: false });

        try {
            await sendOTPEmail(user, otp);
            res.status(200).json({
                success: true,
                method: 'otp',
                message: 'OTP ইমেইলে পাঠানো হয়েছে'
            });
        } catch (error) {
            user.otp = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new AppError('OTP পাঠাতে সমস্যা হয়েছে', 500));
        }
        return;
    }

    return next(new AppError('ভুল পদ্ধতি', 400));
});

// ============================================================
// ✅ ✅ ✅ নতুন: বিকল্প ইমেইল ভেরিফিকেশন টোকেন পাঠান
// ============================================================

exports.sendAltEmailVerification = catchAsync(async (req, res, next) => {
    const { altEmail } = req.body;
    const userId = req.user.id;

    console.log('📧 Alt email verification request for:', altEmail);
    console.log('👤 User ID:', userId);

    // ✅ ইমেইল ভ্যালিডেশন (এখন validateEmail ডিফাইন করা আছে)
    if (!altEmail || !validateEmail(altEmail)) {
        console.log('❌ Invalid email:', altEmail);
        return next(new AppError('সঠিক ইমেইল দিন', 400));
    }

    // ✅ চেক করুন ইমেইলটি অন্য কোনো অ্যাকাউন্টে ব্যবহৃত হচ্ছে কিনা
    const existingUser = await User.findOne({ 
        'profile.altEmail': altEmail,
        _id: { $ne: userId }
    });
    
    if (existingUser) {
        console.log('❌ Email already in use by another user');
        return next(new AppError('এই ইমেইলটি অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে', 400));
    }

    // ✅ ইউজার খুঁজুন
    const user = await User.findById(userId);
    if (!user) {
        console.log('❌ User not found');
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    // ✅ ভেরিফিকেশন টোকেন জেনারেট
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    console.log('🔑 Generated verification token');

    // ✅ টোকেন সংরক্ষণ
    user.verificationToken = tokenHash;
    user.verificationExpires = Date.now() + 30 * 60 * 1000; // ৩০ মিনিট
    
    // ✅ পেন্ডিং অল্ট ইমেইল সংরক্ষণ (User Schema-তে যোগ করুন)
    user._pendingAltEmail = altEmail;
    
    await user.save({ validateBeforeSave: false });
    console.log('✅ Token saved to database');

    // ✅ ভেরিফিকেশন ইমেইল পাঠান
    try {
        console.log('📤 Sending verification email to:', altEmail);
        await sendAltEmailVerificationEmail(user, verificationToken, altEmail);
        console.log('✅ Verification email sent successfully');
        
        res.status(200).json({
            success: true,
            message: 'ভেরিফিকেশন ইমেইল পাঠানো হয়েছে'
        });
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        
        // ইমেইল ব্যর্থ হলে টোকেন মুছে ফেলুন
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        user._pendingAltEmail = undefined;
        await user.save({ validateBeforeSave: false });
        
        return next(new AppError('ইমেইল পাঠাতে সমস্যা হয়েছে: ' + error.message, 500));
    }
});

// ============================================================
// ✅ ✅ ✅ নতুন: বিকল্প ইমেইল ভেরিফাই
// ============================================================

exports.verifyAltEmail = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    console.log('🔍 Verifying alt email with token:', token ? token.substring(0, 20) + '...' : 'NONE');

    if (!token) {
        return next(new AppError('টোকেন প্রয়োজন', 400));
    }

    // ✅ টোকেন হ্যাশ করুন
    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    console.log('🔑 Token hash:', tokenHash);

    // ✅ টোকেন দিয়ে ইউজার খুঁজুন (req.user ছাড়া!)
    const user = await User.findOne({
        verificationToken: tokenHash,
        verificationExpires: { $gt: Date.now() }
    }).select('+verificationToken +verificationExpires +_pendingAltEmail');

    if (!user) {
        console.log('❌ No user found with this token or token expired');
        return next(new AppError('ইনভ্যালিড বা এক্সপায়ার্ড টোকেন', 400));
    }

    console.log('✅ User found:', user._id);
    console.log('📧 Pending alt email:', user._pendingAltEmail);

    if (!user._pendingAltEmail) {
        console.log('❌ No pending alt email');
        return next(new AppError('কোনো পেন্ডিং বিকল্প ইমেইল নেই', 400));
    }

    // ✅ বিকল্প ইমেইল সংরক্ষণ
    user.profile.altEmail = user._pendingAltEmail;
    user.profile.altEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    user._pendingAltEmail = undefined;
    await user.save({ validateBeforeSave: false });

    console.log('✅ Alt email verified and saved:', user.profile.altEmail);

    res.status(200).json({
        success: true,
        message: 'বিকল্প ইমেইল সফলভাবে ভেরিফাই করা হয়েছে'
    });
});

// ============================================================
// ✅ ✅ ✅ বিকল্প ইমেইল ভেরিফিকেশন পেজ (HTML রেসপন্স)
// ============================================================
exports.verifyAltEmailPage = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    console.log('🔍 verifyAltEmailPage called with token:', token ? token.substring(0, 20) + '...' : 'NONE');

    if (!token) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ভেরিফিকেশন ব্যর্থ</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #f44336; margin-bottom: 10px; }
                    p { color: #666; line-height: 1.6; }
                    a { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #2196f3; color: white; text-decoration: none; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">❌</div>
                    <h1>টোকেন প্রয়োজন</h1>
                    <p>ভেরিফিকেশন টোকেন পাওয়া যায়নি।</p>
                    <a href="/">হোমে ফিরে যান</a>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            verificationToken: tokenHash,
            verificationExpires: { $gt: Date.now() }
        }).select('+verificationToken +verificationExpires +_pendingAltEmail');

        if (!user) {
            console.log('❌ Invalid or expired token');
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>ভেরিফিকেশন ব্যর্থ</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                        .icon { font-size: 64px; margin-bottom: 20px; }
                        h1 { color: #f44336; margin-bottom: 10px; }
                        p { color: #666; line-height: 1.6; }
                        a { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #2196f3; color: white; text-decoration: none; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">⏰</div>
                        <h1>টোকেন এক্সপায়ার্ড</h1>
                        <p>এই ভেরিফিকেশন লিংকটি মেয়াদোত্তীর্ণ বা অবৈধ।</p>
                        <a href="/">হোমে ফিরে যান</a>
                    </div>
                </body>
                </html>
            `);
        }

        if (!user._pendingAltEmail) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>ভেরিফিকেশন ব্যর্থ</title>
                </head>
                <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                    <div style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 64px;">❌</div>
                        <h1 style="color: #f44336;">কোনো পেন্ডিং ইমেইল নেই</h1>
                        <a href="/" style="color: #2196f3;">হোমে ফিরে যান</a>
                    </div>
                </body>
                </html>
            `);
        }

        // ✅ বিকল্প ইমেইল সংরক্ষণ
        user.profile.altEmail = user._pendingAltEmail;
        user.profile.altEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        user._pendingAltEmail = undefined;
        await user.save({ validateBeforeSave: false });

        console.log('✅ Alt email verified:', user.profile.altEmail);

        // ✅ সফল পেজ দেখান
        return res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ভেরিফিকেশন সফল</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #4caf50; margin-bottom: 10px; }
                    p { color: #666; line-height: 1.6; }
                    .email { background: #e8f5e9; padding: 12px; border-radius: 8px; margin: 16px 0; color: #2e7d32; font-weight: bold; word-break: break-all; }
                    a { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✅</div>
                    <h1>ভেরিফিকেশন সফল!</h1>
                    <p>আপনার বিকল্প ইমেইল সফলভাবে ভেরিফাই করা হয়েছে:</p>
                    <div class="email">${user.profile.altEmail}</div>
                    <p>এখন আপনি পাসওয়ার্ড রিসেটের জন্য এই ইমেইলটি ব্যবহার করতে পারবেন।</p>
                    <a href="/" onclick="refreshProfileData()">হোমে ফিরে যান</a>
                </div>
                
                <script>
                    function refreshProfileData() {
                        // ✅ localStorage-এ আপডেট ফ্ল্যাগ সেট করুন
                        try {
                            const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                            profile.altEmail = '${user.profile.altEmail}';
                            profile.altEmailVerified = true;
                            localStorage.setItem('user_profile', JSON.stringify(profile));
                            console.log('✅ Profile data updated in localStorage');
                        } catch (e) {
                            console.error('Failed to update localStorage:', e);
                        }
                    }
                    
                    // ✅ পেজ লোড হলেই ডেটা আপডেট করুন
                    refreshProfileData();
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Verify alt email page error:', error);
        return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>সার্ভার এরর</title>
            </head>
            <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                <div style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 64px;">❌</div>
                    <h1 style="color: #f44336;">সার্ভার এরর</h1>
                    <p>কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>
                    <a href="/" style="color: #2196f3;">হোমে ফিরে যান</a>
                </div>
            </body>
            </html>
        `);
    }
});

// ================================================================
// ✅ ৬. রিসেট পাসওয়ার্ড
// ================================================================

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return next(new AppError('টোকেন ও নতুন পাসওয়ার্ড প্রয়োজন', 400));
    }

    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('ইনভ্যালিড বা এক্সপায়ার্ড টোকেন', 400));
    }

    await user.changePassword(newPassword);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await createSendToken(user, 200, res);
});

// ================================================================
// ✅ ৭. টোকেন ভ্যালিডেশন (NEW)
// ================================================================

exports.validateResetToken = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            valid: false,
            message: 'টোকেন প্রয়োজন'
        });
    }

    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            valid: false,
            message: 'টোকেন ইনভ্যালিড বা এক্সপায়ার্ড'
        });
    }

    res.status(200).json({
        valid: true,
        message: 'টোকেন সঠিক'
    });
});

// ================================================================
// ✅ ৮. OTP ভেরিফাই ও পাসওয়ার্ড রিসেট (OTP পদ্ধতি)
// ================================================================

exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    console.log('🔍 ===== VERIFY OTP CALLED =====');
    console.log('📧 Email:', email);
    console.log('🔑 OTP entered:', otp);
    console.log('🔒 New password length:', newPassword?.length || 0);

    if (!email || !otp || !newPassword) {
        return next(new AppError('ইমেইল, OTP ও নতুন পাসওয়ার্ড দিন', 400));
    }

    // ✅ ইউজার খুঁজুন + otp ফিল্ড সিলেক্ট করুন
    const user = await User.findOne({ email }).select('+otp');
    if (!user) {
        console.log('❌ User not found:', email);
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    console.log('📦 User OTP from DB:', user.otp);

    // ✅ OTP ভেরিফাই
    const result = verifyOTP(user.otp, otp);
    console.log('🔍 OTP verification result:', result);

    if (!result.valid) {
        console.log('❌ OTP invalid:', result.message);
        return next(new AppError(result.message, 400));
    }
    console.log('✅ OTP verified successfully!');
    // ✅ পাসওয়ার্ড পরিবর্তন
    await user.changePassword(newPassword);
    // ✅ OTP ক্লিয়ার
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });
    // ✅ নতুন Token তৈরি
    await createSendToken(user, 200, res);
});

// ============================================================
// ✅ OTP বাতিল করুন
// ============================================================
exports.cancelOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('ইমেইল প্রয়োজন', 400));
    }

    console.log('🔍 Cancelling OTP for:', email);

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    // OTP ডেটা ক্লিয়ার
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    console.log('✅ OTP cancelled successfully for:', email);

    res.status(200).json({
        success: true,
        message: 'OTP বাতিল করা হয়েছে'
    });
});

// ============================================================
// ✅ রিসেট টোকেন বাতিল করুন
// ============================================================
exports.cancelResetToken = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('ইমেইল প্রয়োজন', 400));
    }

    console.log('🔍 Cancelling reset token for:', email);

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    // রিসেট টোকেন ডেটা ক্লিয়ার
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log('✅ Reset token cancelled successfully for:', email);

    res.status(200).json({
        success: true,
        message: 'রিসেট টোকেন বাতিল করা হয়েছে'
    });
});

// ================================================================
// ✅ ৯. উভয় পদ্ধতি একসাথে (অপশনাল)
// ================================================================

exports.sendResetOptions = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('দয়া করে ইমেইল দিন', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('এই ইমেইলে কোনো ইউজার নেই', 404));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    user.otp = {
        code: otpHash,
        expires: otpExpiry
    };
    await user.save({ validateBeforeSave: false });

    try {
        await sendResetOptionsEmail(user, resetToken, otp);

        res.status(200).json({
            success: true,
            message: 'রিসেট লিংক ও OTP ইমেইলে পাঠানো হয়েছে'
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.otp = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('ইমেইল পাঠাতে সমস্যা হয়েছে', 500));
    }
});

// ================================================================
// ✅ ১০. প্রোফাইল পাওয়া
// ================================================================

exports.getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    res.status(200).json({
        success: true,
        user: user.toJSON()
    });
});

// ================================================================
// ✅ ১১. প্রোফাইল আপডেট
// ================================================================

exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, phone, profile } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (profile) updates.profile = { ...req.user.profile, ...profile };

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
    );

    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    res.status(200).json({
        success: true,
        user: user.toJSON()
    });
});

// ================================================================
// ✅ ১২. পাসওয়ার্ড পরিবর্তন
// ================================================================

exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('বর্তমান ও নতুন পাসওয়ার্ড দিন', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    if (!(await user.matchPassword(currentPassword))) {
        return next(new AppError('বর্তমান পাসওয়ার্ড সঠিক নয়', 401));
    }

    await user.changePassword(newPassword);

    await createSendToken(user, 200, res);
});

// ================================================================
// ✅ ১৩. অ্যাকাউন্ট ডিলিট
// ================================================================

exports.deleteAccount = catchAsync(async (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return next(new AppError('পাসওয়ার্ড প্রয়োজন', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new AppError('ইউজার পাওয়া যায়নি', 404));
    }

    if (!(await user.matchPassword(password))) {
        return next(new AppError('পাসওয়ার্ড সঠিক নয়', 401));
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: 'অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে'
    });
});