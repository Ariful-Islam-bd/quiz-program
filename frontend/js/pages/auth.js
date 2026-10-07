// frontend/js/pages/auth.js
// Version: 1.5.0 - সাফল্য বার্তা ম্যানেজমেন্ট যোগ

import { authService } from '../services/AuthService.js';
import { apiService } from '../services/ApiService.js';
import { storageService } from '../services/StorageService.js';
import { validateEmail, validatePassword, validateName } from '../utils/validators.js';

export class AuthPage {
    constructor(navigation) {
        this.navigation = navigation;
        this.currentMode = 'login';
        this.isLoading = false;
        this.container = document.getElementById('authModalContent');
        this.overlay = document.getElementById('authModal');
        this._otpTimerInterval = null;
        this._linkTimerInterval = null;
        this._isModalOpen = false;
        this._selectedMethod = 'link';
        this._otpInputs = [];
        this._otpSent = false;
        this._linkSent = false;
        
        this._bindEvents();
        this._closeOnOutsideClick();
        this._handleEscapeKey();
    }

    // ============================================================
    // ✅ মডাল শো/হাইড
    // ============================================================
    show(mode = 'login') {
        console.log('📱 AuthPage.show() called with mode:', mode);
        
        if (this._isModalOpen) {
            this.hide();
        }
        
        this.currentMode = mode;
        this.render(mode);
        
        this.overlay.style.display = 'flex';
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this._isModalOpen = true;
        
        setTimeout(() => {
            const firstInput = this.container.querySelector('input:not([disabled])');
            if (firstInput) {
                firstInput.focus();
            }
        }, 150);
    }

    hide() {
        console.log('📱 AuthPage.hide() called');
        this.overlay.style.display = 'none';
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.isLoading = false;
        this._isModalOpen = false;
        
        if (this._otpTimerInterval) {
            clearInterval(this._otpTimerInterval);
            this._otpTimerInterval = null;
        }
        
        this._selectedMethod = 'link';
        this._otpInputs = [];
    }

    // ============================================================
    // ✅ ফর্ম রেন্ডার
    // ============================================================
    render(mode) {
        switch(mode) {
            case 'login': this._renderLogin(); break;
            case 'register': this._renderRegister(); break;
            case 'forgot': this._renderForgotPassword(); break;
            default: this._renderLogin();
        }
    }

    // ============================================================
    // ✅ লগইন ফর্ম
    // ============================================================
    _renderLogin() {
        this.container.innerHTML = `
            <button class="auth-close-btn" id="authCloseBtn">✕</button>
            <div class="auth-form-container">
                <div class="auth-brand">
                    <span class="brand-icon">🔐</span>
                    <h2>লগইন করুন</h2>
                    <p>আপনার অ্যাকাউন্টে লগইন করুন</p>
                </div>

                <form class="auth-form" id="authForm" autocomplete="on">
                    <div class="form-group">
                        <label for="authEmail">📧 ইমেইল <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">📧</span>
                            <input 
                                type="email" 
                                id="authEmail" 
                                placeholder="আপনার ইমেইল লিখুন"
                                required
                                autocomplete="email"
                            />
                        </div>
                        <div class="error-text" id="emailError"></div>
                    </div>

                    <div class="form-group">
                        <label for="authPassword">🔒 পাসওয়ার্ড <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input 
                                type="password" 
                                id="authPassword" 
                                placeholder="পাসওয়ার্ড লিখুন"
                                required
                                autocomplete="current-password"
                            />
                            <button type="button" class="toggle-password" data-target="authPassword">👁️</button>
                        </div>
                        <div class="error-text" id="passwordError"></div>
                    </div>

                    <div class="form-options">
                        <label class="remember-me">
                            <input type="checkbox" id="rememberMe" checked />
                            আমাকে মনে রাখবেন
                        </label>
                        <a href="#" class="forgot-link" data-mode="forgot">🔑 পাসওয়ার্ড ভুলে গেছেন?</a>
                    </div>

                    <button type="submit" class="btn-auth btn-primary" id="authSubmitBtn">
                        🔓 লগইন করুন
                    </button>

                    <div class="auth-footer">
                        নতুন অ্যাকাউন্ট? <a href="#" data-mode="register">একাউন্ট তৈরি করুন</a>
                    </div>

                    <div class="auth-divider">অথবা</div>

                    <div class="auth-social">
                        <button type="button" class="btn-social btn-phone" disabled>
                            <span class="social-icon">📱</span> ফোন (শীঘ্রই)
                        </button>
                        <button type="button" class="btn-social btn-google" disabled>
                            <span class="social-icon">🔵</span> Google (শীঘ্রই)
                        </button>
                        <button type="button" class="btn-social btn-facebook" disabled>
                            <span class="social-icon">🔷</span> Facebook (শীঘ্রই)
                        </button>
                    </div>
                </form>
            </div>
        `;
        this._attachFormEvents();
    }

    // ============================================================
    // ✅ রেজিস্টার ফর্ম
    // ============================================================
    _renderRegister() {
        this.container.innerHTML = `
            <button class="auth-close-btn" id="authCloseBtn">✕</button>
            <div class="auth-form-container">
                <div class="auth-brand">
                    <span class="brand-icon">📝</span>
                    <h2>নতুন অ্যাকাউন্ট</h2>
                    <p>একাউন্ট তৈরি করুন এবং শুরু করুন</p>
                </div>

                <form class="auth-form" id="authForm" autocomplete="on">
                    <div class="form-group">
                        <label for="authName">👤 নাম <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">👤</span>
                            <input 
                                type="text" 
                                id="authName" 
                                placeholder="আপনার নাম লিখুন"
                                required
                                autocomplete="name"
                            />
                        </div>
                        <div class="error-text" id="nameError"></div>
                    </div>

                    <div class="form-group">
                        <label for="authEmail">📧 ইমেইল <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">📧</span>
                            <input 
                                type="email" 
                                id="authEmail" 
                                placeholder="আপনার ইমেইল লিখুন"
                                required
                                autocomplete="email"
                            />
                        </div>
                        <div class="error-text" id="emailError"></div>
                    </div>

                    <div class="form-group">
                        <label for="authPassword">🔒 পাসওয়ার্ড <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input 
                                type="password" 
                                id="authPassword" 
                                placeholder="পাসওয়ার্ড লিখুন (৬+ অক্ষর)"
                                required
                                autocomplete="new-password"
                                minlength="6"
                            />
                            <button type="button" class="toggle-password" data-target="authPassword">👁️</button>
                        </div>
                        <div class="password-strength" id="passwordStrength">
                            <div class="strength-bar" id="strengthBar"></div>
                        </div>
                        <div class="password-strength-text" id="strengthText"></div>
                        <div class="error-text" id="passwordError"></div>
                    </div>

                    <div class="form-group">
                        <label for="authConfirmPassword">✅ পাসওয়ার্ড নিশ্চিত করুন <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">✅</span>
                            <input 
                                type="password" 
                                id="authConfirmPassword" 
                                placeholder="আবার পাসওয়ার্ড লিখুন"
                                required
                                autocomplete="new-password"
                            />
                            <button type="button" class="toggle-password" data-target="authConfirmPassword">👁️</button>
                        </div>
                        <div class="error-text" id="confirmError"></div>
                    </div>

                    <button type="submit" class="btn-auth btn-primary" id="authSubmitBtn">
                        🚀 অ্যাকাউন্ট তৈরি করুন
                    </button>

                    <div class="auth-footer">
                        ইতিমধ্যে অ্যাকাউন্ট আছে? <a href="#" data-mode="login">লগইন করুন</a>
                    </div>

                    <div class="auth-divider">অথবা</div>

                    <div class="auth-social">
                        <button type="button" class="btn-social btn-phone" disabled>
                            <span class="social-icon">📱</span> ফোন (শীঘ্রই)
                        </button>
                        <button type="button" class="btn-social btn-google" disabled>
                            <span class="social-icon">🔵</span> Google (শীঘ্রই)
                        </button>
                        <button type="button" class="btn-social btn-facebook" disabled>
                            <span class="social-icon">🔷</span> Facebook (শীঘ্রই)
                        </button>
                    </div>
                </form>
            </div>
        `;
        this._attachFormEvents();
        this._setupPasswordStrength();
    }

