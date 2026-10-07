// frontend/js/utils/session.js
// Version: 1.0.0 - সেশন ম্যানেজমেন্ট

import { storageService } from '../services/StorageService.js';
import { authService } from '../services/AuthService.js';

const SESSION_CONFIG = {
    INACTIVITY_TIMEOUT: 15 * 60 * 1000, // ১৫ মিনিট
    CHECK_INTERVAL: 60 * 1000, // প্রতি ১ মিনিটে চেক
    REMEMBER_ME_DURATION: 7 * 24 * 60 * 60 * 1000, // ৭ দিন
};

class SessionManager {
    constructor() {
        this.inactivityTimer = null;
        this.intervalId = null;
        this.isActive = false;
        this._lastActivity = Date.now();
        this._bindEvents();
    }

    /**
     * ✅ সেশন মনিটরিং শুরু
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this._lastActivity = Date.now();
        
        // ✅ ইন্টারভ্যাল শুরু
        this.intervalId = setInterval(() => {
            this._checkInactivity();
        }, SESSION_CONFIG.CHECK_INTERVAL);
        
        console.log('✅ Session monitoring started');
    }

    /**
     * ✅ সেশন মনিটরিং বন্ধ
     */
    stop() {
        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        console.log('⏹️ Session monitoring stopped');
    }

    /**
     * ✅ ইউজার অ্যাক্টিভিটি রিসেট
     */
    resetActivity() {
        this._lastActivity = Date.now();
        this._resetInactivityTimer();
    }

    /**
     * ✅ নিষ্ক্রিয়তা চেক
     */
    _checkInactivity() {
        // ✅ Remember Me চেক করুন
        if (storageService.getRememberMe()) {
            // Remember Me enabled - বেশি সময় দেবেন
            const timeSinceLastActivity = Date.now() - this._lastActivity;
            if (timeSinceLastActivity > SESSION_CONFIG.REMEMBER_ME_DURATION) {
                this._handleTimeout();
            }
            return;
        }

        // ✅ সাধারণ নিষ্ক্রিয়তা চেক
        const timeSinceLastActivity = Date.now() - this._lastActivity;
        if (timeSinceLastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
            this._handleTimeout();
        }
    }

    /**
     * ✅ ইনঅ্যাক্টিভিটি টাইমার রিসেট
     */
    _resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        
        // ✅ Remember Me চেক
        const timeout = storageService.getRememberMe() 
            ? SESSION_CONFIG.REMEMBER_ME_DURATION 
            : SESSION_CONFIG.INACTIVITY_TIMEOUT;
        
        this.inactivityTimer = setTimeout(() => {
            this._handleTimeout();
        }, timeout);
    }

    /**
     * ✅ টাইমআউট হ্যান্ডলার
     */
    _handleTimeout() {
        // ✅ ইতিমধ্যে লগআউট হয়ে গেলে কিছু করবেন না
        if (!authService.isAuthenticated()) return;
        
        // ✅ লগআউট
        authService.logout();
        
        // ✅ টোস্ট মেসেজ
        if (window.app?.showToast) {
            window.app.showToast('⏰ নিষ্ক্রিয়তার কারণে লগআউট করা হয়েছে', 'warning');
        }
        
        // ✅ লগইন পেজ দেখান
        if (window.app?.authPage) {
            window.app.authPage.show('login');
        }
        
        // ✅ নেভিগেট
        if (window.app?.navigation) {
            window.app.navigation.navigateTo('welcome');
        }
    }

    /**
     * ✅ ইউজার ইন্টারঅ্যাকশন ইভেন্ট বাইন্ড
     */
    _bindEvents() {
        const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
        
        const handler = () => {
            if (!this.isActive) return;
            this.resetActivity();
        };
        
        events.forEach(event => {
            document.addEventListener(event, handler, { passive: true });
        });
        
        // ✅ কাস্টম ইভেন্ট
        document.addEventListener('auth-state-change', () => {
            if (authService.isAuthenticated()) {
                this.start();
            } else {
                this.stop();
            }
        });
    }

    /**
     * ✅ বর্তমান সেশন স্ট্যাটাস
     * @returns {Object}
     */
    getStatus() {
        return {
            isActive: this.isActive,
            lastActivity: this._lastActivity,
            timeSinceLastActivity: Date.now() - this._lastActivity,
            isAuthenticated: authService.isAuthenticated(),
            rememberMe: storageService.getRememberMe()
        };
    }
}

export const sessionManager = new SessionManager();