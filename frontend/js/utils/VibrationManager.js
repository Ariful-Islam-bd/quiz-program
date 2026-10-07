// frontend/js/utils/VibrationManager.js
// Version: 1.0.0
// Description: ভাইব্রেশন ম্যানেজমেন্ট - Web Vibration API ব্যবহার করে হ্যাপটিক ফিডব্যাক প্রদান

import { storageService } from '../services/StorageService.js';

export class VibrationManager {
    constructor() {
        this.enabled = storageService.getVibrationEnabled() !== false;
        this.supported = this.#checkSupport();
    }

    /**
     * ভাইব্রেশন API সাপোর্টেড কিনা চেক করা
     */
    #checkSupport() {
        return 'vibrate' in navigator;
    }

    /**
     * ভাইব্রেশন এনাবল/ডিজেবল করা
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * ভাইব্রেশন সাপোর্টেড কিনা
     */
    isSupported() {
        return this.supported;
    }

    /**
     * ভাইব্রেশন বাজানোর মেইন মেথড
     * @param {string} type - 'correct', 'wrong', 'timeout', 'complete'
     */
    vibrate(type) {
        // চেক: ভাইব্রেশন এনাবলড, সাপোর্টেড, এবং টাইপ ভ্যালিড
        if (!this.enabled || !this.supported) return;

        const pattern = this.#getPattern(type);
        if (!pattern) return;

        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // সাইলেন্ট ফেইল - কিছু ব্রাউজারে vibrate() থ্রো করতে পারে
        }
    }

    /**
     * টাইপ অনুযায়ী কম্পন প্যাটার্ন রিটার্ন করা
     */
    #getPattern(type) {
        switch(type) {
            case 'correct':
                return 50; // ৫০ms হালকা কম্পন
            case 'wrong':
                return 100; // ১০০ms লম্বা কম্পন
            case 'timeout':
                return [50, 100, 50, 100, 50]; // ৩টি শর্ট বীপ
            case 'complete':
                return [100, 50, 100, 50, 200, 100, 100]; // উৎসবের প্যাটার্ন
            default:
                return null;
        }
    }

    /**
     * কম্পন বন্ধ করা (যদি চলতে থাকে)
     */
    cancel() {
        if (!this.supported) return;
        try {
            navigator.vibrate(0);
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }
}

export const vibrationManager = new VibrationManager();