// backend/utils/config.js
// Version: 1.0.0 - Environment variable validator
// Purpose: Fail-fast validation of critical environment variables at boot

/**
 * Required environment variables (production)
 * App start হবে না যদি এগুলোর কোনোটি missing থাকে।
 */
const REQUIRED_ENV_VARS = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

const OPTIONAL_ENV_VARS = {
    NODE_ENV: 'development',
    PORT: '5000',
    JWT_EXPIRE: '7d',
    JWT_REFRESH_EXPIRE: '30d',
    FRONTEND_URL: 'http://localhost:5000',
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_PORT: '587',
    SMTP_USER: '',
    SMTP_PASS: '',
    EMAIL_FROM: 'Quiz Program <noreply@quizprogram.com>',
    R2_ACCOUNT_ID: '',
    R2_ACCESS_KEY: '',
    R2_SECRET_KEY: '',
    R2_BUCKET: '',
    R2_PUBLIC_URL: ''
};


const validateEnv = () => {
    const missing = [];

    REQUIRED_ENV_VARS.forEach((key) => {
        if (!process.env[key] || process.env[key].trim() === '') {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        console.error('\n❌ FATAL: Missing required environment variables:');
        missing.forEach((key) => console.error(`   • ${key}`));
        console.error('\n💡 Hint: Copy .env.example to .env and fill in the values.');
        console.error('   On Render: Set these in Dashboard → Environment.\n');
        process.exit(1);
    }

    // Apply defaults for optional vars (don't override existing)
    Object.entries(OPTIONAL_ENV_VARS).forEach(([key, defaultValue]) => {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
        }
    });


    // ✅ Cloudinary storage (R2 migration complete — R2 warning disabled)
    const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingCloudinary = cloudinaryVars.filter((key) => !process.env[key] || process.env[key].trim() === '');
    if (missingCloudinary.length > 0) {
        console.warn('\n⚠️  WARNING: Cloudinary storage not fully configured.');
        console.warn(`   Missing: ${missingCloudinary.join(', ')}`);
        console.warn('   File uploads (avatar, cover) will fail until configured.\n');
    }

    /*/ ✅ Email warning — check correct variable names
    const emailVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    const missingEmail = emailVars.filter((key) => !process.env[key] || process.env[key].trim() === '');
    if (missingEmail.length > 0) {
        console.warn('\n⚠️  WARNING: Email not fully configured.');
        console.warn(`   Missing: ${missingEmail.join(', ')}`);
        console.warn('   Emails (verification, OTP, welcome) will fail until configured.\n');
    } */

        // ✅ Email warning — Resend API config
    const emailVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    const missingEmail = emailVars.filter((key) => !process.env[key] || process.env[key].trim() === '');
    if (missingEmail.length > 0) {
        console.warn('\n⚠️  WARNING: Resend email not fully configured.');
        console.warn(`   Missing: ${missingEmail.join(', ')}`);
        console.warn('   Emails (verification, OTP, welcome) will fail until configured.\n');
    }

    console.log('✅ Environment variables validated.');
};


const getEnv = (key, fallback = null) => {
    return process.env[key] || fallback;
};


const isProduction = () => process.env.NODE_ENV === 'production';


const isDevelopment = () => process.env.NODE_ENV !== 'production';

module.exports = {
    validateEnv,
    getEnv,
    isProduction,
    isDevelopment,
    REQUIRED_ENV_VARS,
    OPTIONAL_ENV_VARS
};