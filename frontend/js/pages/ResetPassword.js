// frontend/js/pages/ResetPassword.js
// Version: 1.0.0 - Complete Reset Password Page
// Description: পাসওয়ার্ড রিসেট পেজের সম্পূর্ণ লজিক

import { apiService } from '../services/ApiService.js';

export class ResetPasswordPage {
    constructor() {
        this.token = new URLSearchParams(window.location.search).get('token');
        this.elements = this.#cacheElements();
        this.#init();
    }

    #cacheElements() {
        return {
            loading: document.getElementById('resetLoading'),
            form: document.getElementById('resetForm'),
            invalid: document.getElementById('resetInvalid'),
            success: document.getElementById('resetSuccess'),
            newPassword: document.getElementById('resetNewPassword'),
            confirmPassword: document.getElementById('resetConfirmPassword'),
            submitBtn: document.getElementById('resetSubmitBtn'),
            strengthBar: document.getElementById('resetStrengthBar'),
            strengthText: document.getElementById('resetStrengthText'),
            passwordError: document.getElementById('resetPasswordError'),
            confirmError: document.getElementById('resetConfirmError'),
            formElement: document.getElementById('resetPasswordForm'),
            loginBtn: document.getElementById('resetLoginBtn'),
            hiddenUsername: document.getElementById('resetUsername')
        };
    }

    #init() {
        // টোকেন নেই → ইনভ্যালিড দেখান
        if (!this.token) {
            this.#showState('invalid');
            return;
        }

        // টোকেন ভ্যালিডেশন
        this.#validateToken();
        this.#setupEventListeners();
    }

    #setupEventListeners() {
        // ✅ লগইন বাটন ইভেন্ট
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.#handleLoginClick();
            });
        }

        // পাসওয়ার্ড স্ট্রেংথ
        this.elements.newPassword.addEventListener('input', () => {
            this.#updateStrength();
            this.#clearError('password');
        });

        // কনফর্মেশন
        this.elements.confirmPassword.addEventListener('input', () => {
            this.#validateConfirm();
            this.#clearError('confirm');
        });

        // টগল পাসওয়ার্ড ভিজিবিলিটি
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const target = document.getElementById(this.dataset.target);
                if (target) {
                    const isPassword = target.type === 'password';
                    target.type = isPassword ? 'text' : 'password';
                    this.textContent = isPassword ? '🙈' : '👁️';
                }
            });
        });

        // ফর্ম সাবমিট
        this.elements.formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.#handleSubmit();
        });

        // Enter কী-তে সাবমিট
        this.elements.newPassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.confirmPassword.focus();
            }
        });

        this.elements.confirmPassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.formElement.dispatchEvent(new Event('submit'));
            }
        });
    }

    async #validateToken() {
        console.log('🔍 Validating token...');
        
        try {
            const data = await apiService.get('/auth/validate-reset-token', { token: this.token });

            if (data.valid) {
                console.log('✅ Token is valid - showing form');
                this.#syncUsernameField(data);
                this.#showState('form');
                // ফর্মে অটো-ফোকাস
                setTimeout(() => {
                    this.elements.newPassword?.focus();
                }, 300);
            } else {
                console.log('❌ Token is invalid - showing invalid state');
                this.#showState('invalid');
            }
        } catch (error) {
            console.error('❌ Token validation error:', error);
            this.#showState('invalid');
        }
    }

    #syncUsernameField(data) {
        const hiddenUser = this.elements.hiddenUsername;
        if (!hiddenUser) {
            console.warn('⚠️ Hidden username field not found in DOM');
            return;
        }
        
        // প্রায়োরিটি: server response → JWT decode → token থেকে guess
        let email = data?.email || data?.username || '';
        
        if (!email && this.token) {
            // JWT হলে payload decode করে email বের করার চেষ্টা
            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));
                email = payload?.email || payload?.sub || '';
            } catch (e) {
                // JWT নয়, তাই ignore
            }
        }
        
        hiddenUser.value = email;
        console.log('🔐 Reset form username synced:', email ? `✓ (${email})` : '✗ (empty)');
    }

    async #handleSubmit() {
        const newPassword = this.elements.newPassword.value;
        const confirmPassword = this.elements.confirmPassword.value;

        // ✅ ভ্যালিডেশন
        // ১. পাসওয়ার্ড খালি চেক
        if (!newPassword) {
            this.#showError('password', 'নতুন পাসওয়ার্ড দিন');
            this.elements.newPassword.focus();
            return;
        }

        // ২. পাসওয়ার্ড দৈর্ঘ্য চেক
        if (newPassword.length < 6) {
            this.#showError('password', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
            this.elements.newPassword.focus();
            return;
        }

        // ৩. কনফর্ম পাসওয়ার্ড চেক
        if (!confirmPassword) {
            this.#showError('confirm', 'পাসওয়ার্ড নিশ্চিত করুন');
            this.elements.confirmPassword.focus();
            return;
        }

        // ৪. পাসওয়ার্ড ম্যাচ চেক
        if (newPassword !== confirmPassword) {
            this.#showError('confirm', 'পাসওয়ার্ড মিলছে না');
            this.elements.confirmPassword.focus();
            return;
        }

        // ✅ ডিজেবল বাটন - লোডিং স্টেট
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.textContent = '⏳ প্রক্রিয়াকরণ...';
        this.elements.submitBtn.classList.add('disabled');

        try {
            const data = await apiService.resetPassword(this.token, newPassword);

            if (data.success) {
                // ✅ সাফল্য
                this.#showState('success');
                this.#setupLoginButton();
            } else {
                // ❌ ব্যর্থতা
                this.#showError('password', data.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে');
                this.elements.submitBtn.disabled = false;
                this.elements.submitBtn.textContent = '🔄 পাসওয়ার্ড রিসেট করুন';
                this.elements.submitBtn.classList.remove('disabled');
            }
        } catch (error) {
            console.error('Reset error:', error);
            this.#showError('password', 'সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.textContent = '🔄 পাসওয়ার্ড রিসেট করুন';
            this.elements.submitBtn.classList.remove('disabled');
        }
    }

    #setupLoginButton() {
        const loginBtn = document.querySelector('#resetSuccess .btn-success');
        if (loginBtn) {
            // পুরনো ইভেন্ট রিমুভ
            const newBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
            
            // নতুন ইভেন্ট যোগ
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.#handleLoginClick();
            });
        }
    }

    #handleLoginClick() {
        console.log('🔐 Login button clicked from reset success page');
        
        // ✅ অ্যাপের AuthPage ব্যবহার করুন
        if (window.app?.authPage) {
            // ১. রিসেট পেজ থেকে হোমে নেভিগেট
            window.location.href = '/';
            
            // ২. একটু দেরি করে লগইন মডাল খুলুন (পেজ লোড হতে)
            setTimeout(() => {
                if (window.app?.authPage) {
                    window.app.authPage.show('login');
                }
            }, 300);
        } else {
            // ✅ অ্যাপ না থাকলে সরাসরি হোমে যান
            window.location.href = '/';
        }
    }

    #updateStrength() {
        const password = this.elements.newPassword.value;
        const bar = this.elements.strengthBar;
        const text = this.elements.strengthText;

        if (!password) {
            bar.style.width = '0%';
            bar.className = '';
            text.textContent = '';
            return;
        }

        // ✅ স্ট্রেংথ ক্যালকুলেশন
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        strength = Math.min(strength, 5);

        const levels = ['', 'দুর্বল', 'দুর্বল', 'মাঝারি', 'শক্তিশালী', 'খুব শক্তিশালী'];
        const classes = ['', 'weak', 'weak', 'medium', 'strong', 'very-strong'];
        const colors = ['', '#f44336', '#f44336', '#ff9800', '#4caf50', '#2e7d32'];

        bar.style.width = (strength * 25) + '%';
        bar.className = classes[strength] || '';
        text.textContent = `পাসওয়ার্ড শক্তি: ${levels[strength] || ''}`;
        text.style.color = colors[strength] || '#e0e0e0';
    }

    #validateConfirm() {
        const newPass = this.elements.newPassword.value;
        const confirmPass = this.elements.confirmPassword.value;
        const errorEl = this.elements.confirmError;

        if (confirmPass && newPass !== confirmPass) {
            errorEl.textContent = '❌ পাসওয়ার্ড মিলছে না';
            errorEl.style.color = 'var(--danger)';
            return false;
        }
        errorEl.textContent = '';
        return true;
    }

    #showState(state) {
        const states = ['loading', 'form', 'invalid', 'success'];
        states.forEach(id => {
            const el = document.getElementById(`reset${id.charAt(0).toUpperCase() + id.slice(1)}`);
            if (el) {
                el.style.display = id === state ? 'block' : 'none';
            }
        });

        // ✅ সাফল্য পেজে লগইন বাটন এনাবল করুন
        if (state === 'success' && this.elements.loginBtn) {
            this.elements.loginBtn.disabled = false;
            this.elements.loginBtn.style.opacity = '1';
            this.elements.loginBtn.style.pointerEvents = 'auto';
        }
    }

    #showError(field, message) {
        const errorMap = {
            password: this.elements.passwordError,
            confirm: this.elements.confirmError
        };

        const errorEl = errorMap[field];
        if (errorEl) {
            errorEl.textContent = `❌ ${message}`;
            errorEl.style.color = 'var(--danger)';
        }
    }

    #clearError(field) {
        const errorMap = {
            password: this.elements.passwordError,
            confirm: this.elements.confirmError
        };

        const errorEl = errorMap[field];
        if (errorEl) {
            errorEl.textContent = '';
        }
    }
}

// ✅ অটো-ইনিশিয়ালাইজ
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordPage();
});