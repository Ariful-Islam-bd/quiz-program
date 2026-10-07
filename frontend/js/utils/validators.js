// frontend/js/utils/validators.js
// Version: 1.0.0 - ফর্ম ভ্যালিডেশন ইউটিলিটি

/**
 * ✅ ইমেইল ভ্যালিডেশন
 * @param {string} email - ইমেইল অ্যাড্রেস
 * @returns {boolean} - সঠিক ইমেইল কিনা
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // ✅ স্ট্যান্ডার্ড ইমেইল প্যাটার্ন
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email.trim());
}

/**
 * ✅ পাসওয়ার্ড ভ্যালিডেশন
 * @param {string} password - পাসওয়ার্ড
 * @returns {Object} - { valid: boolean, message: string, strength: number }
 */
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'পাসওয়ার্ড দিন', strength: 0 };
    }
    
    const len = password.length;
    let strength = 0;
    let message = '';
    
    // ✅ দৈর্ঘ্য চেক
    if (len < 6) {
        return { valid: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', strength: 0 };
    }
    
    // ✅ শক্তি নির্ণয়
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (len >= 8) strength++;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasDigit) strength++;
    if (hasSpecial) strength++;
    
    // ✅ ভ্যালিড
    if (len >= 6) {
        return { valid: true, message: '', strength: Math.min(strength, 5) };
    }
    
    return { valid: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', strength: 0 };
}

/**
 * ✅ নাম ভ্যালিডেশন
 * @param {string} name - ইউজারের নাম
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, message: 'নাম দিন' };
    }
    
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return { valid: false, message: 'নাম দিন' };
    }
    
    if (trimmed.length < 2) {
        return { valid: false, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' };
    }
    
    if (trimmed.length > 50) {
        return { valid: false, message: 'নাম ৫০ অক্ষরের বেশি হতে পারবে না' };
    }
    
    // ✅ শুধু বাংলা, ইংরেজি, সংখ্যা, স্পেস অনুমোদিত
    const pattern = /^[a-zA-Z\u0980-\u09FF0-9\s.]+$/;
    if (!pattern.test(trimmed)) {
        return { valid: false, message: 'নামে শুধু অক্ষর ও সংখ্যা ব্যবহার করুন' };
    }
    
    return { valid: true, message: '' };
}

/**
 * ✅ ফোন নম্বর ভ্যালিডেশন (ভবিষ্যতের জন্য)
 * @param {string} phone - ফোন নম্বর
 * @returns {boolean}
 */
export function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // ✅ বাংলাদেশি ফোন নম্বর প্যাটার্ন
    const pattern = /^(?:\+880|0)1[3-9]\d{8}$/;
    return pattern.test(phone.trim());
}

/**
 * ✅ পাসওয়ার্ড কনফর্মেশন চেক
 * @param {string} password - পাসওয়ার্ড
 * @param {string} confirm - কনফর্ম পাসওয়ার্ড
 * @returns {boolean}
 */
export function validatePasswordMatch(password, confirm) {
    return password === confirm && password.length > 0;
}

/**
 * ✅ স্ট্রিং খালি কিনা
 * @param {string} value - ইনপুট ভ্যালু
 * @returns {boolean}
 */
export function isEmpty(value) {
    return !value || typeof value !== 'string' || value.trim().length === 0;
}

/**
 * ✅ ইমেইল ফরম্যাট ফরম্যাট করা
 * @param {string} email - ইমেইল
 * @returns {string} - ট্রিম করা ইমেইল
 */
export function sanitizeEmail(email) {
    if (!email) return '';
    return email.trim().toLowerCase();
}

/**
 * ✅ পাসওয়ার্ড শক্তি লেবেল
 * @param {number} strength - 0-5
 * @returns {string} - লেবেল
 */
export function getPasswordStrengthLabel(strength) {
    const labels = ['', 'খুব দুর্বল', 'দুর্বল', 'মাঝারি', 'শক্তিশালী', 'খুব শক্তিশালী'];
    return labels[strength] || '';
}

/**
 * ✅ পাসওয়ার্ড শক্তি রং
 * @param {number} strength - 0-5
 * @returns {string} - CSS রং
 */
export function getPasswordStrengthColor(strength) {
    const colors = ['', '#f44336', '#f44336', '#ff9800', '#4caf50', '#2e7d32'];
    return colors[strength] || '#e0e0e0';
}