// frontend/js/services/StorageService.js
// Version: 2.1.0 - সম্পূর্ণ সেশন ক্লিয়ার যোগ

import { STORAGE_KEYS } from '../utils/constants.js';

class StorageService {
    #storage = localStorage;
    #avatarCache = new Map();

    // ============================================================
    // ✅ প্রোফাইল
    // ============================================================
    saveProfile(profile) {
        const existing = this.getProfile();
        const merged = { ...existing, ...profile };
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));
        return merged;
    }

    getProfile() {
        const data = this.#storage.getItem(STORAGE_KEYS.PROFILE);
        return data ? JSON.parse(data) : {};
    }

    updateProfile(updates) {
        const profile = this.getProfile();
        Object.assign(profile, updates);
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        return profile;
    }

    getProfileName() {
        return this.getProfile().name || 'অতিথি';
    }

    getProfileInitials() {
        const name = this.getProfileName();
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'A';
    }

    // ✅ নতুন: সম্পূর্ণ প্রোফাইল ক্লিয়ার (ডিফল্ট সেট)
    clearProfile() {
        const defaultProfile = {
            name: '',
            email: '',
            org: '',
            class: '',
            section: '',
            board: '',
            avatarDataUrl: null,
            coverImage: null
        };
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
        console.log('✅ Profile cleared successfully');
    }

    // ============================================================
    // ✅ কভার ইমেজ
    // ============================================================
    saveCoverImage(dataUrl) {
        const profile = this.getProfile();
        profile.coverImage = dataUrl;
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }

    getCoverImage() {
        return this.getProfile().coverImage || null;
    }

    removeCoverImage() {
        const profile = this.getProfile();
        delete profile.coverImage;
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }

    hasCoverImage() {
        return !!this.getProfile().coverImage;
    }

    // ✅ নতুন: কভার ইমেজ ক্লিয়ার
    clearCoverImage() {
        const profile = this.getProfile();
        if (profile) {
            delete profile.coverImage;
            this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        }
        console.log('✅ Cover image cleared');
    }

    // ============================================================
    // ✅ অ্যাভাটার
    // ============================================================
    saveAvatar(avatarDataUrl) {
        const profile = this.getProfile();
        
        if (avatarDataUrl) {
            profile.avatarDataUrl = avatarDataUrl;
            const isLarge = avatarDataUrl.length > 500 * 1024;
            if (isLarge) {
                this.#saveToIndexedDB(avatarDataUrl).catch(e => {
                    console.warn('IndexedDB save failed:', e);
                });
            } else {
                this.#avatarCache.set('full', avatarDataUrl);
            }
        } else {
            delete profile.avatarDataUrl;
            this.#avatarCache.delete('full');
            this.#removeFromIndexedDB().catch(e => {
                console.warn('IndexedDB remove failed:', e);
            });
        }
        
        this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        
        try {
            window.dispatchEvent(new CustomEvent('avatar-updated'));
        } catch (e) {
            // CustomEvent সাপোর্ট না থাকলে ইগনোর
        }
    }

    getAvatar() {
        const profile = this.getProfile();
        return profile.avatarDataUrl || null;
    }

    // ✅ নতুন: অ্যাভাটার ক্লিয়ার
    clearAvatar() {
        const profile = this.getProfile();
        if (profile) {
            delete profile.avatarDataUrl;
            this.#storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        }
        this.#avatarCache.clear();
        this.#removeFromIndexedDB().catch(e => {
            console.warn('IndexedDB remove failed:', e);
        });
        console.log('✅ Avatar cleared');
    }

    async #removeFromIndexedDB() {
        try {
            const db = await this.#getDB();
            const tx = db.transaction('avatars', 'readwrite');
            const store = tx.objectStore('avatars');
            store.delete('full');
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }

    async getFullAvatar() {
        try {
            const full = await this.#getFromIndexedDB();
            if (full) return full;
            const cached = this.#avatarCache.get('full');
            if (cached) return cached;
            return this.getAvatar();
        } catch (e) {
            return this.getAvatar();
        }
    }

    // ============================================================
    // ✅ IndexedDB ম্যানেজমেন্ট
    // ============================================================
    #getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AvatarDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('avatars')) {
                    db.createObjectStore('avatars', { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async #saveToIndexedDB(dataUrl) {
        try {
            const db = await this.#getDB();
            const tx = db.transaction('avatars', 'readwrite');
            const store = tx.objectStore('avatars');
            store.put({ id: 'full', data: dataUrl });
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        } catch (e) {
            console.warn('IndexedDB save failed, using localStorage:', e);
            this.#avatarCache.set('full', dataUrl);
        }
    }

    async #getFromIndexedDB() {
        try {
            const db = await this.#getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction('avatars', 'readonly');
                const store = tx.objectStore('avatars');
                const request = store.get('full');
                request.onsuccess = () => resolve(request.result?.data || null);
                request.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    }

    // ============================================================
    // ✅ রিসাইজড ইমেজ
    // ============================================================
    saveResizedImage(dataUrl) {
        if (dataUrl) {
            this.#storage.setItem(STORAGE_KEYS.RESIZED_IMAGE, dataUrl);
        } else {
            this.#storage.removeItem(STORAGE_KEYS.RESIZED_IMAGE);
        }
    }

    getResizedImage() {
        return this.#storage.getItem(STORAGE_KEYS.RESIZED_IMAGE) || null;
    }

    // ============================================================
    // ✅ সেটিংস
    // ============================================================
    saveSettings(settings) {
        this.setSelectedTime(settings.selectedTime);
        this.setDarkMode(settings.darkMode);
        this.setFullTimerMode(settings.fullTimerMode);
    }

    getSettings() {
        return {
            selectedTime: this.getSelectedTime(),
            darkMode: this.isDarkMode(),
            timesHundred: this.getTimesHundred(),
            fullTimerMode: this.getFullTimerMode()
        };
    }

    setSelectedTime(seconds) {
        this.#storage.setItem(STORAGE_KEYS.SELECTED_TIME, String(seconds));
    }

    getSelectedTime() {
        return parseInt(this.#storage.getItem(STORAGE_KEYS.SELECTED_TIME) || '60', 10);
    }

    setDarkMode(enabled) {
        this.#storage.setItem(STORAGE_KEYS.DARK_MODE, enabled ? '1' : '0');
        if (enabled) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    isDarkMode() {
        return this.#storage.getItem(STORAGE_KEYS.DARK_MODE) === '1';
    }

    setFullTimerMode(enabled) {
        this.#storage.setItem(STORAGE_KEYS.FULL_TIMER_MODE, enabled ? '1' : '0');
    }

    getFullTimerMode() {
        return this.#storage.getItem(STORAGE_KEYS.FULL_TIMER_MODE) === '1';
    }

    // ============================================================
    // ✅ টাইমস হান্ড্রেড
    // ============================================================
    incrementTimesHundred() {
        const current = this.getTimesHundred();
        this.#storage.setItem(STORAGE_KEYS.TIMES_HUNDRED, String(current + 1));
    }

    getTimesHundred() {
        return parseInt(this.#storage.getItem(STORAGE_KEYS.TIMES_HUNDRED) || '0', 10);
    }

    // ============================================================
    // ✅ নোটিফিকেশন সেটিংস
    // ============================================================
    setToastEnabled(enabled) {
        this.#storage.setItem('toast_enabled', enabled ? '1' : '0');
    }

    getToastEnabled() {
        const val = this.#storage.getItem('toast_enabled');
        return val === null ? true : val === '1';
    }

    setSoundEnabled(enabled) {
        this.#storage.setItem('sound_enabled', enabled ? '1' : '0');
    }

    getSoundEnabled() {
        const val = this.#storage.getItem('sound_enabled');
        return val === null ? true : val === '1';
    }

    setVibrationEnabled(enabled) {
        this.#storage.setItem('vibration_enabled', enabled ? '1' : '0');
    }

    getVibrationEnabled() {
        const val = this.#storage.getItem('vibration_enabled');
        return val === null ? true : val === '1';
    }

    // ============================================================
    // ✅ লিডারবোর্ড
    // ============================================================
    saveScore(name, score) {
        const leaderboard = this.getLeaderboard(50);
        leaderboard.push({
            name,
            score: parseFloat(score.toFixed(2)),
            date: new Date().toISOString()
        });
        leaderboard.sort((a, b) => b.score - a.score);
        const top50 = leaderboard.slice(0, 50);
        this.#storage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(top50));
        return top50;
    }

    getLeaderboard(limit = 5) {
        const data = this.#storage.getItem(STORAGE_KEYS.LEADERBOARD);
        const leaderboard = data ? JSON.parse(data) : [];
        return leaderboard.slice(0, limit);
    }

    clearLeaderboard() {
        this.#storage.removeItem(STORAGE_KEYS.LEADERBOARD);
    }

    // ============================================================
    // ✅ টোকেন
    // ============================================================
    setToken(token) {
        this.#storage.setItem(STORAGE_KEYS.TOKEN, token);
    }

    getToken() {
        return this.#storage.getItem(STORAGE_KEYS.TOKEN);
    }

    clearToken() {
        this.#storage.removeItem(STORAGE_KEYS.TOKEN);
    }

    setRefreshToken(token) {
        this.#storage.setItem('refresh_token', token);
    }

    getRefreshToken() {
        return this.#storage.getItem('refresh_token');
    }

    clearRefreshToken() {
        this.#storage.removeItem('refresh_token');
    }

    // ============================================================
    // ✅ ইউজার ডেটা
    // ============================================================
    saveUser(user) {
        if (user) {
            const existingProfile = this.getProfile();
            const mergedProfile = {
                ...existingProfile,
                name: user.name || existingProfile.name,
                email: user.email || existingProfile.email,
                org: user.org || existingProfile.org,
                class: user.class || existingProfile.class,
                section: user.section || existingProfile.section,
                board: user.board || existingProfile.board
            };
            this.saveProfile(mergedProfile);
            this.#storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
    }

    getUser() {
        const data = this.#storage.getItem(STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
    }

    clearUser() {
        this.#storage.removeItem(STORAGE_KEYS.USER);
    }

    // ============================================================
    // ✅ Remember Me
    // ============================================================
    setRememberMe(enabled) {
        this.#storage.setItem(STORAGE_KEYS.REMEMBER_ME, enabled ? '1' : '0');
    }

    getRememberMe() {
        return this.#storage.getItem(STORAGE_KEYS.REMEMBER_ME) === '1';
    }

    clearRememberMe() {
        this.#storage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }

    // ============================================================
    // ✅ Guest Mode (রেখেছি কিন্তু ব্যবহার করব না)
    // ============================================================
    setGuestMode(enabled) {
        this.#storage.setItem(STORAGE_KEYS.GUEST_MODE, enabled ? '1' : '0');
    }

    getGuestMode() {
        return this.#storage.getItem(STORAGE_KEYS.GUEST_MODE) === '1';
    }

    // ============================================================
    // ✅ সেশন
    // ============================================================
    setLastLogin(timestamp) {
        this.#storage.setItem(STORAGE_KEYS.LAST_LOGIN, timestamp);
    }

    getLastLogin() {
        return this.#storage.getItem(STORAGE_KEYS.LAST_LOGIN);
    }

    clearSession() {
        this.#storage.removeItem(STORAGE_KEYS.LAST_LOGIN);
        this.#storage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        this.#storage.removeItem(STORAGE_KEYS.USER);
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: সম্পূর্ণ সেশন ক্লিয়ার (লগআউটের জন্য)
    // ============================================================
    clearAllSessionData() {
        console.log('🗑️ Clearing all session data...');
        
        // ১. প্রোফাইল ক্লিয়ার
        this.clearProfile();
        
        // ২. অ্যাভাটার ক্লিয়ার
        this.clearAvatar();
        
        // ৩. কভার ইমেজ ক্লিয়ার
        this.clearCoverImage();
        
        // ৪. ইউজার ডেটা ক্লিয়ার
        this.clearUser();
        
        // ৫. টোকেন ক্লিয়ার
        this.clearToken();
        this.clearRefreshToken();
        
        // ৬. Remember Me ক্লিয়ার
        this.clearRememberMe();
        
        // ৭. সেশন ক্লিয়ার
        this.clearSession();
        
        // ৮. অ্যাভাটার ক্যাশ ক্লিয়ার
        this.clearAvatarCache();
        
        // ৯. রিসাইজড ইমেজ ক্লিয়ার
        this.saveResizedImage(null);
        
        console.log('✅ All session data cleared successfully');
    }

    clearAvatarCache() {
        this.#avatarCache.clear();
    }

    // ============================================================
    // ✅ ইউটিলিটি
    // ============================================================
    getItem(key) {
        return this.#storage.getItem(key);
    }

    setItem(key, value) {
        this.#storage.setItem(key, value);
    }

    removeItem(key) {
        this.#storage.removeItem(key);
    }

    clearAll() {
        this.#storage.clear();
        this.#avatarCache.clear();
    }

    getSize() {
        return this.#storage.length;
    }

    getAllKeys() {
        const keys = [];
        for (let i = 0; i < this.#storage.length; i++) {
            keys.push(this.#storage.key(i));
        }
        return keys;
    }
}

export const storageService = new StorageService();