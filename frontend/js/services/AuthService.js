// frontend/js/services/AuthService.js
// Version: 1.1.0 - লগআউট ফিক্স

import { apiService } from './ApiService.js';
import { storageService } from './StorageService.js';
import { STORAGE_KEYS } from '../utils/constants.js';

class AuthService {
    /**
     * ✅ ইউজার লগইন
     */
    async login(email, password, remember = false) {
        try {
            const response = await apiService.post('/auth/login', { 
                email: email.trim(), 
                password 
            });
            
            if (response.success && response.token && response.user) {
                // ✅ Token সংরক্ষণ
                storageService.setToken(response.token);
                
                // ✅ ইউজার ডেটা সংরক্ষণ
                storageService.saveUser(response.user);
                
                // ✅ Remember Me সেটিং
                if (remember) {
                    storageService.setRememberMe(true);
                }
                
                // ✅ লগইন টাইমস্ট্যাম্প
                storageService.setLastLogin(new Date().toISOString());
                
                // ✅ অ্যাভাটার ক্যাশ ক্লিয়ার
                storageService.clearAvatarCache();
                
                return {
                    success: true,
                    token: response.token,
                    user: response.user
                };
            }
            
            return {
                success: false,
                message: response.message || 'লগইন ব্যর্থ হয়েছে'
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'সার্ভারে সমস্যা হয়েছে'
            };
        }
    }

    /**
     * ✅ ইউজার রেজিস্টার
     */
    async register(name, email, password, profile = {}) {
        try {
            const response = await apiService.post('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                profile
            });
            
            if (response.success && response.token && response.user) {
                storageService.setToken(response.token);
                storageService.saveUser(response.user);
                storageService.setRememberMe(true);
                
                return {
                    success: true,
                    token: response.token,
                    user: response.user
                };
            }
            
            return {
                success: false,
                message: response.message || 'রেজিস্টার ব্যর্থ হয়েছে'
            };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.message || 'সার্ভারে সমস্যা হয়েছে'
            };
        }
    }

    /**
     * ✅ ✅ ✅ লগআউট (সম্পূর্ণ ফিক্স)
     */
    logout() {
        console.log('🔓 Logging out...');
        
        // ✅ ১. সম্পূর্ণ সেশন ডেটা ক্লিয়ার
        storageService.clearAllSessionData();
        
        // ✅ ২. Guest Mode ডিজেবল (আমরা ব্যবহার করছি না)
        storageService.setGuestMode(false);
        
        // ✅ ৩. অ্যাপ রিলোড
        window.location.reload();
        
        console.log('✅ Logout successful');
    }

    /**
     * ✅ ইউজার অথেন্টিকেটেড কিনা চেক
     */
    isAuthenticated() {
        const token = storageService.getToken();
        if (!token) return false;
        return !this.isTokenExpired(token);
    }

    /**
     * ✅ Token Expired কিনা চেক
     */
    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            return expiryTime < Date.now();
        } catch (error) {
            return true;
        }
    }

    /**
     * ✅ Token থেকে ইউজার ইনফো বের করা
     */
    decodeToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            return null;
        }
    }

    /**
     * ✅ বর্তমান ইউজার পাওয়া
     */
    getCurrentUser() {
        return storageService.getUser();
    }

    /**
     * ✅ Guest Mode চেক
     */
    isGuestMode() {
        return storageService.getGuestMode();
    }

    /**
     * ✅ Remember Me স্ট্যাটাস
     */
    getRememberMe() {
        return storageService.getRememberMe();
    }

    /**
     * ✅ লগইন স্ট্যাটাস চেঞ্জের জন্য ইভেন্ট ডিসপ্যাচ
     */
    dispatchAuthEvent() {
        window.dispatchEvent(new CustomEvent('auth-state-change', {
            detail: { isAuthenticated: this.isAuthenticated() }
        }));
    }
}

export const authService = new AuthService();