    // ============================================================
    // ✅ ফরগট পাসওয়ার্ড ফর্ম (সম্পূর্ণ ফিক্স)
    // ============================================================
    _renderForgotPassword() {
        this.container.innerHTML = `
            <button class="auth-close-btn" id="authCloseBtn">✕</button>
            <div class="auth-form-container">
                <div class="auth-brand">
                    <span class="brand-icon">🔑</span>
                    <h2>পাসওয়ার্ড রিসেট</h2>
                    <p>আপনার পাসওয়ার্ড রিসেট করুন</p>
                </div>

                <form class="auth-form" id="authForm" novalidate>
                    <input type="text" id="hiddenUsername" value="reset_user" 
                        style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;" 
                        aria-hidden="true" tabindex="-1" readonly />

                    <div class="form-group">
                        <label for="authEmail">📧 আপনার ইমেইল <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">📧</span>
                            <input 
                                type="email" 
                                id="authEmail" 
                                placeholder="আপনার ইমেইল লিখুন"
                                required
                                autocomplete="email"
                            />
                        </div>
                        <div class="error-text" id="emailError"></div>
                    </div>

                    <!-- ============================================ -->
                    <!-- ✅ রিসেট পদ্ধতি সিলেক্টর (আপডেটেড) -->
                    <!-- ============================================ -->
                    <div class="reset-method-selector" id="resetMethodSelector">
                        <button type="button" class="method-btn active" data-method="primary">
                            <span class="method-icon">📧</span>
                            প্রধান ইমেইল
                        </button>
                        <button type="button" class="method-btn" data-method="altEmail" id="altEmailMethodBtn">
                            <span class="method-icon">📨</span>
                            বিকল্প ইমেইল
                            <span class="method-badge" id="altEmailBadge">প্রয়োজন</span>
                        </button>
                        <button type="button" class="method-btn" data-method="otp">
                            <span class="method-icon">🔢</span>
                            OTP পদ্ধতি
                        </button>
                    </div>

                    <!-- ✅ বিকল্প ইমেইল ইনফো বার্তা -->
                    <div class="alt-email-info" id="altEmailInfo" style="display: none;">
                        <div class="info-box info-box-warning">
                            <span class="info-icon">ℹ️</span>
                            <span>বিকল্প ইমেইল ব্যবহার করতে হলে আপনার প্রোফাইলে একটি ভেরিফাইড বিকল্প ইমেইল সেট করা থাকতে হবে।</span>
                        </div>
                    </div>

                    <!-- ============================================ -->
                    <!-- OTP ইনপুট গ্রুপ -->
                    <!-- ============================================ -->
                    <div class="form-group" id="otpGroup" style="display: none;">
                        <label>🔢 OTP কোড</label>
                        <div class="otp-inputs">
                            <input type="text" maxlength="1" id="otp1" disabled autocomplete="one-time-code">
                            <input type="text" maxlength="1" id="otp2" disabled autocomplete="one-time-code">
                            <input type="text" maxlength="1" id="otp3" disabled autocomplete="one-time-code">
                            <input type="text" maxlength="1" id="otp4" disabled autocomplete="one-time-code">
                            <input type="text" maxlength="1" id="otp5" disabled autocomplete="one-time-code">
                            <input type="text" maxlength="1" id="otp6" disabled autocomplete="one-time-code">
                        </div>
                        <div class="error-text" id="otpError"></div>
                        <div class="resend-otp-container">
                            <button type="button" class="resend-otp-btn" id="resendOtpBtn" disabled>
                                🔄 আবার OTP পাঠান
                                <span class="resend-otp-timer" id="otpTimer"></span>
                            </button>
                        </div>
                    </div>

                    <!-- ============================================ -->
                    <!-- নতুন পাসওয়ার্ড (OTP পদ্ধতির জন্য) -->
                    <!-- ============================================ -->
                    <div class="form-group" id="newPasswordGroup" style="display: none;">
                        <label for="newPassword">🔒 নতুন পাসওয়ার্ড <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input 
                                type="password" 
                                id="newPassword" 
                                placeholder="নতুন পাসওয়ার্ড লিখুন (৬+ অক্ষর)"
                                minlength="6"
                                disabled
                                autocomplete="new-password"
                            />
                            <button type="button" class="toggle-password" data-target="newPassword">👁️</button>
                        </div>
                        <div class="password-strength" id="otpPasswordStrength">
                            <div class="strength-bar" id="otpStrengthBar"></div>
                        </div>
                        <div class="password-strength-text" id="otpStrengthText"></div>
                        <div class="error-text" id="newPasswordError"></div>
                    </div>

                    <!-- ============================================ -->
                    <!-- সাবমিট বাটন -->
                    <!-- ============================================ -->
                    <button type="submit" class="btn-auth btn-primary" id="authSubmitBtn">
                        📩 রিসেট লিংক পাঠান
                    </button>

                    <div class="auth-footer">
                        <a href="#" data-mode="login">🔙 লগইন পেজে ফিরে যান</a>
                    </div>
                </form>
            </div>
        `;

        this._attachFormEvents();
        this._setupForgotPasswordOTP();
        this._setupResetMethodSelector(); // ✅ নতুন মেথড
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: রিসেট পদ্ধতি সিলেক্টর সেটআপ
    // ============================================================
    _setupResetMethodSelector() {
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        const methodBtns = form.querySelectorAll('.method-btn');
        const altEmailInfo = form.querySelector('#altEmailInfo');
        const altEmailBadge = form.querySelector('#altEmailBadge');
        const submitBtn = form.querySelector('#authSubmitBtn');

        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                methodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const method = btn.dataset.method;
                this._selectedMethod = method;

                // OTP গ্রুপ দেখান/লুকান
                const otpGroup = form.querySelector('#otpGroup');
                const newPasswordGroup = form.querySelector('#newPasswordGroup');

                if (method === 'otp') {
                    otpGroup.style.display = 'block';
                    newPasswordGroup.style.display = 'block';
                    submitBtn.textContent = '📧 OTP পাঠান';
                    if (altEmailInfo) altEmailInfo.style.display = 'none';
                } else if (method === 'altEmail') {
                    otpGroup.style.display = 'none';
                    newPasswordGroup.style.display = 'none';
                    submitBtn.textContent = '📩 বিকল্প ইমেইলে পাঠান';
                    if (altEmailInfo) altEmailInfo.style.display = 'block';
                    if (altEmailBadge) altEmailBadge.textContent = '✅';
                } else {
                    otpGroup.style.display = 'none';
                    newPasswordGroup.style.display = 'none';
                    submitBtn.textContent = '📩 রিসেট লিংক পাঠান';
                    if (altEmailInfo) altEmailInfo.style.display = 'none';
                }
            });
        });
    }

    // ============================================================
    // ✅ OTP হ্যান্ডলার সেটআপ (ইউনিফাইড ফ্লো - রিসেন্ড বাটন ছাড়া)
    // ============================================================
    _setupForgotPasswordOTP() {
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        console.log('🔧 Setting up forgot password OTP...');

        const methodBtns = form.querySelectorAll('.method-btn');
        const otpGroup = form.querySelector('#otpGroup');
        const newPasswordGroup = form.querySelector('#newPasswordGroup');
        const submitBtn = form.querySelector('#authSubmitBtn');
        const resendBtn = form.querySelector('#resendOtpBtn'); // ❌ রিমুভ করব, কিন্তু রেফারেন্স রাখছি
        
        // OTP ইনপুট রেফারেন্স সংরক্ষণ
        this._otpInputs = otpGroup.querySelectorAll('input');
        
        // ডিফল্ট মেথড লিংক
        this._selectedMethod = 'link';
        this._otpSent = false;
        this._otpTimer = null; // টাইমার রেফারেন্স

        // ============================================================
        // ১. পদ্ধতি সিলেক্টর
        // ============================================================
        methodBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const currentEmail = form.querySelector('#authEmail')?.value || '';

                // ✅ পদ্ধতি পরিবর্তনে সব ক্লিয়ার
                await this.#handleMethodChange(currentEmail);

                // ✅ যদি একই মেথডে ক্লিক করে (otp → otp) এবং OTP সেন্ট থাকে
                if (this._selectedMethod === 'otp' && 
                    btn.dataset.method === 'otp' && 
                    this._otpSent) {
                    
                    console.log('🔄 OTP method re-selected while OTP was sent');
                    
                    // ✅ টাইমার বন্ধ করুন
                    if (this._otpTimer) {
                        clearInterval(this._otpTimer);
                        this._otpTimer = null;
                        console.log('⏱️ Timer stopped');
                    }
                    
                    // ✅ OTP সেন্ট ফ্ল্যাগ রিসেট
                    this._otpSent = false;
                    
                    // ✅ OTP সাফল্য বার্তা রিমুভ
                    const oldMsg = form.querySelector('.otp-success-message');
                    if (oldMsg) oldMsg.remove();
                    
                    // ✅ OTP ইনপুট ডিজেবল + খালি
                    this._otpInputs.forEach(inp => {
                        inp.disabled = true;
                        inp.value = '';
                    });
                    
                    // ✅ নতুন পাসওয়ার্ড ইনপুট ডিজেবল + খালি
                    const newPassInput = newPasswordGroup.querySelector('input');
                    if (newPassInput) {
                        newPassInput.disabled = true;
                        newPassInput.value = '';
                    }
                    
                    // ✅ সাবমিট বাটন রিসেট
                    submitBtn.textContent = '📧 OTP পাঠান';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.style.cursor = 'pointer';
                    
                    // ✅ এরর বার্তা ক্লিয়ার
                    const errorEl = form.querySelector('#otpError');
                    if (errorEl) errorEl.textContent = '';
                    const newPassError = form.querySelector('#newPasswordError');
                    if (newPassError) newPassError.textContent = '';
                    
                    // ✅ methodBtns আপডেট
                    methodBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this._selectedMethod = btn.dataset.method;
                    
                    console.log('🔄 OTP state reset successfully');
                    return;
                }
                
                // ✅ বিভিন্ন মেথডে সুইচ করলে (link → otp) অথবা প্রথমবার OTP সিলেক্ট করলে
                methodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this._selectedMethod = btn.dataset.method;
                this._otpSent = false;
                console.log('🔢 Method selected:', this._selectedMethod);

                if (this._selectedMethod === 'otp') {
                    // OTP পদ্ধতি দেখান
                    otpGroup.style.display = 'block';
                    newPasswordGroup.style.display = 'block';
                    submitBtn.textContent = '📧 OTP পাঠান';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    
                    // সব ইনপুট ডিজেবল
                    this._otpInputs.forEach(inp => {
                        inp.disabled = true;
                        inp.value = '';
                    });
                    
                    const newPassInput = newPasswordGroup.querySelector('input');
                    if (newPassInput) newPassInput.disabled = true;
                    
                    // পুরনো টাইমার ক্লিয়ার
                    if (this._otpTimer) {
                        clearInterval(this._otpTimer);
                        this._otpTimer = null;
                    }
                    
                    // পুরনো সাফল্য বার্তা রিমুভ
                    const oldMsg = form.querySelector('.otp-success-message');
                    if (oldMsg) oldMsg.remove();
                    
                } else {
                    // লিংক পদ্ধতি
                    otpGroup.style.display = 'none';
                    newPasswordGroup.style.display = 'none';
                    submitBtn.textContent = '📩 রিসেট লিংক পাঠান';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    
                    this._otpInputs.forEach(inp => {
                        inp.disabled = true;
                        inp.value = '';
                    });
                    
                    const newPassInput = newPasswordGroup.querySelector('input');
                    if (newPassInput) newPassInput.disabled = true;
                    
                    if (this._otpTimer) {
                        clearInterval(this._otpTimer);
                        this._otpTimer = null;
                    }
                }
            });
        });

        // ============================================================
        // ২. OTP অটো-ফোকাস ও নেভিগেশন
        // ============================================================
        const otpInputs = this._otpInputs;
        otpInputs.forEach((input, index, inputs) => {
            input.addEventListener('input', function() {
                const val = this.value;
                if (val && !/^\d$/.test(val)) {
                    this.value = '';
                    return;
                }
                if (this.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                const errorEl = form.querySelector('#otpError');
                if (errorEl) errorEl.textContent = '';
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    inputs[index - 1].focus();
                }
                if (e.key === 'ArrowLeft' && index > 0) {
                    inputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                if (paste && /^\d{6}$/.test(paste)) {
                    paste.split('').forEach((char, i) => {
                        if (inputs[i]) {
                            inputs[i].value = char;
                            if (i < inputs.length - 1) {
                                setTimeout(() => inputs[i + 1].focus(), 10);
                            }
                        }
                    });
                }
            });

            input.addEventListener('focus', function() {
                this.select();
            });
        });

        // ============================================================
        // ৩. OTP পাসওয়ার্ড স্ট্রেংথ
        // ============================================================
        const otpPasswordInput = form.querySelector('#newPassword');
        if (otpPasswordInput) {
            otpPasswordInput.addEventListener('input', function() {
                const bar = form.querySelector('#otpStrengthBar');
                const text = form.querySelector('#otpStrengthText');
                
                if (!bar || !text) return;

                if (!this.value) {
                    bar.style.width = '0%';
                    bar.className = 'strength-bar';
                    text.textContent = '';
                    return;
                }

                let strength = 0;
                const password = this.value;
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
                bar.className = 'strength-bar ' + (classes[strength] || '');
                text.textContent = `পাসওয়ার্ড শক্তি: ${levels[strength] || ''}`;
                text.style.color = colors[strength] || '#e0e0e0';
            });
        }

        // ============================================================
        // ৪. ফর্ম সাবমিট (ইউনিফাইড ফ্লো)
        // ============================================================
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('🔥🔥🔥 FORM SUBMIT EVENT FIRED! 🔥🔥🔥');
            console.log('📤 Selected method:', this._selectedMethod);
            console.log('📤 OTP sent:', this._otpSent);

            if (this.isLoading) return;

            const email = form.querySelector('#authEmail').value;
            const currentMethod = this._selectedMethod || 'link';
            console.log('📤 Form submitted, method:', currentMethod, 'email:', email);

            if (!email || !validateEmail(email.trim())) {
                this._showError('সঠিক ইমেইল দিন');
                return;
            }

            if (currentMethod === 'otp') {
                // ============================================================
                // 🔢 OTP পদ্ধতি (ইউনিফাইড ফ্লো)
                // ============================================================
                console.log('🔢 Processing OTP method...');
                console.log('📤 OTP sent status:', this._otpSent);

                // ✅ যদি OTP এখনও পাঠানো না হয়, তাহলে প্রথমে OTP পাঠান
                if (!this._otpSent) {
                    console.log('📤 First time - sending OTP...');
                    
                    this.isLoading = true;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<span class="spinner-small"></span> OTP পাঠানো হচ্ছে...`;

                    try {
                        console.log('📤 Sending initial OTP request...');
                        const data = await apiService.forgotPassword(email.trim(), 'otp');
                        console.log('📥 Initial OTP response:', data);
                        
                        if (data.success) {
                            console.log('✅ Initial OTP sent successfully!');
                            this._otpSent = true;
                            
                            // ✅ OTP সাফল্য বার্তা দেখান
                            this.#showOTPSuccess(email);
                            
                            // ✅ সাবমিট বাটন আপডেট
                            submitBtn.textContent = '🔢 OTP যাচাই করুন';
                            submitBtn.disabled = false;
                            submitBtn.style.background = '';

                            // ✅ টাইমার শুরু (শুধু UI আপডেটের জন্য, রিসেন্ড বাটন নেই)
                            this.#startOTPTimer(300, form, submitBtn);
                            
                            this.isLoading = false;
                            return;
                            
                        } else {
                            console.error('❌ Initial OTP failed:', data.message);
                            this._showError(data.message || 'OTP পাঠাতে সমস্যা হয়েছে');
                            submitBtn.disabled = false;
                            submitBtn.textContent = '📧 OTP পাঠান';
                            submitBtn.style.background = '';
                            this.isLoading = false;
                            return;
                        }
                        
                    } catch (error) {
                        console.error('❌ Network error:', error);
                        this._showError('সার্ভারে সংযোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                        submitBtn.disabled = false;
                        submitBtn.textContent = '📧 OTP পাঠান';
                        submitBtn.style.background = '';
                        this.isLoading = false;
                        return;
                    }
                }

                // ============================================================
                // ✅ OTP ইতিমধ্যে পাঠানো হয়েছে - এখন যাচাই করুন
                // ============================================================
                console.log('🔢 Verifying OTP...');
                
                // OTP সংগ্রহ
                const otpArray = [];
                this._otpInputs.forEach(inp => {
                    otpArray.push(inp.value);
                });
                const otp = otpArray.join('');
                console.log('🔑 Entered OTP:', otp);

                if (otp.length !== 6) {
                    this._showError('দয়া করে ৬ ডিজিট OTP দিন');
                    const errorEl = form.querySelector('#otpError');
                    if (errorEl) {
                        errorEl.textContent = '❌ ৬ ডিজিট OTP দিন';
                        errorEl.style.color = 'var(--danger)';
                    }
                    return;
                }

                // নতুন পাসওয়ার্ড সংগ্রহ
                const newPasswordInput = newPasswordGroup.querySelector('input');
                const newPassword = newPasswordInput ? newPasswordInput.value : '';
                console.log('🔒 New password length:', newPassword?.length || 0);

                if (!newPassword || newPassword.length < 6) {
                    this._showError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
                    const errorEl = form.querySelector('#newPasswordError');
                    if (errorEl) {
                        errorEl.textContent = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
                        errorEl.style.color = 'var(--danger)';
                    }
                    return;
                }

                // লোডিং স্টেট
                this.isLoading = true;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-small"></span> OTP যাচাই হচ্ছে...`;

                try {
                    console.log('📤 Verifying OTP...');
                    const data = await apiService.verifyOTP(email.trim(), otp, newPassword);
                    console.log('📥 Verify OTP response:', data);

                    if (data.success) {
                        console.log('✅ OTP verified successfully!');
                        // টাইমার ক্লিয়ার
                        if (this._otpTimer) {
                            clearInterval(this._otpTimer);
                            this._otpTimer = null;
                        }
                        this._onAuthSuccess(data);
                    } else {
                        console.error('❌ OTP verification failed:', data.message);
                        this._showError(data.message || 'OTP সঠিক নয়');
                        const errorEl = form.querySelector('#otpError');
                        if (errorEl) {
                            errorEl.textContent = '❌ ' + (data.message || 'OTP সঠিক নয়');
                            errorEl.style.color = 'var(--danger)';
                        }
                        // OTP ইনপুট রিসেট
                        this._otpInputs.forEach(inp => inp.value = '');
                        this._otpInputs[0]?.focus();
                        submitBtn.disabled = false;
                        submitBtn.textContent = '🔢 OTP যাচাই করুন';
                        submitBtn.style.background = '';
                    }
                } catch (error) {
                    console.error('❌ Network error during OTP verification:', error);
                    this._showError('সার্ভারে সংযোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🔢 OTP যাচাই করুন';
                    submitBtn.style.background = '';
                } finally {
                    this.isLoading = false;
                }
                
            } else {
                // ============================================================
                // 🔗 লিংক পদ্ধতি
                // ============================================================
                console.log('🔗 Processing Link method...');
                this.isLoading = true;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-small"></span> লিংক পাঠানো হচ্ছে...`;

                try {
                    const data = await apiService.forgotPassword(email.trim(), 'link');
                    console.log('📥 Link reset response:', data);

                    if (data.success) {
                        // ✅ লিংক সেন্ট ফ্ল্যাগ সেট
                        this._linkSent = true;

                        // ✅ লিংক সাফল্য বার্তা দেখান (টাইমার সহ)
                        this.#showLinkSuccess(email);

                    } else {
                        this._showError(data.message || 'লিংক পাঠাতে সমস্যা হয়েছে');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '📩 রিসেট লিংক পাঠান';
                        submitBtn.style.background = '';
                    }
                } catch (error) {
                    console.error('❌ Network error:', error);
                    this._showError('সার্ভারে সংযোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '📩 রিসেট লিংক পাঠান';
                    submitBtn.style.background = '';
                } finally {
                    this.isLoading = false;
                }
            }
        });
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: সব সাফল্য বার্তা ক্লিয়ার
    // ============================================================
    #clearAllSuccessMessages() {
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        // ১. OTP সাফল্য বার্তা রিমুভ
        const otpMsg = form.querySelector('.otp-success-message');
        if (otpMsg) otpMsg.remove();

        // ২. লিংক সাফল্য বার্তা রিমুভ
        const linkMsg = form.querySelector('.link-success-message');
        if (linkMsg) linkMsg.remove();

        console.log('🗑️ All success messages cleared');
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: সব টাইমার বন্ধ
    // ============================================================
    #clearAllTimers() {
        // OTP টাইমার বন্ধ
        if (this._otpTimerInterval) {
            clearInterval(this._otpTimerInterval);
            this._otpTimerInterval = null;
            console.log('⏱️ OTP timer stopped');
        }

        // লিংক টাইমার বন্ধ
        if (this._linkTimerInterval) {
            clearInterval(this._linkTimerInterval);
            this._linkTimerInterval = null;
            console.log('⏱️ Link timer stopped');
        }
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: সব ফ্ল্যাগ রিসেট
    // ============================================================
    #resetAllFlags() {
        this._otpSent = false;
        this._linkSent = false;
        console.log('🔄 All flags reset');
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: ব্যাকএন্ডে OTP বাতিল
    // ============================================================
    async #cancelOTP(email) {
        try {
            console.log('📤 Cancelling OTP for:', email);
            const data = await apiService.post('/auth/cancel-otp', { email: email.trim() });
            console.log('📥 Cancel OTP response:', data);
            return data.success;
        } catch (error) {
            console.warn('⚠️ Cancel OTP failed:', error.message);
            return false;
        }
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: ব্যাকএন্ডে লিংক টোকেন বাতিল
    // ============================================================
    async #cancelResetToken(email) {
        try {
            console.log('📤 Cancelling reset token for:', email);
            const data = await apiService.post('/auth/cancel-reset-token', { email: email.trim() });
            console.log('📥 Cancel reset token response:', data);
            return data.success;
        } catch (error) {
            console.warn('⚠️ Cancel reset token failed:', error.message);
            return false;
        }
    }

    // ============================================================
    // ✅ ✅ ✅ নতুন: পদ্ধতি পরিবর্তনে সম্পূর্ণ ক্লিয়ার
    // ============================================================
    async #handleMethodChange(email) {
        // ১. সব সাফল্য বার্তা রিমুভ
        this.#clearAllSuccessMessages();

        // ২. সব টাইমার বন্ধ
        this.#clearAllTimers();

        // ৩. সব ফ্ল্যাগ রিসেট
        this.#resetAllFlags();

        // ৪. ব্যাকএন্ডে OTP বাতিল (যদি ইমেইল থাকে)
        if (email && validateEmail(email.trim())) {
            await this.#cancelOTP(email);
            await this.#cancelResetToken(email);
        }

        console.log('✅ All state cleared for method change');
    }

    // ============================================================
    // ✅ ✅ ✅ লিংক সাফল্য বার্তা দেখানো (ইউনিফাইড ডিজাইন + টাইমার)
    // ============================================================
    #showLinkSuccess(email) {
        console.log('📨 Showing link success for:', email);
        
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        // ✅ পুরনো OTP বার্তা রিমুভ
        const oldOtpMsg = form.querySelector('.otp-success-message');
        if (oldOtpMsg) oldOtpMsg.remove();

        // ✅ OTP টাইমার বন্ধ
        if (this._otpTimerInterval) {
            clearInterval(this._otpTimerInterval);
            this._otpTimerInterval = null;
        }

        // ✅ OTP ফ্ল্যাগ রিসেট
        this._otpSent = false;

        const emailInput = form.querySelector('#authEmail');
        if (!emailInput) return;

        const emailGroup = emailInput.closest('.form-group');
        if (!emailGroup) return;

        const oldMsg = emailGroup.querySelector('.link-success-message');
        if (oldMsg) oldMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = 'link-success-message';
        msgDiv.style.cssText = `
            margin-top: 12px;
            padding: 16px 20px;
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 12px;
            color: #1b5e20;
            font-size: 14px;
            line-height: 1.6;
            animation: slideDown 0.4s ease;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
        `;
        msgDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 24px; flex-shrink: 0;">✅</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 4px; font-size: 16px; color: #1b5e20;">
                        রিসেট লিংক পাঠানো হয়েছে!
                    </strong>
                    <p style="margin: 4px 0 8px 0; color: #1b5e20;">
                        <strong style="color: #1b5e20;">${this._escapeHtml(email)}</strong> ইমেইলে একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
                    </p>
                    
                    <div style="background: rgba(255,255,255,0.5); padding: 10px 14px; border-radius: 8px; margin: 8px 0;">
                        <p style="margin: 0 0 4px 0; font-weight: 600; color: #1b5e20;">📌 ইমেইল চেক করুন:</p>
                        <ul style="margin: 4px 0 0 16px; padding: 0; list-style-type: none;">
                            <li style="padding: 2px 0; color: #2e7d32;">📥 আপনার <strong>ইনবক্স</strong> চেক করুন</li>
                            <li style="padding: 2px 0; color: #2e7d32;">📂 <strong>স্পাম/জাঙ্ক</strong> ফোল্ডারও চেক করুন</li>
                            <li style="padding: 2px 0; color: #2e7d32;">⏰ লিংকটি <strong>১০ মিনিট</strong> পর্যন্ত বৈধ থাকবে</li>
                        </ul>
                    </div>
                    
                    <div id="linkTimerInfo" style="margin-top: 10px; padding: 8px 12px; background: rgba(76, 175, 80, 0.08); border-radius: 6px; border-left: 3px solid #4caf50;">
                        <p style="margin: 0; font-size: 13px; color: #1b5e20;">
                            ⏱️ সময় বাকি  <span id="linkTimerDisplay" style="font-size:28px;">১০:০০</span>
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #1b5e20;">
                            💡 সময় শেষ হলে <strong>"📩 রিসেট লিংক পাঠান"</strong> বাটনে ক্লিক করে আবার লিংক পাঠাতে পারবেন।
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        emailGroup.appendChild(msgDiv);
        console.log('✅ Link success message added to DOM');

        emailInput.disabled = true;
        emailInput.style.opacity = '0.7';
        emailInput.style.cursor = 'not-allowed';

        const submitBtn = form.querySelector('#authSubmitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = '✅ লিংক পাঠানো হয়েছে!';
            submitBtn.disabled = true;
            submitBtn.style.background = 'var(--success)';
            submitBtn.style.cursor = 'not-allowed';
        }

        this._linkSent = true;
        this.#startLinkTimer(600, form);
    }

    // ============================================================
    // ✅ OTP সাফল্য বার্তা দেখানো (রিসেন্ড বাটন ছাড়া)
    // ============================================================
    #showOTPSuccess(email) {
        console.log('📨 Showing OTP success for:', email);
        
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        // ✅ পুরনো লিংক বার্তা রিমুভ
        const oldLinkMsg = form.querySelector('.link-success-message');
        if (oldLinkMsg) oldLinkMsg.remove();

        // ✅ লিংক টাইমার বন্ধ
        if (this._linkTimerInterval) {
            clearInterval(this._linkTimerInterval);
            this._linkTimerInterval = null;
        }

        // ✅ লিংক ফ্ল্যাগ রিসেট
        this._linkSent = false;

        const emailInput = form.querySelector('#authEmail');
        if (!emailInput) return;

        const emailGroup = emailInput.closest('.form-group');
        if (!emailGroup) return;

        const oldMsg = emailGroup.querySelector('.otp-success-message');
        if (oldMsg) oldMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = 'otp-success-message';
        msgDiv.style.cssText = `
            margin-top: 12px;
            padding: 16px 20px;
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 12px;
            color: #0d47a1;
            font-size: 14px;
            line-height: 1.6;
            animation: slideDown 0.4s ease;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
        `;
        msgDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 24px; flex-shrink: 0;">🔢</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 4px; font-size: 16px; color: #0d47a1;">
                        OTP পাঠানো হয়েছে!
                    </strong>
                    <p style="margin: 4px 0 8px 0; color: #0d47a1;">
                        <strong style="color: #0d47a1;">${this._escapeHtml(email)}</strong> ইমেইলে একটি ৬-ডিজিট OTP পাঠানো হয়েছে।
                    </p>
                    
                    <div style="background: rgba(255,255,255,0.5); padding: 10px 14px; border-radius: 8px; margin: 8px 0;">
                        <p style="margin: 0 0 4px 0; font-weight: 600; color: #0d47a1;">📌 ইমেইল চেক করুন:</p>
                        <ul style="margin: 4px 0 0 16px; padding: 0; list-style-type: none;">
                            <li style="padding: 2px 0; color: #0d47a1;">📥 আপনার <strong>ইনবক্স</strong> চেক করুন</li>
                            <li style="padding: 2px 0; color: #0d47a1;">📂 <strong>স্পাম/জাঙ্ক</strong> ফোল্ডারও চেক করুন</li>
                            <li style="padding: 2px 0; color: #0d47a1;">⏰ OTP <strong>৫ মিনিট</strong> পর্যন্ত বৈধ থাকবে</li>
                        </ul>
                    </div>
                    
                    <div id="otpTimerInfo" style="margin-top: 10px; padding: 8px 12px; background: rgba(33, 150, 243, 0.08); border-radius: 6px; border-left: 3px solid #2196f3;">
                        <p style="margin: 0; font-size: 13px; color: #0d47a1;">
                            ⏱️ সময় বাকি  <span id="otpTimerDisplay" style="font-size:28px;">৫:০০</span>
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #0d47a1;">
                            💡 সময় শেষ হলে <strong>"📧 OTP পাঠান"</strong> বাটনে ক্লিক করে আবার OTP পাঠাতে পারবেন।
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        emailGroup.appendChild(msgDiv);
        console.log('✅ OTP success message added to DOM');

        emailInput.disabled = true;
        emailInput.style.opacity = '0.7';
        emailInput.style.cursor = 'not-allowed';

        this._otpInputs.forEach(inp => {
            inp.disabled = false;
            inp.value = '';
        });

        const newPasswordGroup = form.querySelector('#newPasswordGroup');
        if (newPasswordGroup) {
            const newPassInput = newPasswordGroup.querySelector('input');
            if (newPassInput) newPassInput.disabled = false;
        }

        const submitBtn = form.querySelector('#authSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = '🔢 OTP যাচাই করুন';
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
            submitBtn.style.background = '';
        }

        this._otpSent = true;

        setTimeout(() => {
            if (this._otpInputs.length > 0) {
                this._otpInputs[0].focus();
            }
        }, 300);
    }

    // ============================================================
    // ✅ OTP টাইমার শুরু (শুধু UI আপডেটের জন্য)
    // ============================================================
    #startOTPTimer(seconds, form, submitBtn) {
        let remaining = seconds;
        const timerDisplay = form.querySelector('#otpTimerDisplay');
        if (!timerDisplay) return;

        // পুরনো টাইমার ক্লিয়ার
        if (this._otpTimerInterval) {
            clearInterval(this._otpTimerInterval);
            this._otpTimerInterval = null;
        }

        const updateTimer = () => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        updateTimer();

        this._otpTimerInterval = setInterval(() => {
            remaining--;
            
            if (remaining <= 0) {
                clearInterval(this._otpTimerInterval);
                this._otpTimerInterval = null;
                
                timerDisplay.textContent = '০০:০০';
                
                const timerInfo = form.querySelector('#otpTimerInfo');
                if (timerInfo) {
                    timerInfo.innerHTML = `
                        <p style="margin: 0; font-size: 13px; color: #d32f2f;">
                            ⏰ OTP এক্সপায়ার্ড হয়েছে!
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #d32f2f;">
                            💡 <strong>"📧 OTP পাঠান"</strong> বাটনে ক্লিক করে আবার OTP পাঠাতে পারবেন।
                        </p>
                    `;
                    timerInfo.style.borderLeftColor = '#d32f2f';
                }
                
                this._otpInputs.forEach(inp => {
                    inp.disabled = true;
                    inp.value = '';
                });
                
                const newPasswordGroup = form.querySelector('#newPasswordGroup');
                if (newPasswordGroup) {
                    const newPassInput = newPasswordGroup.querySelector('input');
                    if (newPassInput) newPassInput.disabled = true;
                }
                
                if (submitBtn) {
                    submitBtn.textContent = '📧 OTP পাঠান';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.style.cursor = 'pointer';
                }
                
                this._otpSent = false;
                console.log('⏰ OTP timer expired');
            } else {
                updateTimer();
            }
        }, 1000);
    }

    // ============================================================
    // ✅ লিংক টাইমার শুরু (১০ মিনিট)
    // ============================================================
    #startLinkTimer(seconds, form) {
        let remaining = seconds;
        const timerDisplay = form.querySelector('#linkTimerDisplay');
        if (!timerDisplay) return;

        // পুরনো টাইমার ক্লিয়ার
        if (this._linkTimerInterval) {
            clearInterval(this._linkTimerInterval);
            this._linkTimerInterval = null;
        }

        const updateTimer = () => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        updateTimer();

        this._linkTimerInterval = setInterval(() => {
            remaining--;
            
            if (remaining <= 0) {
                clearInterval(this._linkTimerInterval);
                this._linkTimerInterval = null;
                
                timerDisplay.textContent = '০০:০০';
                
                const timerInfo = form.querySelector('#linkTimerInfo');
                if (timerInfo) {
                    timerInfo.innerHTML = `
                        <p style="margin: 0; font-size: 13px; color: #d32f2f;">
                            ⏰ লিংক এক্সপায়ার্ড হয়েছে!
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #d32f2f;">
                            💡 <strong>"📩 রিসেট লিংক পাঠান"</strong> বাটনে ক্লিক করে আবার লিংক পাঠাতে পারবেন।
                        </p>
                    `;
                    timerInfo.style.borderLeftColor = '#d32f2f';
                }
                
                const emailInput = form.querySelector('#authEmail');
                if (emailInput) {
                    emailInput.disabled = false;
                    emailInput.style.opacity = '1';
                    emailInput.style.cursor = 'text';
                }
                
                const submitBtn = form.querySelector('#authSubmitBtn');
                if (submitBtn) {
                    submitBtn.textContent = '📩 রিসেট লিংক পাঠান';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    submitBtn.style.cursor = 'pointer';
                }
                
                this._linkSent = false;
                console.log('⏰ Link timer expired');
            } else {
                updateTimer();
            }
        }, 1000);
    }

