// backend/models/User.js
// Version: 3.3.0 - বিকল্প ইমেইল যোগ

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'দয়া করে নাম দিন'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'দয়া করে ইমেইল দিন'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'সঠিক ইমেইল দিন (যেমন: user@example.com)']
    },
    _pendingAltEmail: { type: String, default: null },
    phone: {
        type: String,
        sparse: true,
        trim: true,
        match: [/^(?:\+880|0)1[3-9]\d{8}$/, 'সঠিক ফোন নম্বর দিন']
    },
    password: {
        type: String,
        required: [true, 'দয়া করে পাসওয়ার্ড দিন'],
        minlength: 6,
        select: false
    },
    profile: {
        fullName: { type: String, trim: true, default: '' },
        dob: { type: Date, default: null },
        gender: { 
            type: String, 
            enum: ['male', 'female', 'other', ''],
            default: '' 
        },
        nationality: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        altEmail: { type: String, trim: true, default: '' }, // ✅ নতুন
        altEmailVerified: { type: Boolean, default: false }, // ✅ নতুন
        address: { type: String, trim: true, default: '' },
        district: { type: String, trim: true, default: '' },
        org: { type: String, trim: true, default: '' },
        class: { type: String, trim: true, default: '' },
        section: { type: String, trim: true, default: '' },
        board: { type: String, trim: true, default: '' },
        educationYear: { type: String, trim: true, default: '' },
        rollNumber: { type: String, trim: true, default: '' },
        registrationNumber: { type: String, trim: true, default: '' },
        socialLinks: {
            facebook: { type: String, trim: true, default: '' },
            linkedin: { type: String, trim: true, default: '' },
            github: { type: String, trim: true, default: '' },
            youtube: { type: String, trim: true, default: '' },
            website: { type: String, trim: true, default: '' }
        },
        preferences: {
            favoriteSubjects: { type: [String], default: [] },
            preferredLanguage: { 
                type: String, 
                enum: ['bn', 'en', 'both'], 
                default: 'bn' 
            },
            quizType: { 
                type: String, 
                enum: ['mcq', 'blank', 'all'], 
                default: 'all' 
            },
            studyGoal: { type: String, trim: true, default: '' }
        },
        avatar: { type: String, default: '' }
    },
    social_providers: {
        google: {
            id: { type: String, default: null },
            email: { type: String, default: null },
            avatar: { type: String, default: null },
            connected: { type: Boolean, default: false }
        },
        facebook: {
            id: { type: String, default: null },
            email: { type: String, default: null },
            avatar: { type: String, default: null },
            connected: { type: Boolean, default: false }
        }
    },
    stats: {
        totalQuizzes: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 },
        timesHundred: { type: Number, default: 0 },
        lastLogin: { type: Date, default: null }
    },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false, index: true },
    resetMethod: { type: String, enum: ['primary', 'altEmail'], default: 'primary' }, // ✅ নতুন
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    role: {
        type: String,
        enum: ['user', 'academic', 'non-academic', 'admin'],
        default: 'user'
    },
    otp: {
        code: { type: String },
        expires: { type: Date }
    }
}, {
    timestamps: true
});

// ============================================================
// ✅ MIDDLEWARE
// ============================================================

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    if (update.password) {
        const salt = await bcrypt.genSalt(12);
        update.password = await bcrypt.hash(update.password, salt);
    }
});

// ============================================================
// ✅ INSTANCE METHODS
// ============================================================

userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changePassword = async function(newPassword) {
    this.password = newPassword;
    this.updatedAt = new Date();
    await this.save();
    return this;
};

userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.verificationToken;
    delete obj.verificationExpires;
    delete obj.otp;
    return obj;
};

// ============================================================
// ✅ STATIC METHODS
// ============================================================

userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email }).select('+password');
    if (!user) return null;
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return null;
    return user;
};

module.exports = mongoose.model('User', userSchema);