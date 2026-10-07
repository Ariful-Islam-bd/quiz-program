// backend/scripts/test-email.js
// Version: 1.0.1 - Fixed .env path

const path = require('path');

// ✅ সঠিক পাথ - রুট ডিরেক্টরির .env
require('dotenv').config({ 
    path: path.resolve(__dirname, '../../.env') 
});

const { sendOTPEmail, sendResetPasswordEmail, sendWelcomeEmail } = require('../services/emailService');

// ✅ টেস্ট কনফিগারেশন - আপনার ইমেইল দিন
const TEST_EMAIL = process.env.TEST_EMAIL || 'mdarifinsadat+testuser1@gmail.com';
const TEST_USER = {
    name: 'টেস্ট ইউজার',
    email: TEST_EMAIL
};

// ✅ কালার কনসোল আউটপুট
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function logSuccess(msg) { console.log(`${colors.green}✅ ${msg}${colors.reset}`); }
function logError(msg) { console.log(`${colors.red}❌ ${msg}${colors.reset}`); }
function logInfo(msg) { console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`); }
function logWarning(msg) { console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`); }

async function testEmailSystem() {
    console.log('\n🚀 ইমেইল সিস্টেম টেস্ট শুরু...\n');
    console.log('═'.repeat(50));

    // ✅ ১. এনভায়রনমেন্ট চেক
    console.log('\n📋 ১. এনভায়রনমেন্ট ভেরিয়েবল চেক:');
    console.log(`   .env পাথ: ${path.resolve(__dirname, '../../.env')}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ সেট' : '❌ সেট নেই'}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ সেট' : '❌ সেট নেই'}`);
    console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ সেট নেই'}`);
    console.log(`   PORT: ${process.env.PORT || '❌ সেট নেই'}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logError('\n❌ EMAIL_USER বা EMAIL_PASS সেট নেই!');
        console.log('\n🔧 সমাধান:');
        console.log('   ১. রুট ডিরেক্টরিতে .env ফাইল আপডেট করুন:');
        console.log('      D:\\quiz_avatar_crop-circle_ver-1-0-0\\.env');
        console.log('   ২. নিচের লাইনগুলো যোগ করুন:');
        console.log('      EMAIL_USER=mdarifinsadat@gmail.com');
        console.log('      EMAIL_PASS=your_16_digit_app_password');
        console.log('   ৩. আবার টেস্ট চালান');
        return;
    }

    console.log('\n' + '═'.repeat(50));

    try {
        // ✅ ২. ওয়েলকাম ইমেইল টেস্ট
        console.log('\n📧 ২. ওয়েলকাম ইমেইল পাঠানো হচ্ছে...');
        await sendWelcomeEmail(TEST_USER);
        logSuccess('ওয়েলকাম ইমেইল পাঠানো হয়েছে!');
        logInfo(`📩 চেক করুন: ${TEST_EMAIL}\n`);

        // ✅ ৩. OTP ইমেইল টেস্ট
        console.log('📧 ৩. OTP ইমেইল পাঠানো হচ্ছে...');
        await sendOTPEmail(TEST_USER, '123456');
        logSuccess('OTP ইমেইল পাঠানো হয়েছে!');
        logInfo(`📩 চেক করুন: ${TEST_EMAIL}\n`);

        // ✅ ৪. রিসেট লিংক ইমেইল টেস্ট
        console.log('📧 ৪. রিসেট লিংক ইমেইল পাঠানো হচ্ছে...');
        await sendResetPasswordEmail(TEST_USER, 'test_reset_token_123');
        logSuccess('রিসেট লিংক ইমেইল পাঠানো হয়েছে!');
        logInfo(`📩 চেক করুন: ${TEST_EMAIL}\n`);

        console.log('═'.repeat(50));
        console.log(`\n${colors.green}🎉 সব টেস্ট পাস হয়েছে!${colors.reset}`);
        console.log('\n💡 টিপস:');
        console.log('   - ইমেইল না পেলে স্প্যাম ফোল্ডার চেক করুন');
        console.log('   - Gmail App Password সঠিক কিনা চেক করুন');
        console.log('   - নেটওয়ার্ক কানেকশন চেক করুন');

    } catch (error) {
        console.log('═'.repeat(50));
        logError(`\n❌ টেস্ট ব্যর্থ: ${error.message}`);

        console.log('\n🔧 সমাধান:');
        console.log('   ১. Gmail App Password জেনারেট করুন:');
        console.log('      Google Account → Security → 2-Step Verification → App Passwords');
        console.log('   ২. .env ফাইল আপডেট করুন:');
        console.log('      EMAIL_PASS=your_16_digit_app_password');
        console.log('   ৩. নেটওয়ার্ক কানেকশন চেক করুন');

        if (error.code === 'EAUTH') {
            console.log('\n   💡 Gmail App Password গাইড:');
            console.log('   1. https://myaccount.google.com/ এ যান');
            console.log('   2. Security → 2-Step Verification → চালু করুন');
            console.log('   3. App Passwords → Generate');
            console.log('   4. ১৬ ডিজিটের পাসওয়ার্ড কপি করুন');
            console.log('   5. .env ফাইলে EMAIL_PASS=... সেট করুন');
        }
    }
}

// ✅ টেস্ট রান
testEmailSystem();