// ✅ সাফল্য বার্তা ইনসার্ট করার আলাদা মেথড
#insertSuccessMessage(emailGroup, email) {
    // পুরনো বার্তা রিমুভ
    const oldMsg = emailGroup.querySelector('.link-success-message');
    if (oldMsg) oldMsg.remove();

    // নতুন বার্তা তৈরি
    const msgDiv = document.createElement('div');
    msgDiv.className = 'link-success-message';
    msgDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 24px; flex-shrink: 0;">✅</span>
            <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 4px; font-size: 16px; color: #1b5e20;">
                    রিসেট লিংক পাঠানো হয়েছে!
                </strong>
                <p style="margin: 4px 0 8px 0; color: #1b5e20;">
                    <strong>${this._escapeHtml(email)}</strong> ইমেইলে একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
                </p>
                
                <div style="background: rgba(255,255,255,0.5); padding: 10px 14px; border-radius: 8px; margin: 8px 0;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1b5e20;">📌 ইমেইল চেক করুন:</p>
                    <ul style="margin: 4px 0 0 16px; padding: 0; list-style-type: none;">
                        <li style="padding: 2px 0; color: #2e7d32;">📥 আপনার <strong>ইনবক্স</strong> চেক করুন</li>
                        <li style="padding: 2px 0; color: #2e7d32;">📂 <strong>স্পাম/জাঙ্ক</strong> ফোল্ডারও চেক করুন</li>
                        <li style="padding: 2px 0; color: #2e7d32;">⏰ লিংকটি <strong>১০ মিনিট</strong> পর্যন্ত বৈধ থাকবে</li>
                    </ul>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-sm btn-success" id="closeSuccessBtn" 
                            style="padding: 6px 20px; font-size: 13px; cursor: pointer; border: none; border-radius: 6px; background: #4caf50; color: white;">
                        ✕ বন্ধ করুন
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" id="resendLinkBtn" 
                            style="padding: 6px 20px; font-size: 13px; cursor: pointer; border: 1px solid #4caf50; border-radius: 6px; background: transparent; color: #2e7d32;">
                        🔄 আবার পাঠান
                    </button>
                </div>
            </div>
        </div>
    `;
    
    emailGroup.appendChild(msgDiv);
    console.log('✅ Success message added to DOM');

    // ✅ "বন্ধ করুন" বাটনের ইভেন্ট
    const closeBtn = msgDiv.querySelector('#closeSuccessBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('🔚 Close button clicked');
            this.hide();
        });
    }

    // ✅ "আবার পাঠান" বাটনের ইভেন্ট
    const resendBtn = msgDiv.querySelector('#resendLinkBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            console.log('🔄 Resend button clicked');
            msgDiv.remove();
            const form = this.container.querySelector('#authForm');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    // ✅ ইমেইল ইনপুট ডিজেবল করুন
    const emailInput = emailGroup.querySelector('#authEmail');
    if (emailInput) {
        emailInput.disabled = true;
        emailInput.style.opacity = '0.7';
        emailInput.style.cursor = 'not-allowed';
        console.log('✅ Email input disabled');
    }

    // ✅ সাবমিট বাটন ডিজেবল রাখুন
    const submitBtn = this.container.querySelector('#authSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';
        console.log('✅ Submit button disabled');
    }
}

    // ============================================================
    // ✅ _escapeHtml (সিকিউরিটি)
    // ============================================================
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    // ============================================================
    // ✅ OTP টাইমার শুরু (পুরনো, রেখেছি কিন্তু ব্যবহার করব না)
    // ============================================================
    _startOTPTimer(seconds, btn, form) {
        // পুরনো মেথড - এখন #startOTPTimer ব্যবহার করুন
        this.#startOTPTimer(seconds, form, btn);
    }

    // ============================================================
    // ✅ ইভেন্ট বাইন্ডিং
    // ============================================================
    _bindEvents() {
        // মোড সুইচিং
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-mode]');
            if (link) {
                e.preventDefault();
                const mode = link.dataset.mode;
                if (['login', 'register', 'forgot'].includes(mode)) {
                    this.show(mode);
                }
            }
        });

        // ক্লোজ বাটন
        document.addEventListener('click', (e) => {
            if (e.target.id === 'authCloseBtn' || e.target.closest('#authCloseBtn')) {
                this.hide();
            }
        });
    }

    // ============================================================
    // ✅ ফর্ম ইভেন্ট অ্যাটাচ
    // ============================================================
    _attachFormEvents() {
        const form = this.container.querySelector('#authForm');
        if (!form) return;

        // ফর্ম সাবমিট - শুধু লগইন ও রেজিস্টারের জন্য
        if (this.currentMode === 'login' || this.currentMode === 'register') {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.isLoading) return;
                this._handleSubmit(e);
            });
        }

        // টগল পাসওয়ার্ড ভিজিবিলিটি
        form.querySelectorAll('.toggle-password').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                if (target) {
                    const isPassword = target.type === 'password';
                    target.type = isPassword ? 'text' : 'password';
                    btn.textContent = isPassword ? '🙈' : '👁️';
                }
            });
        });

        // Enter কী-তে সাবমিট
        form.querySelectorAll('input').forEach((input) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    const submitEvent = new Event('submit', { 
                        cancelable: true, 
                        bubbles: true 
                    });
                    form.dispatchEvent(submitEvent);
                }
            });
        });

        // রিয়েল-টাইম ভ্যালিডেশন
        if (this.currentMode === 'register') {
            const nameInput = form.querySelector('#authName');
            const emailInput = form.querySelector('#authEmail');
            const passwordInput = form.querySelector('#authPassword');
            const confirmInput = form.querySelector('#authConfirmPassword');

            if (nameInput) {
                nameInput.addEventListener('input', () => this._validateName(nameInput));
            }
            if (emailInput) {
                emailInput.addEventListener('input', () => this._validateEmail(emailInput));
            }
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    this._validatePassword(passwordInput);
                    this._updatePasswordStrength(passwordInput);
                });
            }
            if (confirmInput && passwordInput) {
                confirmInput.addEventListener('input', () => {
                    this._validateConfirmPassword(passwordInput, confirmInput);
                });
            }
        }

        if (this.currentMode === 'login') {
            const emailInput = form.querySelector('#authEmail');
            const passwordInput = form.querySelector('#authPassword');
            if (emailInput) {
                emailInput.addEventListener('input', () => this._validateEmail(emailInput));
            }
            if (passwordInput) {
                passwordInput.addEventListener('input', () => this._validatePassword(passwordInput));
            }
        }
    }

    // ============================================================
    // ✅ ফর্ম সাবমিট হ্যান্ডলার
    // ============================================================
    async _handleSubmit(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const form = e.target;
        const submitBtn = form.querySelector('#authSubmitBtn');
        
        if (!this._validateForm(form)) return;

        this.isLoading = true;
        submitBtn.disabled = true;
        const loadingText = this.currentMode === 'login' ? 'লগইন হচ্ছে...' : 
                           this.currentMode === 'register' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 
                           'লিংক পাঠানো হচ্ছে...';
        submitBtn.innerHTML = `<span class="spinner-small"></span> ${loadingText}`;

        try {
            let result;
            switch(this.currentMode) {
                case 'login':
                    result = await this._handleLogin(form);
                    break;
                case 'register':
                    result = await this._handleRegister(form);
                    break;
                default:
                    throw new Error('Invalid mode');
            }

            if (result.success) {
                this._onAuthSuccess(result);
            } else {
                this._showError(result.message || 'কোথাও সমস্যা হয়েছে');
            }
        } catch (error) {
            this._showError(error.message || 'সার্ভারে সমস্যা হয়েছে');
        } finally {
            this.isLoading = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = this._getSubmitButtonText();
        }
    }

    // ============================================================
    // ✅ লগইন হ্যান্ডলার
    // ============================================================
    async _handleLogin(form) {
        const email = form.querySelector('#authEmail').value;
        const password = form.querySelector('#authPassword').value;
        const remember = form.querySelector('#rememberMe')?.checked || false;

        return await authService.login(email, password, remember);
    }

    // ============================================================
    // ✅ রেজিস্টার হ্যান্ডলার
    // ============================================================
    async _handleRegister(form) {
        const name = form.querySelector('#authName').value;
        const email = form.querySelector('#authEmail').value;
        const password = form.querySelector('#authPassword').value;
        const confirm = form.querySelector('#authConfirmPassword')?.value || '';

        if (password !== confirm) {
            return { success: false, message: 'পাসওয়ার্ড মিলছে না' };
        }

        const profile = { name, email };
        return await authService.register(name, email, password, profile);
    }

    // ============================================================
    // ✅ সাফল্য হ্যান্ডলার
    // ============================================================
    _onAuthSuccess(result) {
        authService.dispatchAuthEvent();
        this.hide();
        
        const userName = result.user?.name || 'ইউজার';
        const message = this.currentMode === 'login' 
            ? `👋 স্বাগতম, ${userName}!` 
            : `🎉 অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম, ${userName}!`;
        
        if (window.app?.showToast) {
            window.app.showToast(message, 'success');
        } else {
            alert(message);
        }
        
        if (window.app?.welcomePage) {
            window.app.welcomePage.updateUserInfo();
            window.app.welcomePage.loadStats();
        }
        
        this._updateMenu();
    }

    // ============================================================
    // ✅ মেনু আপডেট
    // ============================================================
    _updateMenu() {
        const isAuth = authService.isAuthenticated();
        const menuAuth = document.getElementById('menuAuth');
        const authLabel = document.getElementById('authMenuLabel');
        const authIcon = document.getElementById('authMenuIcon');
        
        if (menuAuth && authLabel && authIcon) {
            if (isAuth) {
                const user = authService.getCurrentUser();
                authLabel.textContent = `👤 ${user?.name || 'ইউজার'} (লগআউট)`;
                authIcon.textContent = '🚪';
                menuAuth.dataset.action = 'logout';
            } else {
                authLabel.textContent = '🔐 লগইন করুন';
                authIcon.textContent = '🔐';
                menuAuth.dataset.action = 'login';
            }
        }
    }

    // ============================================================
    // ✅ ফর্ম ভ্যালিডেশন
    // ============================================================
    _validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach((input) => {
            if (!input.value.trim()) {
                this._setInputError(input, 'এই ফিল্ডটি পূরণ করুন');
                isValid = false;
            } else {
                this._clearInputError(input);
            }
        });

        const emailInput = form.querySelector('#authEmail');
        if (emailInput && emailInput.value.trim()) {
            if (!validateEmail(emailInput.value.trim())) {
                this._setInputError(emailInput, 'সঠিক ইমেইল দিন (যেমন: user@example.com)');
                isValid = false;
            }
        }

        if (this.currentMode === 'register') {
            const passwordInput = form.querySelector('#authPassword');
            if (passwordInput && passwordInput.value) {
                const result = validatePassword(passwordInput.value);
                if (!result.valid) {
                    this._setInputError(passwordInput, result.message);
                    isValid = false;
                }
            }
            
            const confirmInput = form.querySelector('#authConfirmPassword');
            const passwordVal = form.querySelector('#authPassword')?.value || '';
            if (confirmInput && confirmInput.value !== passwordVal) {
                this._setInputError(confirmInput, 'পাসওয়ার্ড মিলছে না');
                isValid = false;
            }
        }

        return isValid;
    }

    _validateName(input) {
        const value = input.value.trim();
        const result = validateName(value);
        if (!result.valid) {
            this._setInputError(input, result.message);
            return false;
        }
        this._clearInputError(input);
        return true;
    }

    _validateEmail(input) {
        const value = input.value.trim();
        if (!validateEmail(value)) {
            this._setInputError(input, 'সঠিক ইমেইল দিন (যেমন: user@example.com)');
            return false;
        }
        this._clearInputError(input);
        return true;
    }

    _validatePassword(input) {
        const value = input.value;
        const result = validatePassword(value);
        if (value && !result.valid) {
            this._setInputError(input, result.message);
            return false;
        }
        this._clearInputError(input);
        return true;
    }

    _validateConfirmPassword(passwordInput, confirmInput) {
        if (confirmInput.value !== passwordInput.value) {
            this._setInputError(confirmInput, 'পাসওয়ার্ড মিলছে না');
            return false;
        }
        this._clearInputError(confirmInput);
        return true;
    }

    // ============================================================
    // ✅ ইউটিলিটি মেথড
    // ============================================================
    _setInputError(input, message) {
        const group = input.closest('.form-group');
        if (group) {
            const errorEl = group.querySelector('.error-text');
            if (errorEl) errorEl.textContent = message;
        }
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) wrapper.classList.add('error');
    }

    _clearInputError(input) {
        const group = input.closest('.form-group');
        if (group) {
            const errorEl = group.querySelector('.error-text');
            if (errorEl) errorEl.textContent = '';
        }
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) wrapper.classList.remove('error');
    }

    _showError(message, type = 'error') {
        const firstError = this.container.querySelector('.error-text');
        if (firstError && type === 'error') {
            firstError.textContent = message;
            firstError.style.color = 'var(--danger)';
        }
        
        if (window.app?.showToast) {
            const toastType = type === 'info' ? 'info' : 'error';
            window.app.showToast(message, toastType);
        } else {
            alert((type === 'error' ? '❌ ' : 'ℹ️ ') + message);
        }
    }

    _getSubmitButtonText() {
        switch(this.currentMode) {
            case 'login': return '🔓 লগইন করুন';
            case 'register': return '🚀 অ্যাকাউন্ট তৈরি করুন';
            case 'forgot': return '📩 রিসেট লিংক পাঠান';
            default: return 'সাবমিট';
        }
    }

    _closeOnOutsideClick() {
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this._isModalOpen) {
                console.log('⚠️ Clicked outside modal content, keeping open');
            }
        });
    }

    _handleEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._isModalOpen) {
                console.log('📱 Escape key pressed, closing modal');
                this.hide();
            }
        });
    }

    // ============================================================
    // ✅ পাসওয়ার্ড শক্তি মিটার
    // ============================================================
    _setupPasswordStrength() {
        const passwordInput = this.container.querySelector('#authPassword');
        if (!passwordInput) return;
        
        passwordInput.addEventListener('input', () => {
            this._updatePasswordStrength(passwordInput);
        });
    }

    _updatePasswordStrength(input) {
        const value = input.value;
        const bar = this.container.querySelector('#strengthBar');
        const text = this.container.querySelector('#strengthText');
        
        if (!bar || !text) return;

        if (!value) {
            bar.style.width = '0%';
            bar.className = 'strength-bar';
            text.textContent = '';
            return;
        }

        const result = validatePassword(value);
        const strength = result.strength || 0;
        
        const levels = ['', 'দুর্বল', 'দুর্বল', 'মাঝারি', 'শক্তিশালী', 'খুব শক্তিশালী'];
        const classes = ['', 'weak', 'weak', 'medium', 'strong', 'very-strong'];
        const colors = ['', '#f44336', '#f44336', '#ff9800', '#4caf50', '#2e7d32'];
        
        bar.style.width = (strength * 25) + '%';
        bar.className = 'strength-bar ' + (classes[strength] || '');
        text.textContent = `পাসওয়ার্ড শক্তি: ${levels[strength] || ''}`;
        text.style.color = colors[strength] || '#e0e0e0';
    }
}