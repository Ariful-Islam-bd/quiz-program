// backend/services/emailService.js
// Version: 2.0.0 - Cloudflare Pages-aware URL generation
// Changes: Split architecture support — frontend URLs point to Cloudflare Pages, backend URLs to Render

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ✅ FIX: Import frontend URL helper from config (backend-safe, no window.location)
const { getFrontendBaseURL } = require('../config/constants');

// ============================================================
// ✅ SMTP ট্রান্সপোর্টার (Gmail App Password সহ)
// ============================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // ← App Password ব্যবহার করুন
    },
    timeout: 30000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
});

// ============================================================
// ✅ FIX: Helper functions for URL generation (Cloudflare Pages-aware)
// ============================================================

/**
 * Frontend base URL — Cloudflare Pages in production, localhost in dev
 * Example: 'https://your-quiz.pages.dev' or 'http://localhost:5000'
 */
const getFrontendURL = () => {
    return getFrontendBaseURL();
};

/**
 * Backend base URL — Render in production, localhost in dev
 * Used ONLY for the alt-email verification page (backend-rendered HTML response)
 */
const getBackendURL = () => {
    return (
        process.env.BACKEND_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        `http://localhost:${process.env.PORT || 5000}`
    );
};

/**
 * Build password reset URL (frontend route)
 */
const buildResetURL = (token) => {
    return `${getFrontendURL()}/reset-password?token=${encodeURIComponent(token)}`;
};

/**
 * Build alt-email reset URL (frontend route with method flag)
 */
const buildAltEmailResetURL = (token) => {
    return `${getFrontendURL()}/reset-password?token=${encodeURIComponent(token)}&method=altEmail`;
};

/**
 * Build alt-email verification URL (BACKEND route — returns HTML page)
 * ⚠️ This is a backend URL because the verify-alt-email-page endpoint serves HTML.
 */
const buildVerifyAltEmailURL = (token) => {
    return `${getBackendURL()}/api/v1/auth/verify-alt-email-page?token=${encodeURIComponent(token)}`;
};

