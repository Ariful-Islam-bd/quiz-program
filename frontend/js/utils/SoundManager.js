// frontend/js/utils/SoundManager.js
// Version: 1.0.0 - Web Audio API ভিত্তিক সাউন্ড সিস্টেম

import { storageService } from '../services/StorageService.js';
import { vibrationManager } from './VibrationManager.js';

export class SoundManager {
    constructor() {
        this.enabled = storageService.getSoundEnabled() !== false;
        this.audioCtx = null;
        this.initialized = false;
        this.vibration = vibrationManager;
    }

    /**
     * অডিও কনটেক্সট ইনিশিয়ালাইজ করা (ইউজার ইন্টারঅ্যাকশনের পর)
     */
    #initAudio() {
        if (this.initialized) return this.audioCtx;
        
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            // সাইলেন্ট ফেইল - Web Audio API সাপোর্ট না করলে
            this.audioCtx = null;
        }
        return this.audioCtx;
    }

    /**
     * সাউন্ড এনাবল/ডিজেবল করা
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

     /**
     * সাউন্ড + ভাইব্রেশন বাজানোর মেইন মেথড
     */
    play(type) {
        // ✅ ভাইব্রেশন বাজানো
        this.vibration.vibrate(type);

        // সাউন্ড বাজানো (যদি এনাবলড থাকে)
        if (!this.enabled) return;
        
        const ctx = this.#initAudio();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        switch(type) {
            case 'correct': this.#playCorrect(ctx); break;
            case 'wrong': this.#playWrong(ctx); break;
            case 'timeout': this.#playTimeout(ctx); break;
            case 'complete': this.#playComplete(ctx); break;
            default: break;
        }
    }

    /**
     * ✅ সঠিক উত্তরের সাউন্ড - পজিটিভ টিং
     * Oscillator: সাইন ওয়েব
     * ফ্রিকোয়েন্সি: 880Hz (A5 নোট)
     * সময়: 0.3 সেকেন্ড
     * ভলিউম: 0.3
     */
    #playCorrect(ctx) {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = 880;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }

    /**
     * ❌ ভুল উত্তরের সাউন্ড - নেতিবাচক বাজzer
     * Oscillator: সয়টুথ ওয়েব
     * ফ্রিকোয়েন্সি: 200Hz → 100Hz ড্রপ
     * সময়: 0.4 সেকেন্ড
     * ভলিউম: 0.2
     */
    #playWrong(ctx) {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
            osc.type = 'sawtooth';
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }

    /**
     * ⏰ সময় শেষের সাউন্ড - ৩টি শর্ট বীপ
     * Oscillator: সাইন ওয়েব
     * ফ্রিকোয়েন্সি: 800Hz
     * 3টি বীপ (প্রতি 0.15 সেকেন্ড)
     * প্রতিটি বীপ: 0.08 সেকেন্ড
     * ভলিউম: 0.15
     */
    #playTimeout(ctx) {
        try {
            const totalBeeps = 3;
            const beepDuration = 0.08;
            const gapDuration = 0.15;
            
            for (let i = 0; i < totalBeeps; i++) {
                const startTime = ctx.currentTime + (i * (beepDuration + gapDuration));
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = 800;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + beepDuration);
                
                osc.start(startTime);
                osc.stop(startTime + beepDuration);
            }
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }

    /**
     * 🎉 কুইজ সম্পূর্ণ - উৎসবের সুর
     * 4টি ক্রমবর্ধমান নোট: C5, E5, G5, C6
     * প্রতিটি নোট: 0.12 সেকেন্ড ব্যবধান
     * নোট সময়: 0.2 সেকেন্ড
     * ভলিউম: 0.2
     */
    #playComplete(ctx) {
        try {
            const notes = [
                { freq: 523, duration: 0.25 }, // C5
                { freq: 659, duration: 0.25 }, // E5
                { freq: 784, duration: 0.25 }, // G5
                { freq: 1047, duration: 0.35 } // C6
            ];
            
            const gap = 0.1;
            
            notes.forEach((note, i) => {
                const startTime = ctx.currentTime + (i * (note.duration + gap));
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.value = note.freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
                
                osc.start(startTime);
                osc.stop(startTime + note.duration);
            });
        } catch (e) {
            // সাইলেন্ট ফেইল
        }
    }
}