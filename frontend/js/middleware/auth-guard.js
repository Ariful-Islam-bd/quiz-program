// frontend/js/middleware/auth-guard.js
// Version: 1.0.0 - রাউট প্রোটেকশন মিডলওয়্যার

import { authService } from '../services/AuthService.js';
import { storageService } from '../services/StorageService.js';

export class AuthGuard {
    /**
     * ✅ পেজ অ্যাক্সেস চেক
     * @param {string} page - পেজ নাম ('welcome', 'quiz', 'profile', 'academia')
     * @param {Object} navigation - নেভিগেশন অবজেক্ট
     * @returns {boolean} - অ্যাক্সেস অনুমোদিত কিনা
     */
    static check(page, navigation) {
        // ✅ পাবলিক পেজ (লগইন ছাড়া অ্যাক্সেস)
        const publicPages = ['welcome', 'academia'];
        
        // ✅ প্রাইভেট পেজ (লগইন প্রয়োজন)
        const privatePages = ['quiz', 'profile', 'settings'];
        
        // ✅ পাবলিক পেজ সবসময় অ্যাক্সেসযোগ্য
        if (publicPages.includes(page)) {
            return true;
        }
        
        // ✅ প্রাইভেট পেজ চেক
        if (privatePages.includes(page)) {
            // ✅ Guest Mode চেক
            if (storageService.getGuestMode()) {
                // Guest Mode-এ সীমিত অ্যাক্সেস
                if (page === 'profile') {
                    // Guest Mode-এ প্রোফাইল পেজ সীমিত
                    if (window.app?.showToast) {
                        window.app.showToast('ℹ️ প্রোফাইল দেখতে লগইন করুন', 'warning');
                    }
                    // ✅ Guest Mode-এ প্রোফাইল পেজে যেতে দেবেন না, হোমে রিডাইরেক্ট
                    navigation?.navigateTo('welcome');
                    return false;
                }
                // ✅ অন্যান্য প্রাইভেট পেজে Guest Mode অনুমোদিত (সীমিত ফিচার)
                return true;
            }
            
            // ✅ অথেন্টিকেশন চেক
            if (!authService.isAuthenticated()) {
                // ✅ লগইন পেজ দেখান
                if (window.app?.authPage) {
                    window.app.authPage.show('login');
                }
                
                // ✅ টোস্ট মেসেজ
                if (window.app?.showToast) {
                    window.app.showToast('🔐 এই পেজ দেখতে লগইন করুন', 'warning');
                }
                
                return false;
            }
            
            return true;
        }
        
        // ✅ অজানা পেজ - সেফটি
        return true;
    }

    /**
     * ✅ বর্তমান ইউজারের রোল চেক
     * @param {string} requiredRole - প্রয়োজনীয় রোল ('admin', 'user')
     * @returns {boolean}
     */
    static hasRole(requiredRole) {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        const userRole = user.role || 'user';
        if (requiredRole === 'admin') {
            return userRole === 'admin';
        }
        return true;
    }

    /**
     * ✅ ইউজার ভেরিফাইড কিনা
     * @returns {boolean}
     */
    static isVerified() {
        const user = authService.getCurrentUser();
        return user?.isVerified === true;
    }

    /**
     * ✅ অ্যাকাউন্ট অ্যাকটিভ কিনা
     * @returns {boolean}
     */
    static isActive() {
        const user = authService.getCurrentUser();
        return user?.isActive !== false;
    }
}