// ============================================================
// ✅ ইমেইল পাঠানোর মূল ফাংশন
// ============================================================
exports.sendEmail = async (options) => {
    try {
        // ✅ ভ্যালিডেশন
        if (!options.email || !options.email.includes('@')) {
            throw new Error('ইনভ্যালিড ইমেইল অ্যাড্রেস');
        }

        const mailOptions = {
            from: `"কুইজ প্রোগ্রাম" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html || options.text || '',
            text: options.text || ''
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        console.log('✅ To:', options.email);

        return info;

    } catch (error) {
        console.error('❌ Email error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });

        // ✅ ইউজার-ফ্রেন্ডলি এরর
        if (error.code === 'EAUTH') {
            throw new Error('ইমেইল সার্ভার অথেন্টিকেশন ব্যর্থ হয়েছে। Gmail App Password চেক করুন।');
        } else if (error.code === 'ESOCKET') {
            throw new Error('ইমেইল সার্ভারে সংযোগ করতে সমস্যা হয়েছে। নেটওয়ার্ক চেক করুন।');
        } else if (error.code === 'ECONNECTION') {
            throw new Error('ইমেইল সার্ভারে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।');
        } else {
            throw new Error('ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
    }
};

// ============================================================
// ✅ ওয়েলকাম ইমেইল
// ============================================================
exports.sendWelcomeEmail = async (user) => {
    // ✅ FIX: Cloudflare Pages-aware URL
    const loginURL = getFrontendURL();

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h2 style="color: #2196f3; text-align: center; font-size: 24px; margin-bottom: 16px;">স্বাগতম, ${user.name}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 16px;">
                আপনি সফলভাবে <strong>কুইজ প্রোগ্রাম</strong>-এ অ্যাকাউন্ট তৈরি করেছেন।
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                এখন আপনি:
            </p>
            <ul style="font-size: 16px; line-height: 1.8; color: #333; padding-left: 20px; margin-bottom: 20px;">
                <li>🧠 ইন্টারেক্টিভ কুইজ খেলতে পারবেন</li>
                <li>📖 একাডেমিয়া কন্টেন্ট দেখতে পারবেন</li>
                <li>👤 আপনার প্রোফাইল ম্যানেজ করতে পারবেন</li>
                <li>🏆 লিডারবোর্ডে আপনার স্কোর দেখতে পারবেন</li>
            </ul>
            <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
                    🚀 শুরু করুন: <a href="${loginURL}" style="color: #2196f3; text-decoration: none; font-weight: 600;">কুইজ প্রোগ্রাম</a>
                </p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.email,
        subject: '🎉 স্বাগতম! অ্যাকাউন্ট তৈরি হয়েছে',
        html
    });
};

// ============================================================
// ✅ পাসওয়ার্ড রিসেট লিংক ইমেইল
// ============================================================
exports.sendResetPasswordEmail = async (user, resetToken) => {
    // ✅ FIX: Cloudflare Pages-aware URL
    const resetURL = buildResetURL(resetToken);

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🔑</span>
            </div>
            <h2 style="color: #f44336; text-align: center; font-size: 24px; margin-bottom: 16px;">পাসওয়ার্ড রিসেট</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আপনার পাসওয়ার্ড রিসেট করতে নিচের বাটনে ক্লিক করুন:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="
                    display: inline-block;
                    padding: 14px 40px;
                    background: #2196f3;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                ">পাসওয়ার্ড রিসেট করুন</a>
            </div>
            <div style="background: #f8f9fa; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 0;">
                    ⏰ এই লিংক <strong>১০ মিনিট</strong> পর্যন্ত বৈধ থাকবে।
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 4px 0 0 0;">
                    🔒 যদি আপনি এই রিকোয়েস্ট না করে থাকেন, তাহলে এই ইমেইল ইগনোর করুন।
                </p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.email,
        subject: '🔑 পাসওয়ার্ড রিসেট করুন',
        html
    });
};

// ============================================================
// ✅ OTP ইমেইল
// ============================================================
exports.sendOTPEmail = async (user, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🔑</span>
            </div>
            <h2 style="color: #2196f3; text-align: center; font-size: 24px; margin-bottom: 16px;">পাসওয়ার্ড রিসেট - OTP</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আপনার পাসওয়ার্ড রিসেট করতে নিচের ৬-ডিজিট কোডটি ব্যবহার করুন:
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <div style="
                    display: inline-block;
                    background: #f5f5f5;
                    padding: 20px 40px;
                    border-radius: 12px;
                    font-size: 36px;
                    font-weight: 700;
                    letter-spacing: 12px;
                    color: #2196f3;
                    font-family: monospace;
                    border: 2px dashed #2196f3;
                ">
                    ${otp}
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 0;">
                    ⏰ এই কোড <strong>৫ মিনিট</strong> পর্যন্ত বৈধ থাকবে।
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 4px 0 0 0;">
                    🔒 যদি আপনি এই রিকোয়েস্ট না করে থাকেন, তাহলে এই ইমেইল ইগনোর করুন।
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.email,
        subject: '🔑 আপনার পাসওয়ার্ড রিসেট OTP',
        html
    });
};

// ============================================================
// ✅ উভয় পদ্ধতির সমন্বিত ইমেইল (অপশনাল)
// ============================================================
exports.sendResetOptionsEmail = async (user, resetToken, otp) => {
    // ✅ FIX: Cloudflare Pages-aware URL
    const resetURL = buildResetURL(resetToken);

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🔑</span>
            </div>
            <h2 style="color: #2196f3; text-align: center; font-size: 24px; margin-bottom: 16px;">পাসওয়ার্ড রিসেট</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আপনার পাসওয়ার্ড রিসেট করতে নিচের যে কোনো একটি পদ্ধতি ব্যবহার করুন:
            </p>

            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 30px 0;">
                <!-- লিংক পদ্ধতি -->
                <div style="flex: 1; min-width: 200px; background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
                    <h3 style="color: #2196f3; margin-top: 0; font-size: 18px;">🔗 লিংক পদ্ধতি</h3>
                    <a href="${resetURL}" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: #2196f3;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                    ">লিংকে ক্লিক করুন</a>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">⏰ ১০ মিনিট বৈধ</p>
                </div>

                <!-- OTP পদ্ধতি -->
                <div style="flex: 1; min-width: 200px; background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
                    <h3 style="color: #4caf50; margin-top: 0; font-size: 18px;">🔢 OTP পদ্ধতি</h3>
                    <div style="
                        display: inline-block;
                        background: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 28px;
                        font-weight: 700;
                        letter-spacing: 8px;
                        color: #4caf50;
                        font-family: monospace;
                        border: 2px dashed #4caf50;
                    ">
                        ${otp}
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">⏰ ৫ মিনিট বৈধ</p>
                </div>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.email,
        subject: '🔑 পাসওয়ার্ড রিসেট - ২টি পদ্ধতি',
        html
    });
};

// ============================================================
// ✅ বিকল্প ইমেইলে রিসেট লিংক পাঠান
// ============================================================
exports.sendResetPasswordToAltEmail = async (user, resetToken) => {
    // ✅ FIX: Cloudflare Pages-aware URL with method flag
    const resetURL = buildAltEmailResetURL(resetToken);

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🔑</span>
            </div>
            <h2 style="color: #f44336; text-align: center; font-size: 24px; margin-bottom: 16px;">পাসওয়ার্ড রিসেট</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আমরা আপনার <strong>বিকল্প ইমেইল</strong> ব্যবহার করে একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি।
            </p>
            
            <div style="background: #f0f8ff; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 14px; color: #333;">
                    📌 <strong>প্রধান ইমেইল:</strong> ${user.email}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #333;">
                    ⏰ লিংকটি <strong>১০ মিনিট</strong> পর্যন্ত বৈধ থাকবে।
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="
                    display: inline-block;
                    padding: 14px 40px;
                    background: #f44336;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
                ">পাসওয়ার্ড রিসেট করুন</a>
            </div>

            <div style="background: #fff3cd; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    ⚠️ আপনি যদি এই রিকোয়েস্ট না করে থাকেন, তাহলে এই ইমেইল ইগনোর করুন 
                    এবং আপনার পাসওয়ার্ড পরিবর্তন করুন।
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.profile.altEmail,
        subject: '🔑 পাসওয়ার্ড রিসেট - বিকল্প ইমেইল',
        html
    });
};

// ============================================================
// ✅ নিরাপত্তা নোটিফিকেশন (প্রধান ইমেইলে)
// ============================================================
exports.sendSecurityNotification = async (user) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🔒</span>
            </div>
            <h2 style="color: #f44336; text-align: center; font-size: 24px; margin-bottom: 16px;">নিরাপত্তা নোটিফিকেশন</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আপনার <strong>বিকল্প ইমেইল</strong> ব্যবহার করে পাসওয়ার্ড রিসেট করা হয়েছে।
            </p>
            
            <div style="background: #f0f8ff; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 14px; color: #333;">
                    📌 <strong>বিকল্প ইমেইল:</strong> ${user.profile.altEmail}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #333;">
                    ⏰ সময়: ${new Date().toLocaleString('bn-BD')}
                </p>
            </div>

            <div style="background: #fff3cd; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    ⚠️ আপনি যদি এই রিকোয়েস্ট না করে থাকেন, তাহলে অবিলম্বে আমাদের সাথে যোগাযোগ করুন 
                    এবং আপনার পাসওয়ার্ড পরিবর্তন করুন।
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: user.email,
        subject: '🔒 নিরাপত্তা সতর্কতা: পাসওয়ার্ড রিসেট করা হয়েছে',
        html
    });
};

// ============================================================
// ✅ বিকল্প ইমেইল ভেরিফিকেশন ইমেইল
// ============================================================
exports.sendAltEmailVerificationEmail = async (user, token, altEmail) => {
    // ✅ FIX: Backend URL (this endpoint returns HTML, so it must point to the backend)
    const verifyURL = buildVerifyAltEmailURL(token);

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">📧</span>
            </div>
            <h2 style="color: #4caf50; text-align: center; font-size: 24px; margin-bottom: 16px;">বিকল্প ইমেইল ভেরিফিকেশন</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 8px;">
                হ্যালো <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
                আপনার অ্যাকাউন্টের জন্য এই ইমেইলটি বিকল্প ইমেইল হিসেবে ব্যবহার করতে নিচের বাটনে ক্লিক করুন:
            </p>

            <div style="background: #f0f8ff; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 14px; color: #333;">
                    📧 <strong>বিকল্প ইমেইল:</strong> ${altEmail}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #333;">
                    ⏰ এই লিংক <strong>৩০ মিনিট</strong> পর্যন্ত বৈধ থাকবে।
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyURL}" style="
                    display: inline-block;
                    padding: 14px 40px;
                    background: #4caf50;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                ">ইমেইল ভেরিফাই করুন</a>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এর উত্তর দেবেন না।
            </p>
        </div>
    `;

    return exports.sendEmail({
        email: altEmail,
        subject: '📧 আপনার বিকল্প ইমেইল ভেরিফাই করুন',
        html
    });
};