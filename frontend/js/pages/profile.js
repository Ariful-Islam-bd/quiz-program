// frontend/js/pages/profile.js
// Version: 5.0.0 - Complete Bug Fix - Duplicate Declaration Removed

import { storageService } from '../services/StorageService.js';
import { authService } from '../services/AuthService.js';
import { apiService } from '../services/ApiService.js';
import { getAvatarColor } from '../utils/AvatarColor.js';

// ============================================================
// ✅ ক্রপিং কনফিগারেশন
// ============================================================
const CROP_CONFIG = {
    OUTPUT_SIZE: 2000,
    OUTPUT_QUALITY: 0.92,
    PREVIEW_SIZE: 400,
    VIEWPORT_SIZE: 600,

    MIN_ZOOM: 0.5,
    MAX_ZOOM: 3.0,
    ZOOM_STEP: 0.05,
    DEFAULT_ZOOM: 1.0,

    DEFAULT_ROTATION: 0,

    SHAPES: {
        CIRCLE: 'circle',
        SQUARE: 'square',
        ROUNDED: 'rounded'
    },

    FILTERS: {
        NONE: 'none',
        GRAYSCALE: 'grayscale',
        SEPIA: 'sepia',
        BRIGHT: 'bright',
        VINTAGE: 'vintage',
        BLUR: 'blur'
    }
};

// ============================================================
// ✅ জেলা লিস্ট (বাংলাদেশের সব জেলা)
// ============================================================
const BANGLADESH_DISTRICTS = [
    'ঢাকা', 'ফরিদপুর', 'গাজীপুর', 'গোপালগঞ্জ', 'কিশোরগঞ্জ',
    'মাদারীপুর', 'মানিকগঞ্জ', 'মুন্সীগঞ্জ', 'নারায়ণগঞ্জ', 'নরসিংদী',
    'রাজবাড়ী', 'শরিয়তপুর', 'টাঙ্গাইল', 'কুমিল্লা', 'চাঁদপুর',
    'ব্রাহ্মণবাড়িয়া', 'ফেনী', 'লক্ষ্মীপুর', 'নোয়াখালী', 'খাগড়াছড়ি',
    'রাঙ্গামাটি', 'বান্দরবান', 'চট্টগ্রাম', 'কক্সবাজার', 'মৌলভীবাজার',
    'হবিগঞ্জ', 'সুনামগঞ্জ', 'সিলেট', 'রংপুর', 'দিনাজপুর',
    'কুড়িগ্রাম', 'গাইবান্ধা', 'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়',
    'ঠাকুরগাঁও', 'রাজশাহী', 'বগুড়া', 'জয়পুরহাট', 'নওগাঁ',
    'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'পাবনা', 'সিরাজগঞ্জ', 'খুলনা',
    'বাগেরহাট', 'চুয়াডাঙ্গা', 'যশোর', 'ঝিনাইদহ', 'কুষ্টিয়া',
    'মাগুরা', 'মেহেরপুর', 'নড়াইল', 'সাতক্ষীরা', 'বরিশাল',
    'বরগুনা', 'ভোলা', 'ঝালকাঠি', 'পটুয়াখালী', 'পিরোজপুর',
    'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'
];

// ============================================================
// ✅ ProfilePage ক্লাস
// ============================================================
export class ProfilePage {
    // ============================================================
    // ✅ প্রাইভেট ফিল্ড ডিক্লেয়ারেশন (শুধুমাত্র Fields, মেথড নয়)
    // ============================================================
    // State fields
    #cropState;
    #history;
    #historyIndex;
    #elements;
    #isCoverLoading;
    #originalImageData;
    #loadedSourceImage;
    #rafPending;
    #isCropModalOpen;
    #dragEventsBound;
    #onPointerDown;
    #onPointerMove;
    #onPointerUp;
    #isEditing;
    #originalData;

    // ============================================================
    // ✅ কনস্ট্রাক্টর
    // ============================================================
    constructor(navigation) {
        this.navigation = navigation;
        this.container = document.getElementById('profilePageWrapper');
        this.#isCoverLoading = false;
        this.#originalImageData = null;
        this.#loadedSourceImage = null;
        this.#rafPending = false;
        this.#isCropModalOpen = false;
        this.#dragEventsBound = false;
        this.#onPointerDown = null;
        this.#onPointerMove = null;
        this.#onPointerUp = null;
        this.#isEditing = false;
        this.#originalData = null;

        // ✅ বাইন্ডিং
        // this.#collectFormData = this.#collectFormData.bind(this);
        // this.#populateFormData = this.#populateFormData.bind(this);
        // this.#syncPasswordFormUsername = this.#syncPasswordFormUsername.bind(this);

        // ✅ ক্রপ স্টেট
        this.#cropState = {
            zoom: CROP_CONFIG.DEFAULT_ZOOM,
            rotation: CROP_CONFIG.DEFAULT_ROTATION,
            translateX: 0,
            translateY: 0,
            shape: CROP_CONFIG.SHAPES.CIRCLE,
            filter: CROP_CONFIG.FILTERS.NONE,
            isDragging: false,
            lastPointerX: 0,
            lastPointerY: 0,
            pointerId: null,
            _saving: false
        };

        this.#history = [];
        this.#historyIndex = -1;
        this.#elements = {};

        this.init();
    }

    // ============================================================
    // ✅ ইনিশিয়ালাইজেশন
    // ============================================================
    init() {
        this.#cacheElements();
        this.#loadProfile();
        this.#loadCoverImage();
        this.#setupEventListeners();
        this.#loadEmojiGallery();
        this.#loadStats();
        this.#loadActivity();
        console.log('✅ ProfilePage initialized (v5.0.0)');
    }

    // ============================================================
    // ✅ DOM এলিমেন্ট ক্যাশিং
    // ============================================================
    #cacheElements() {
        this.#elements = {
            avatarImg: document.getElementById('profileAvatarImg'),
            avatarInitials: document.getElementById('profileAvatarInitials'),
            avatarWrapper: document.getElementById('profileAvatarWrapper'),
            avatarLargeImg: document.getElementById('avatarLargeImg'),
            avatarLargeInitials: document.getElementById('avatarLargeInitials'),
            displayName: document.getElementById('profileDisplayName'),
            displayOrg: document.getElementById('profileDisplayOrg'),
            name: document.getElementById('profileName'),
            email: document.getElementById('profileEmail'),
            org: document.getElementById('profileOrg'),
            class: document.getElementById('profileClass'),
            section: document.getElementById('profileSection'),
            board: document.getElementById('profileBoard'),
            totalQuizzes: document.getElementById('statTotalQuizzes'),
            avgScore: document.getElementById('statAvgScore'),
            correct: document.getElementById('statCorrect'),
            wrong: document.getElementById('statWrong'),
            skipped: document.getElementById('statSkipped'),
            hundredCount: document.getElementById('statHundredCount'),
            progressPct: document.getElementById('profileProgressPct'),
            progressBar: document.getElementById('profileProgressBar'),
            activityList: document.getElementById('activityList'),
            saveBtn: document.getElementById('profileSaveBtn'),
            uploadBtn: document.getElementById('uploadAvatarBtn'),
            cropBtn: document.getElementById('cropAvatarBtn'),
            resetBtn: document.getElementById('resetAvatarBtn'),
            editAvatarBtn: document.getElementById('profileAvatarEditBtn'),
            changeCoverBtn: document.getElementById('changeCoverBtn'),
            removeCoverBtn: document.getElementById('removeCoverBtn'),
            coverInput: document.getElementById('hiddenCoverInput'),
            coverElement: document.getElementById('profileCover'),
            homeBtn: document.getElementById('profileHomeBtn'),
            tabs: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            cropModal: document.getElementById('cropModal'),
            cropViewport: document.getElementById('cropViewport'),
            cropImage: document.getElementById('cropImage'),
            cropOverlayMask: document.getElementById('cropOverlayMask'),
            cropPreview: document.getElementById('cropPreview'),
            cropZoom: document.getElementById('cropZoom'),
            cropZoomVal: document.getElementById('cropZoomVal'),
            cropRotate: document.getElementById('cropRotate'),
            cropRotateVal: document.getElementById('cropRotateVal'),
            cropReset: document.getElementById('cropReset'),
            cropUndo: document.getElementById('cropUndo'),
            cropRedo: document.getElementById('cropRedo'),
            cropSave: document.getElementById('cropSave'),
            cropCancel: document.getElementById('cropCancel'),
            cropModalClose: document.getElementById('cropModalClose'),
            shapeBtns: document.querySelectorAll('.shape-btn'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            emojiGrid: document.getElementById('emojiGrid'),
            liveToggle: document.getElementById('liveAvatarToggle'),
            fileInput: document.getElementById('hiddenFileInput'),
            editBtn: document.getElementById('profileEditBtn'),
            cancelBtn: document.getElementById('profileCancelBtn'),
            verifyAltEmailBtn: document.getElementById('verifyAltEmailBtn'),

            // Password Management Elements
            currentPassword: document.getElementById('currentPassword'),
            newPassword: document.getElementById('newPassword'),
            confirmPassword: document.getElementById('confirmPassword'),
            strengthBar: document.getElementById('strengthBar'),
            strengthText: document.getElementById('strengthText'),
            changePasswordBtn: document.getElementById('changePasswordBtn'),
            forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
            resetEmail: document.getElementById('resetEmail'),
            resetMethodBtns: document.querySelectorAll('.reset-method-btn'),
            sendResetBtn: document.getElementById('sendResetBtn'),
            sessionInfo: document.getElementById('sessionInfo'),
            logoutAllBtn: document.getElementById('logoutAllBtn'),
            passwordChangeMsg: document.getElementById('passwordChangeMessage'),
            passwordForm: document.getElementById('passwordChangeForm'),
            resetMsg: document.getElementById('resetMessage'),
            sessionMsg: document.getElementById('sessionMessage')
        };
    }

    // ============================================================
    // ✅ প্রোফাইল লোড
    // ============================================================
    #loadProfile() {
        const profile = storageService.getProfile();

        console.log('📂 Loading profile:', {
            altEmail: profile.altEmail,
            altEmailVerified: profile.altEmailVerified
        });

        // ✅ Chrome Password Manager-এর জন্য hidden username sync
        this.#syncPasswordFormUsername(profile);

        const nameEl = document.getElementById('profileDisplayName');
        const orgEl = document.getElementById('profileDisplayOrg');
        if (nameEl) nameEl.textContent = profile.fullName || profile.name || 'অতিথি';
        if (orgEl) orgEl.textContent = profile.org || 'প্রতিষ্ঠান';

        this.#populateFormData(profile);
        this.#loadAvatar();
        this.#populateDistricts();
        this.#updateAltEmailStatus();
    }

    // ============================================================
    // ✅ Chrome Password Manager Sync
    // ============================================================
    #syncPasswordFormUsername(profile) {
        const hiddenUser = document.getElementById('passwordChangeUsername');
        if (!hiddenUser) return;

        const user = authService.getCurrentUser();
        const email = user?.email || profile?.email || profile?.altEmail || '';
        hiddenUser.value = email;

        console.log('🔐 Password form username synced:', email ? '✓' : '✗ (empty)');
    }

    // ============================================================
    // ✅ ফর্ম ডেটা সংগ্রহ
    // ============================================================
    #collectFormData() {
        const profile = storageService.getProfile();
        const currentAltEmail = document.getElementById('profileAltEmail')?.value?.trim() || '';
        const savedAltEmail = profile.altEmail || '';

        const isAltEmailChanged = currentAltEmail !== savedAltEmail;
        return {
            fullName: document.getElementById('profileFullName')?.value?.trim() || '',
            dob: document.getElementById('profileDob')?.value || '',
            gender: document.getElementById('profileGender')?.value || '',
            nationality: document.getElementById('profileNationality')?.value?.trim() || '',
            phone: document.getElementById('profilePhone')?.value?.trim() || '',
            altEmail: currentAltEmail,
            altEmailVerified: isAltEmailChanged ? false : (profile.altEmailVerified || false),
            address: document.getElementById('profileAddress')?.value?.trim() || '',
            district: document.getElementById('profileDistrict')?.value || '',
            org: document.getElementById('profileOrg')?.value?.trim() || '',
            class: document.getElementById('profileClass')?.value?.trim() || '',
            section: document.getElementById('profileSection')?.value?.trim() || '',
            board: document.getElementById('profileBoard')?.value?.trim() || '',
            educationYear: document.getElementById('profileEducationYear')?.value?.trim() || '',
            rollNumber: document.getElementById('profileRollNumber')?.value?.trim() || '',
            socialLinks: {
                facebook: document.getElementById('profileFacebook')?.value?.trim() || '',
                linkedin: document.getElementById('profileLinkedin')?.value?.trim() || '',
                github: document.getElementById('profileGithub')?.value?.trim() || '',
                youtube: document.getElementById('profileYoutube')?.value?.trim() || ''
            },
            preferences: {
                favoriteSubjects: document.getElementById('profileFavoriteSubjects')?.value
                    ?.split(',').map(s => s.trim()).filter(Boolean) || [],
                preferredLanguage: document.getElementById('profilePreferredLanguage')?.value || 'bn',
                quizType: document.getElementById('profileQuizType')?.value || 'all',
                studyGoal: document.getElementById('profileStudyGoal')?.value?.trim() || ''
            }
        };
    }

    // ============================================================
    // ✅ প্রোফাইল ফর্ম পপুলেট
    // ============================================================
    #populateFormData(profile) {
        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setVal('profileFullName', profile.fullName || profile.name);
        setVal('profileDob', profile.dob);
        setVal('profileGender', profile.gender);
        setVal('profileNationality', profile.nationality);
        setVal('profilePhone', profile.phone);
        setVal('profileAltEmail', profile.altEmail);
        setVal('profileAddress', profile.address);
        setVal('profileDistrict', profile.district);
        setVal('profileOrg', profile.org);
        setVal('profileClass', profile.class);
        setVal('profileSection', profile.section);
        setVal('profileBoard', profile.board);
        setVal('profileEducationYear', profile.educationYear);
        setVal('profileRollNumber', profile.rollNumber);
        setVal('profileFacebook', profile.socialLinks?.facebook);
        setVal('profileLinkedin', profile.socialLinks?.linkedin);
        setVal('profileGithub', profile.socialLinks?.github);
        setVal('profileYoutube', profile.socialLinks?.youtube);
        setVal('profileFavoriteSubjects', (profile.preferences?.favoriteSubjects || []).join(', '));
        setVal('profilePreferredLanguage', profile.preferences?.preferredLanguage || 'bn');
        setVal('profileQuizType', profile.preferences?.quizType || 'all');
        setVal('profileStudyGoal', profile.preferences?.studyGoal);

        this.#updateAltEmailStatus();
    }

    // ============================================================
    // ✅ ফর্ম ডেটা ব্যাকআপ
    // ============================================================
    #backupFormData() {
        this.#originalData = {
            fullName: document.getElementById('profileFullName')?.value || '',
            dob: document.getElementById('profileDob')?.value || '',
            gender: document.getElementById('profileGender')?.value || '',
            nationality: document.getElementById('profileNationality')?.value || '',
            phone: document.getElementById('profilePhone')?.value || '',
            altEmail: document.getElementById('profileAltEmail')?.value || '',
            address: document.getElementById('profileAddress')?.value || '',
            district: document.getElementById('profileDistrict')?.value || '',
            org: document.getElementById('profileOrg')?.value || '',
            class: document.getElementById('profileClass')?.value || '',
            section: document.getElementById('profileSection')?.value || '',
            board: document.getElementById('profileBoard')?.value || '',
            educationYear: document.getElementById('profileEducationYear')?.value || '',
            rollNumber: document.getElementById('profileRollNumber')?.value || '',
            facebook: document.getElementById('profileFacebook')?.value || '',
            linkedin: document.getElementById('profileLinkedin')?.value || '',
            github: document.getElementById('profileGithub')?.value || '',
            youtube: document.getElementById('profileYoutube')?.value || '',
            favoriteSubjects: document.getElementById('profileFavoriteSubjects')?.value || '',
            preferredLanguage: document.getElementById('profilePreferredLanguage')?.value || 'bn',
            quizType: document.getElementById('profileQuizType')?.value || 'all',
            studyGoal: document.getElementById('profileStudyGoal')?.value || ''
        };
        console.log('💾 Form data backed up');
    }

    // ============================================================
    // ✅ ফর্ম ডেটা রিস্টোর
    // ============================================================
    #restoreFormData() {
        if (!this.#originalData) return;

        const data = this.#originalData;
        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setVal('profileFullName', data.fullName);
        setVal('profileDob', data.dob);
        setVal('profileGender', data.gender);
        setVal('profileNationality', data.nationality);
        setVal('profilePhone', data.phone);
        setVal('profileAltEmail', data.altEmail);
        setVal('profileAddress', data.address);
        setVal('profileDistrict', data.district);
        setVal('profileOrg', data.org);
        setVal('profileClass', data.class);
        setVal('profileSection', data.section);
        setVal('profileBoard', data.board);
        setVal('profileEducationYear', data.educationYear);
        setVal('profileRollNumber', data.rollNumber);
        setVal('profileFacebook', data.facebook);
        setVal('profileLinkedin', data.linkedin);
        setVal('profileGithub', data.github);
        setVal('profileYoutube', data.youtube);
        setVal('profileFavoriteSubjects', data.favoriteSubjects);
        setVal('profilePreferredLanguage', data.preferredLanguage);
        setVal('profileQuizType', data.quizType);
        setVal('profileStudyGoal', data.studyGoal);

        console.log('🔄 Form data restored');
    }

    // ============================================================
    // ✅ রিড-অনলি মোড
    // ============================================================
    #setReadonlyMode() {
        const form = document.getElementById('profileForm');
        const indicator = document.getElementById('profileModeIndicator');
        const editBtn = document.getElementById('profileEditBtn');
        const saveBtn = document.getElementById('profileSaveBtn');
        const cancelBtn = document.getElementById('profileCancelBtn');

        if (!form) return;

        form.classList.remove('editing');
        form.classList.add('readonly');

        if (indicator) {
            indicator.className = 'profile-mode-indicator readonly';
            const modeText = indicator.querySelector('.mode-text');
            const modeBadge = indicator.querySelector('.mode-badge');
            if (modeText) modeText.textContent = 'রিড-অনলি মোড';
            if (modeBadge) {
                modeBadge.textContent = 'দেখার জন্য';
                modeBadge.className = 'mode-badge readonly';
            }
        }

        form.querySelectorAll('.form-control').forEach(input => {
            if (input.id !== 'profileEmail') {
                input.disabled = true;
                input.readOnly = true;
            }
        });

        if (editBtn) editBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';

        this.#isEditing = false;
        console.log('🔒 Profile set to readonly mode');
    }

    // ============================================================
    // ✅ এডিট মোড
    // ============================================================
    #setEditMode() {
        const form = document.getElementById('profileForm');
        const indicator = document.getElementById('profileModeIndicator');
        const editBtn = document.getElementById('profileEditBtn');
        const saveBtn = document.getElementById('profileSaveBtn');
        const cancelBtn = document.getElementById('profileCancelBtn');

        if (!form) return;

        this.#backupFormData();

        form.classList.remove('readonly');
        form.classList.add('editing');

        if (indicator) {
            indicator.className = 'profile-mode-indicator editing';
            const modeText = indicator.querySelector('.mode-text');
            const modeBadge = indicator.querySelector('.mode-badge');
            if (modeText) modeText.textContent = '✏️ এডিট মোড';
            if (modeBadge) {
                modeBadge.textContent = 'পরিবর্তন করুন';
                modeBadge.className = 'mode-badge editing';
            }
        }

        form.querySelectorAll('.form-control').forEach(input => {
            if (input.id !== 'profileEmail') {
                input.disabled = false;
                input.readOnly = false;
            }
        });

        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        this.#isEditing = true;
        console.log('✏️ Profile set to edit mode');

        setTimeout(() => {
            const firstInput = form.querySelector('.form-control:not([disabled])');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 150);
    }

    // ============================================================
    // ✅ টগল এডিট মোড
    // ============================================================
    #toggleEditMode() {
        if (this.#isEditing) {
            this.#setReadonlyMode();
        } else {
            this.#setEditMode();
        }
    }

    // ============================================================
    // ✅ প্রোফাইল সংরক্ষণ
    // ============================================================
    async #handleSaveProfile() {
        const profileData = this.#collectFormData();

        if (!profileData.fullName || profileData.fullName.length < 2) {
            this.#showToast('❌ দয়া করে সঠিক পূর্ণ নাম দিন (২+ অক্ষর)', 'error');
            document.getElementById('profileFullName')?.focus();
            return;
        }

        const saveBtn = document.getElementById('profileSaveBtn');
        const originalText = saveBtn?.textContent || '💾 প্রোফাইল সংরক্ষণ করুন';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="spinner-small"></span> সংরক্ষণ করা হচ্ছে...`;
        }

        try {
            storageService.saveProfile(profileData);
            this.#updateProfileDisplay(profileData);
            this.#updateAltEmailStatus();
            this.#syncPasswordFormUsername(profileData);
            this.#showToast('✅ প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
            this.#setReadonlyMode();
        } catch (error) {
            console.error('Save error:', error);
            this.#showToast('❌ প্রোফাইল সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        }
    }

    // ============================================================
    // ✅ বাতিল হ্যান্ডলার
    // ============================================================
    #handleCancelEdit() {
        this.#restoreFormData();
        this.#setReadonlyMode();
        this.#showToast('🔄 পরিবর্তন বাতিল করা হয়েছে', 'info');
    }

    // ============================================================
    // ✅ জেলা লিস্ট পপুলেট
    // ============================================================
    #populateDistricts() {
        const districtSelect = document.getElementById('profileDistrict');
        if (!districtSelect) return;

        districtSelect.innerHTML = '<option value="">নির্বাচন করুন</option>';

        BANGLADESH_DISTRICTS.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }

    // ============================================================
    // ✅ প্রোফাইল ডিসপ্লে আপডেট
    // ============================================================
    #updateProfileDisplay(profile) {
        const nameEl = document.getElementById('profileDisplayName');
        const orgEl = document.getElementById('profileDisplayOrg');

        const displayName = profile.fullName || profile.name || 'অতিথি';
        if (nameEl) nameEl.textContent = displayName;
        if (orgEl) orgEl.textContent = profile.org || 'প্রতিষ্ঠান';

        if (window.app?.welcomePage) {
            window.app.welcomePage.updateUserInfo();
        }
    }

    // ============================================================
    // ✅ বিকল্প ইমেইল ভেরিফিকেশন হ্যান্ডলার
    // ============================================================
    async #handleAltEmailVerification() {
        const altEmailInput = document.getElementById('profileAltEmail');
        const altEmail = altEmailInput?.value?.trim();
        const verifyBtn = document.getElementById('verifyAltEmailBtn');

        if (!altEmail) {
            this.#showToast('❌ দয়া করে বিকল্প ইমেইল লিখুন', 'error');
            altEmailInput?.focus();
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(altEmail)) {
            this.#showToast('❌ সঠিক ইমেইল দিন', 'error');
            altEmailInput?.focus();
            return;
        }

        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.textContent = '⏳ পাঠানো হচ্ছে...';
        }

        try {
            const token = storageService.getToken();
            if (!token) {
                this.#showToast('❌ আপনি লগইন নন!', 'error');
                return;
            }

            console.log('📤 Sending verification email to:', altEmail);
            const data = await apiService.post('/auth/send-alt-email-verification', { altEmail });
            console.log('📥 Verification response:', data);

            if (data.success) {
                this.#showToast('✅ ভেরিফিকেশন ইমেইল পাঠানো হয়েছে! ইমেইল চেক করুন।', 'success');
                if (verifyBtn) {
                    verifyBtn.textContent = '✅ পাঠানো হয়েছে';
                    setTimeout(() => {
                        verifyBtn.textContent = '📧 ভেরিফাই করুন';
                        verifyBtn.disabled = false;
                    }, 5000);
                }
            } else {
                this.#showToast(`❌ ${data.message || 'ভেরিফিকেশন ইমেইল পাঠাতে সমস্যা'}`, 'error');
                if (verifyBtn) {
                    verifyBtn.textContent = '📧 ভেরিফাই করুন';
                    verifyBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('❌ Alt email verification error:', error);
            this.#showToast('❌ সার্ভারে সংযোগ করতে সমস্যা হয়েছে', 'error');
            if (verifyBtn) {
                verifyBtn.textContent = '📧 ভেরিফাই করুন';
                verifyBtn.disabled = false;
            }
        }
    }

    // ============================================================
    // ✅ বিকল্প ইমেইল স্ট্যাটাস আপডেট
    // ============================================================
    #updateAltEmailStatus() {
        const altEmailInput = document.getElementById('profileAltEmail');
        const statusBadge = document.getElementById('altEmailBadge');
        const verifyBtn = document.getElementById('verifyAltEmailBtn');

        if (!altEmailInput || !statusBadge || !verifyBtn) {
            console.warn('⚠️ Alt email elements not found');
            return;
        }

        const profile = storageService.getProfile();
        const altEmail = altEmailInput.value?.trim();
        const isVerified = profile.altEmailVerified === true;

        console.log('🔍 Alt email status check:', {
            altEmail,
            savedAltEmail: profile.altEmail,
            isVerified
        });

        if (!altEmail) {
            statusBadge.textContent = '—';
            statusBadge.className = 'status-badge';
            verifyBtn.style.display = 'none';
            return;
        }

        const savedAltEmail = profile.altEmail || '';
        if (altEmail !== savedAltEmail) {
            statusBadge.textContent = '⏳ ভেরিফাই হয়নি';
            statusBadge.className = 'status-badge status-unverified';
            verifyBtn.style.display = 'inline-flex';
            return;
        }

        if (isVerified) {
            statusBadge.textContent = '✅ ভেরিফাইড';
            statusBadge.className = 'status-badge status-verified';
            verifyBtn.style.display = 'none';
            console.log('✅ Alt email is verified - badge updated');
        } else {
            statusBadge.textContent = '⏳ ভেরিফাই হয়নি';
            statusBadge.className = 'status-badge status-unverified';
            verifyBtn.style.display = 'inline-flex';
        }
    }

    // ============================================================
    // ✅ অ্যাভাটার ম্যানেজমেন্ট
    // ============================================================
    #loadAvatar() {
        const avatar = storageService.getAvatar();
        const name = storageService.getProfileName();
        const initials = this.#getInitials(name);
        const color = getAvatarColor(name);

        const img = this.#elements.avatarImg;
        const initialsEl = this.#elements.avatarInitials;
        const wrapper = this.#elements.avatarWrapper;
        const largeImg = this.#elements.avatarLargeImg;
        const largeInitials = this.#elements.avatarLargeInitials;

        if (avatar) {
            if (img) { img.src = avatar; img.style.display = 'block'; }
            if (initialsEl) initialsEl.style.display = 'none';
            if (largeImg) { largeImg.src = avatar; largeImg.style.display = 'block'; }
            if (largeInitials) largeInitials.style.display = 'none';
            if (wrapper) {
                wrapper.style.background = 'none';
                wrapper.style.backgroundColor = 'transparent';
            }
        } else {
            if (img) img.style.display = 'none';
            if (initialsEl) {
                initialsEl.style.display = 'flex';
                initialsEl.textContent = initials;
            }
            if (largeImg) largeImg.style.display = 'none';
            if (largeInitials) {
                largeInitials.style.display = 'flex';
                largeInitials.textContent = initials;
            }
            if (wrapper) {
                wrapper.style.background = color;
                wrapper.style.backgroundColor = color;
                wrapper.style.backgroundImage = color;
            }
        }

        const resizedImage = storageService.getResizedImage();
        if (resizedImage && this.#elements.cropBtn) {
            this.#elements.cropBtn.disabled = false;
        }
    }

    #getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'A';
    }

    // ============================================================
    // ✅ ফাইল আপলোড
    // ============================================================
    async handleFileUpload(file) {
        try {
            console.log('📤 [handleFileUpload] Starting upload...');
            console.log('📤 File:', file.name, '| Size:', file.size, 'bytes | Type:', file.mimetype || file.type);

            const originalDataUrl = await this.#fileToDataURL(file);
            this.#originalImageData = originalDataUrl;

            const resizedDataUrl = await this.#resizeToSquare(file);
            storageService.saveResizedImage(resizedDataUrl);

            // ✅ Cloudinary upload
            console.log('📤 Uploading to Cloudinary...');
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const data = await apiService.uploadAvatar(formData);
                console.log('📥 Cloudinary response:', data);

                if (data.success && data.data?.url) {
                    console.log('✅ Cloudinary URL:', data.data.url);
                    storageService.saveAvatar(data.data.url);
                    this.#loadAvatar();
                    this.#showToast('✅ ছবি Cloudinary-তে আপলোড হয়েছে!', 'success');
                } else {
                    console.warn('⚠️ Cloudinary response missing URL:', data);
                    storageService.saveAvatar(resizedDataUrl);
                    this.#loadAvatar();
                    this.#showToast('⚠️ Cloudinary fail — locally saved', 'warning');
                }
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed:', uploadError);
                console.error('❌ Error message:', uploadError.message);
                storageService.saveAvatar(resizedDataUrl);
                this.#loadAvatar();
                this.#showToast('❌ Cloudinary fail — locally saved', 'warning');
            }

            if (this.#elements.cropBtn) {
                this.#elements.cropBtn.disabled = false;
            }
        } catch (error) {
            console.error('❌ File upload error:', error);
            this.#showToast('❌ ছবি আপলোডে সমস্যা হয়েছে!', 'error');
        }
    }

    #fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    #resizeToSquare(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    resetAvatar() {
        storageService.saveAvatar(null);
        storageService.saveResizedImage(null);
        this.#originalImageData = null;
        this.#loadedSourceImage = null;
        this.#loadAvatar();
        if (this.#elements.cropBtn) this.#elements.cropBtn.disabled = true;
        this.#showToast('🔄 ডিফল্ট অ্যাভাটার সেট করা হয়েছে!', 'info');
    }

    // ============================================================
    // ✅ কভার ইমেজ ম্যানেজমেন্ট
    // ============================================================
    #loadCoverImage() {
        const coverDataUrl = storageService.getCoverImage();
        const cover = this.#elements.coverElement;
        const removeBtn = this.#elements.removeCoverBtn;

        if (!cover) return;

        if (coverDataUrl) {
            cover.style.backgroundImage = `url(${coverDataUrl})`;
            cover.style.backgroundSize = 'cover';
            cover.style.backgroundPosition = 'center';
            cover.style.backgroundColor = 'transparent';
            cover.classList.add('has-cover');
            if (removeBtn) removeBtn.style.display = 'flex';
        } else {
            cover.style.backgroundImage = 'linear-gradient(135deg, var(--accent), #7c3aed)';
            cover.style.backgroundSize = 'cover';
            cover.style.backgroundPosition = 'center';
            cover.classList.remove('has-cover');
            if (removeBtn) removeBtn.style.display = 'none';
        }
    }

    /* async uploadCoverImage(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.#showToast('❌ ছবির সাইজ 5MB এর বেশি!', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.#showToast('❌ শুধু ছবি ফাইল আপলোড করুন!', 'error');
            return;
        }

        this.#isCoverLoading = true;
        const cover = this.#elements.coverElement;

        try {
            if (cover) cover.classList.add('cover-loading');
            const coverDataUrl = await this.#resizeCoverImage(file);
            storageService.saveCoverImage(coverDataUrl);

            if (cover) {
                cover.style.backgroundImage = `url(${coverDataUrl})`;
                cover.style.backgroundSize = 'cover';
                cover.style.backgroundPosition = 'center';
                cover.style.backgroundColor = 'transparent';
                cover.classList.add('has-cover');
                cover.classList.remove('cover-loading');
            }
            if (this.#elements.removeCoverBtn) {
                this.#elements.removeCoverBtn.style.display = 'flex';
            }
            this.#showToast('✅ কভার ইমেজ আপডেট করা হয়েছে!', 'success');
        } catch (error) {
            console.error('Cover upload error:', error);
            if (cover) cover.classList.remove('cover-loading');
            this.#showToast('❌ কভার ইমেজ আপলোডে সমস্যা হয়েছে!', 'error');
        } finally {
            this.#isCoverLoading = false;
        }
    } */

    async uploadCoverImage(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.#showToast('❌ ছবির সাইজ 5MB এর বেশি!', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            this.#showToast('❌ শুধু ছবি ফাইল আপলোড করুন!', 'error');
            return;
        }

        this.#isCoverLoading = true;
        const cover = this.#elements.coverElement;

        try {
            console.log('📤 [uploadCoverImage] Starting cover upload...');
            console.log('📤 File:', file.name, '| Size:', file.size, 'bytes | Type:', file.type);

            if (cover) cover.classList.add('cover-loading');
            
            // ✅ Local save (immediate preview)
            const coverDataUrl = await this.#resizeCoverImage(file);
            storageService.saveCoverImage(coverDataUrl);

            if (cover) {
                cover.style.backgroundImage = `url(${coverDataUrl})`;
                cover.style.backgroundSize = 'cover';
                cover.style.backgroundPosition = 'center';
                cover.style.backgroundColor = 'transparent';
                cover.classList.add('has-cover');
            }

            // ✅ Cloudinary upload
            console.log('📤 Uploading cover to Cloudinary...');
            const formData = new FormData();
            formData.append('cover', file);

            try {
                const data = await apiService.uploadCover(formData);
                console.log('📥 Cloudinary cover response:', data);

                if (data.success && data.data?.url) {
                    console.log('✅ Cloudinary cover URL:', data.data.url);
                    storageService.saveCoverImage(data.data.url);
                    
                    if (cover) {
                        cover.style.backgroundImage = `url(${data.data.url})`;
                    }
                    this.#showToast('✅ কভার Cloudinary-তে আপলোড হয়েছে!', 'success');
                } else {
                    console.warn('⚠️ Cloudinary response missing URL:', data);
                    this.#showToast('⚠️ Cloudinary fail — locally saved', 'warning');
                }
            } catch (uploadError) {
                console.error('❌ Cloudinary cover upload failed:', uploadError);
                console.error('❌ Error message:', uploadError.message);
                this.#showToast('❌ Cloudinary fail — locally saved', 'warning');
            }

            if (cover) cover.classList.remove('cover-loading');
            if (this.#elements.removeCoverBtn) {
                this.#elements.removeCoverBtn.style.display = 'flex';
            }
        } catch (error) {
            console.error('❌ Cover upload error:', error);
            if (cover) cover.classList.remove('cover-loading');
            this.#showToast('❌ কভার ইমেজ আপলোডে সমস্যা হয়েছে!', 'error');
        } finally {
            this.#isCoverLoading = false;
        }
    }

    #resizeCoverImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1200;
                    const maxHeight = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }

                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    removeCoverImage() {
        this.#showConfirmDialog(
            'কভার ইমেজ রিমুভ করুন',
            'আপনি কি নিশ্চিত যে কভার ইমেজ রিমুভ করতে চান?',
            () => {
                storageService.removeCoverImage();
                const cover = this.#elements.coverElement;
                if (cover) {
                    cover.style.backgroundImage = 'linear-gradient(135deg, var(--accent), #7c3aed)';
                    cover.style.backgroundSize = 'cover';
                    cover.style.backgroundPosition = 'center';
                    cover.classList.remove('has-cover');
                }
                if (this.#elements.removeCoverBtn) {
                    this.#elements.removeCoverBtn.style.display = 'none';
                }
                this.#showToast('🔄 কভার ইমেজ রিমুভ করা হয়েছে!', 'info');
            }
        );
    }

    // ============================================================
    // ✅ কনফর্মেশন ডায়ালগ
    // ============================================================
    #showConfirmDialog(title, message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3 class="modal-title">${title}</h3>
                <p class="modal-message">${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="confirmCancelBtn">বাতিল</button>
                    <button class="btn btn-danger" id="confirmOkBtn">ঠিক আছে</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');

        overlay.querySelector('#confirmCancelBtn').addEventListener('click', () => {
            overlay.remove();
            document.body.classList.remove('modal-open');
        });

        overlay.querySelector('#confirmOkBtn').addEventListener('click', () => {
            overlay.remove();
            document.body.classList.remove('modal-open');
            if (onConfirm) onConfirm();
        });
    }

    // ============================================================
    // ✅ ইমোজি অ্যাভাটার
    // ============================================================
    #loadEmojiGallery() {
        const emojiCategories = [
            { name: '😊 স্মাইলি', emojis: ['😊', '😄', '😍', '🥰', '😎', '🤩', '😇', '🥳', '🤗', '😺', '😸', '😻'] },
            { name: '👨‍🎓 ছাত্র/ছাত্রী', emojis: ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍🏫', '📚', '🎓', '✏️', '📖', '📝', '🏫'] },
            { name: '🐱 প্রাণী', emojis: ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐵', '🐧', '🦄'] },
            { name: '🎨 শখ ও কার্যক্রম', emojis: ['🎨', '🎵', '🎶', '🎮', '🎯', '🏆', '⭐', '💡', '🔥', '🌈', '🌸', '🌺'] },
            { name: '🚀 প্রযুক্তি', emojis: ['🚀', '💻', '🖥️', '📱', '🪐', '🌍', '⚡', '🔬', '🧪', '🤖', '💾', '🎮'] },
            { name: '🎭 ভিন্ন ভিন্ন', emojis: ['🎭', '🦋', '🌻', '🍀', '💎', '🎈', '🎁', '🧸', '🎪', '🎠', '🎢', '🌊'] }
        ];

        const grid = this.#elements.emojiGrid;
        if (!grid) return;

        let html = '';
        emojiCategories.forEach(category => {
            html += `<div class="emoji-category">
                <div class="emoji-category-title">${category.name}</div>
                <div class="emoji-category-grid">
                    ${category.emojis.map(emoji => `
                        <button class="emoji-option" data-emoji="${emoji}" title="${emoji}">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        });

        grid.innerHTML = html;

        grid.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.#selectEmojiAvatar(btn.dataset.emoji);
            });
        });
    }

    #selectEmojiAvatar(emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
        gradient.addColorStop(0, '#f8f0e8');
        gradient.addColorStop(0.5, '#f0e6d3');
        gradient.addColorStop(1, '#e8d5c4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        const fontSize = 100;
        ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#000000';
        ctx.fillText(emoji, 100, 108);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#000000';
        ctx.fillText(emoji, 100, 105);

        const glow = ctx.createRadialGradient(60, 60, 10, 60, 60, 80);
        glow.addColorStop(0, 'rgba(255,255,255,0.15)');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 200, 200);

        const dataUrl = canvas.toDataURL('image/png');
        storageService.saveAvatar(dataUrl);
        this.#loadAvatar();
        if (this.#elements.cropBtn) this.#elements.cropBtn.disabled = true;

        const emojiName = this.#getEmojiName(emoji) || emoji;
        this.#showToast(`✅ ইমোজি অ্যাভাটার সেট করা হয়েছে: ${emojiName}`, 'success');
    }

    #getEmojiName(emoji) {
        const names = {
            '😊': 'হাসি', '😄': 'বড় হাসি', '😍': 'ভালোবাসা', '🥰': 'আলিঙ্গন',
            '😎': 'চশমা', '🤩': 'তারকা চোখ', '😇': 'ফেরেশতা', '🥳': 'পার্টি',
            '🤗': 'আলিঙ্গনকারী', '😺': 'হাসি বিড়াল', '😸': 'হাসি বিড়াল', '😻': 'ভালোবাসা বিড়াল',
            '👨‍🎓': 'ছাত্র (পুরুষ)', '👩‍🎓': 'ছাত্রী (নারী)', '🧑‍🎓': 'ছাত্র', '👨‍🏫': 'শিক্ষক (পুরুষ)',
            '👩‍🏫': 'শিক্ষিকা (নারী)', '🧑‍🏫': 'শিক্ষক', '📚': 'বই', '🎓': 'পাগড়ি',
            '✏️': 'পেন্সিল', '📖': 'পড়া', '📝': 'নোট', '🏫': 'বিদ্যালয়',
            '🐱': 'বিড়াল', '🐶': 'কুকুর', '🦊': 'শিয়াল', '🐼': 'পান্ডা',
            '🐨': 'কোয়ালা', '🦁': 'সিংহ', '🐯': 'বাঘ', '🐮': 'গরু',
            '🐷': 'শূকর', '🐵': 'বানর', '🐧': 'পেঙ্গুইন', '🦄': 'ইউনিকর্ন',
            '🎨': 'আর্ট', '🎵': 'সঙ্গীত', '🎶': 'নোট', '🎮': 'গেম',
            '🎯': 'টার্গেট', '🏆': 'ট্রফি', '⭐': 'তারকা', '💡': 'আইডিয়া',
            '🔥': 'জ্বালা', '🌈': 'রংধনু', '🌸': 'চেরি ব্লসম', '🌺': 'ফুল',
            '🚀': 'রকেট', '💻': 'ল্যাপটপ', '🖥️': 'কম্পিউটার', '📱': 'মোবাইল',
            '🪐': 'শনি গ্রহ', '🌍': 'পৃথিবী', '⚡': 'বিজলী', '🔬': 'মাইক্রোস্কোপ',
            '🧪': 'টেস্ট টিউব', '🤖': 'রোবট', '💾': 'ডিস্ক', '🎮': 'গেম কন্ট্রোলার',
            '🎭': 'থিয়েটার', '🦋': 'প্রজাপতি', '🌻': 'সূর্যমুখী', '🍀': 'চার পাতা',
            '💎': 'হীরা', '🎈': 'বেলুন', '🎁': 'উপহার', '🧸': 'টেডি বিয়ার',
            '🎪': 'সার্কাস', '🎠': 'মেরি-গো-রাউন্ড', '🎢': 'রোলার কোস্টার', '🌊': 'ঢেউ'
        };
        return names[emoji] || null;
    }

    // ============================================================
    // ✅ ইভেন্ট লিসেনার সেটআপ
    // ============================================================
    #setupEventListeners() {
        // কভার পরিবর্তন
        if (this.#elements.changeCoverBtn) {
            const newBtn = this.#elements.changeCoverBtn.cloneNode(true);
            this.#elements.changeCoverBtn.parentNode.replaceChild(newBtn, this.#elements.changeCoverBtn);
            this.#elements.changeCoverBtn = newBtn;
            this.#elements.changeCoverBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.#elements.coverInput) {
                    this.#elements.coverInput.click();
                }
            });
        }

        if (this.#elements.coverInput) {
            this.#elements.coverInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.uploadCoverImage(file);
                }
                e.target.value = '';
            });
        }

        if (this.#elements.removeCoverBtn) {
            const newBtn = this.#elements.removeCoverBtn.cloneNode(true);
            this.#elements.removeCoverBtn.parentNode.replaceChild(newBtn, this.#elements.removeCoverBtn);
            this.#elements.removeCoverBtn = newBtn;
            this.#elements.removeCoverBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeCoverImage();
            });
        }

        // হোম বাটন
        if (this.#elements.homeBtn) {
            this.#elements.homeBtn.addEventListener('click', () => {
                this.#goHome();
            });
        }

        // এডিট বাটন
        if (this.#elements.editBtn) {
            const newBtn = this.#elements.editBtn.cloneNode(true);
            this.#elements.editBtn.parentNode.replaceChild(newBtn, this.#elements.editBtn);
            this.#elements.editBtn = newBtn;
            this.#elements.editBtn.addEventListener('click', () => {
                this.#toggleEditMode();
            });
        }

        // সেভ বাটন
        if (this.#elements.saveBtn) {
            const newBtn = this.#elements.saveBtn.cloneNode(true);
            this.#elements.saveBtn.parentNode.replaceChild(newBtn, this.#elements.saveBtn);
            this.#elements.saveBtn = newBtn;
            this.#elements.saveBtn.addEventListener('click', () => {
                this.#handleSaveProfile();
            });
        }

        // বাতিল বাটন
        if (this.#elements.cancelBtn) {
            const newBtn = this.#elements.cancelBtn.cloneNode(true);
            this.#elements.cancelBtn.parentNode.replaceChild(newBtn, this.#elements.cancelBtn);
            this.#elements.cancelBtn = newBtn;
            this.#elements.cancelBtn.addEventListener('click', () => {
                this.#handleCancelEdit();
            });
        }

        // অ্যাভাটার আপলোড
        if (this.#elements.uploadBtn) {
            this.#elements.uploadBtn.addEventListener('click', () => {
                if (this.#elements.fileInput) this.#elements.fileInput.click();
            });
        }

        if (this.#elements.fileInput) {
            this.#elements.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleFileUpload(file);
                e.target.value = '';
            });
        }

        // ক্রপ বাটন
        if (this.#elements.cropBtn) {
            const newCropBtn = this.#elements.cropBtn.cloneNode(true);
            this.#elements.cropBtn.parentNode.replaceChild(newCropBtn, this.#elements.cropBtn);
            this.#elements.cropBtn = newCropBtn;
            this.#elements.cropBtn.addEventListener('click', () => {
                this.#openCropModal();
            });
        }

        // রিসেট অ্যাভাটার
        if (this.#elements.resetBtn) {
            this.#elements.resetBtn.addEventListener('click', () => {
                this.resetAvatar();
            });
        }

        // ট্যাব
        if (this.#elements.tabs) {
            this.#elements.tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.#switchTab(tab.dataset.tab);
                });
            });
        }

        // ক্রপ ইভেন্ট
        this.#setupCropEvents();

        // লাইভ অ্যাভাটার টগল
        if (this.#elements.liveToggle) {
            this.#elements.liveToggle.addEventListener('change', (e) => {
                this.#toggleLiveAvatar(e.target.checked);
            });
        }

        // ফরগট পাসওয়ার্ড বাটন
        const forgotBtn = document.getElementById('forgotPasswordBtn');
        if (forgotBtn) {
            const newBtn = forgotBtn.cloneNode(true);
            forgotBtn.parentNode.replaceChild(newBtn, forgotBtn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.app?.authPage) {
                    window.app.authPage.show('forgot');
                }
            });
        }

        // বিকল্প ইমেইল ভেরিফিকেশন বাটন
        const verifyAltEmailBtn = document.getElementById('verifyAltEmailBtn');
        if (verifyAltEmailBtn) {
            const newBtn = verifyAltEmailBtn.cloneNode(true);
            verifyAltEmailBtn.parentNode.replaceChild(newBtn, verifyAltEmailBtn);
            this.#elements.verifyAltEmailBtn = newBtn;

            newBtn.addEventListener('click', async () => {
                await this.#handleAltEmailVerification();
            });
        }

        // বিকল্প ইমেইল ইনপুটে পরিবর্তন
        const altEmailInput = document.getElementById('profileAltEmail');
        if (altEmailInput) {
            altEmailInput.addEventListener('input', () => {
                this.#updateAltEmailStatus();
            });
        }
    }

    // ============================================================
    // ✅ ট্যাব ও লাইভ অ্যাভাটার
    // ============================================================
    #switchTab(tabId) {
        if (this.#elements.tabs) {
            this.#elements.tabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabId);
            });
        }
        if (this.#elements.tabContents) {
            this.#elements.tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `tab-${tabId}`);
            });
        }
        if (tabId === 'avatar') {
            const isLive = this.#elements.liveToggle?.checked;
            if (isLive) {
                this.#startLiveAvatar();
            }
        } else {
            this.#stopLiveAvatar();
        }
    }

    #toggleLiveAvatar(enabled) {
        if (enabled) {
            this.#startLiveAvatar();
        } else {
            this.#stopLiveAvatar();
        }
    }

    #startLiveAvatar() {
        const wrapper = this.#elements.avatarWrapper;
        if (wrapper) {
            wrapper.style.animation = 'floatAvatar 3s ease-in-out infinite';
            wrapper.style.transformOrigin = 'center center';
        }
    }

    #stopLiveAvatar() {
        const wrapper = this.#elements.avatarWrapper;
        if (wrapper) {
            wrapper.style.animation = 'none';
            wrapper.style.transform = 'none';
        }
    }

    // ============================================================
    // ✅ স্ট্যাট ও অ্যাক্টিভিটি
    // ============================================================
    #loadStats() {
        try {
            const leaderboard = storageService.getLeaderboard(50);
            const totalQuizzes = leaderboard.length;
            let totalScore = 0;
            let correct = 0;
            let wrong = 0;
            let skipped = 0;

            if (totalQuizzes > 0) {
                leaderboard.forEach(entry => {
                    totalScore += entry.score || 0;
                });
                correct = totalQuizzes * 7;
                wrong = totalQuizzes * 2;
                skipped = totalQuizzes * 1;
            }

            const avgScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuizzes) * 100) / 100 : 0;
            const hundredCount = storageService.getTimesHundred();

            if (this.#elements.totalQuizzes) this.#elements.totalQuizzes.textContent = totalQuizzes;
            if (this.#elements.avgScore) this.#elements.avgScore.textContent = `${avgScore}%`;
            if (this.#elements.correct) this.#elements.correct.textContent = correct;
            if (this.#elements.wrong) this.#elements.wrong.textContent = wrong;
            if (this.#elements.skipped) this.#elements.skipped.textContent = skipped;
            if (this.#elements.hundredCount) this.#elements.hundredCount.textContent = hundredCount;

            const totalQuestions = totalQuizzes * 10;
            const attempted = correct + wrong;
            const pct = totalQuestions > 0 ? Math.round((attempted / totalQuestions) * 100) : 0;
            if (this.#elements.progressPct) this.#elements.progressPct.textContent = `${pct}%`;
            if (this.#elements.progressBar) this.#elements.progressBar.style.width = `${pct}%`;
        } catch (error) {
            console.warn('Stats loading error:', error);
        }
    }

    #loadActivity() {
        const list = this.#elements.activityList;
        if (!list) return;
        const activities = this.#getActivities();

        if (activities.length === 0) {
            list.innerHTML = `<p class="empty-activity">📭 এখনও কোনো কার্যকলাপ নেই</p>`;
            return;
        }

        list.innerHTML = activities.map(act => `
            <div class="activity-item">
                <span class="activity-icon">${act.icon}</span>
                <span class="activity-text">${act.text}</span>
                <span class="activity-time">${act.time}</span>
            </div>
        `).join('');
    }

    #getActivities() {
        const leaderboard = storageService.getLeaderboard(10);
        const activities = [];
        if (leaderboard.length > 0) {
            activities.push({
                icon: '🏆',
                text: `${leaderboard.length}টি কুইজ সম্পন্ন করেছেন`,
                time: 'এখন'
            });
            const best = leaderboard[0];
            if (best) {
                activities.push({
                    icon: '⭐',
                    text: `সর্বোচ্চ স্কোর: ${best.score}%`,
                    time: 'রেকর্ড'
                });
            }
        }
        const hundredCount = storageService.getTimesHundred();
        if (hundredCount > 0) {
            activities.push({
                icon: '🎯',
                text: `${hundredCount} বার ১০০% স্কোর করেছেন`,
                time: 'অর্জন'
            });
        }
        return activities;
    }

    // ============================================================
    // ✅ নেভিগেশন
    // ============================================================
    #goHome() {
        this.#closeCropModal();
        this.#stopLiveAvatar();
        if (this.navigation) {
            this.navigation.navigateTo('welcome');
        } else if (window.app?.navigation) {
            window.app.navigation.navigateTo('welcome');
        }
    }

    // ============================================================
    // ✅ টোস্ট নোটিফিকেশন
    // ============================================================
    #showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
            <div class="toast-content">${message}</div>
            <button class="toast-close">✕</button>
            <div class="toast-progress"></div>
        `;
        container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================================
    // ✅ ক্রপিং ইঞ্জিন
    // ============================================================
    #getCropViewport() {
        const viewport = this.#elements.cropViewport;
        if (!viewport) {
            throw new Error('Crop viewport not found.');
        }
        const width = viewport.clientWidth;
        const height = viewport.clientHeight;
        if (!width || !height) {
            throw new Error('Crop viewport has invalid dimensions.');
        }
        return { width, height, centerX: width / 2, centerY: height / 2 };
    }

    #getImageGeometry() {
        const image = this.#loadedSourceImage;
        if (!image) {
            throw new Error('Source image is not loaded.');
        }
        const viewport = this.#getCropViewport();
        const imageWidth = image.naturalWidth || image.videoWidth || image.width;
        const imageHeight = image.naturalHeight || image.videoHeight || image.height;
        if (!imageWidth || !imageHeight) {
            throw new Error('Invalid source image dimensions.');
        }

        const baseScale = Math.min(viewport.width / imageWidth, viewport.height / imageHeight);
        const baseWidth = imageWidth * baseScale;
        const baseHeight = imageHeight * baseScale;
        const zoom = this.#cropState.zoom;

        return {
            imageWidth, imageHeight, baseScale, baseWidth, baseHeight,
            renderWidth: baseWidth * zoom, renderHeight: baseHeight * zoom,
            viewportWidth: viewport.width, viewportHeight: viewport.height,
            centerX: viewport.centerX, centerY: viewport.centerY
        };
    }

    #getTransform() {
        const geometry = this.#getImageGeometry();
        const state = this.#cropState;
        return { ...geometry, translateX: state.translateX, translateY: state.translateY, rotation: state.rotation, zoom: state.zoom };
    }

    #renderCrop(ctx, outputSize) {
        const source = this.#loadedSourceImage;
        if (!source) {
            throw new Error('Source image is not loaded.');
        }

        const transform = this.#getTransform();
        const state = this.#cropState;
        const ratioX = outputSize / transform.viewportWidth;
        const ratioY = outputSize / transform.viewportHeight;
        const ratio = Math.min(ratioX, ratioY);

        ctx.clearRect(0, 0, outputSize, outputSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputSize, outputSize);

        ctx.save();
        const center = outputSize / 2;
        ctx.beginPath();

        if (state.shape === CROP_CONFIG.SHAPES.CIRCLE) {
            ctx.arc(center, center, outputSize / 2, 0, Math.PI * 2);
        } else if (state.shape === CROP_CONFIG.SHAPES.ROUNDED) {
            const radius = outputSize * 0.08;
            ctx.roundRect(0, 0, outputSize, outputSize, radius);
        } else {
            ctx.rect(0, 0, outputSize, outputSize);
        }
        ctx.clip();

        switch (state.filter) {
            case CROP_CONFIG.FILTERS.GRAYSCALE: ctx.filter = 'grayscale(100%)'; break;
            case CROP_CONFIG.FILTERS.SEPIA: ctx.filter = 'sepia(80%)'; break;
            case CROP_CONFIG.FILTERS.BRIGHT: ctx.filter = 'brightness(1.3) contrast(1.1)'; break;
            case CROP_CONFIG.FILTERS.VINTAGE: ctx.filter = 'sepia(50%) contrast(1.2) brightness(0.9) saturate(1.5)'; break;
            case CROP_CONFIG.FILTERS.BLUR: ctx.filter = 'blur(3px)'; break;
            default: ctx.filter = 'none';
        }

        const drawWidth = transform.renderWidth * ratio;
        const drawHeight = transform.renderHeight * ratio;
        const drawX = (outputSize - drawWidth) / 2 + (transform.translateX * ratio);
        const drawY = (outputSize - drawHeight) / 2 + (transform.translateY * ratio);

        ctx.translate(center, center);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.translate(-center, -center);

        ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
    }

    #updateCropPreview() {
        if (this.#rafPending) return;
        this.#rafPending = true;

        requestAnimationFrame(() => {
            this.#rafPending = false;
            const preview = this.#elements.cropPreview;
            if (!preview || !this.#loadedSourceImage) return;

            let canvas = preview.querySelector('canvas');
            if (!canvas) {
                preview.innerHTML = '';
                canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                preview.appendChild(canvas);
            }

            const size = CROP_CONFIG.PREVIEW_SIZE || 400;
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                this.#renderCrop(ctx, size);
            } catch (error) {
                console.warn('Preview render error:', error);
            }
        });
    }

    async #generateFinalCrop() {
        if (this.#cropState._saving) return;
        if (!this.#loadedSourceImage) {
            this.#showToast('❌ ছবি পাওয়া যায়নি!', 'error');
            return;
        }

        this.#cropState._saving = true;

        try {
            console.log('📤 [generateFinalCrop] Starting final crop...');

            const canvas = document.createElement('canvas');
            const outputSize = CROP_CONFIG.OUTPUT_SIZE || 2000;
            canvas.width = outputSize;
            canvas.height = outputSize;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Unable to create canvas context.');
            }

            this.#renderCrop(ctx, outputSize);

            const dataUrl = canvas.toDataURL('image/jpeg', CROP_CONFIG.OUTPUT_QUALITY || 0.92);

            // ✅ Local save (immediate preview)
            storageService.saveAvatar(dataUrl);
            this.#loadAvatar();

            // ✅ Cloudinary upload
            console.log('📤 Uploading cropped image to Cloudinary...');
            const blob = await (await fetch(dataUrl)).blob();
            const formData = new FormData();
            formData.append('avatar', blob, `avatar-${Date.now()}.jpg`);

            try {
                const data = await apiService.uploadAvatar(formData);
                console.log('📥 Cloudinary response:', data);

                if (data.success && data.data?.url) {
                    console.log('✅ Cloudinary URL:', data.data.url);
                    storageService.saveAvatar(data.data.url);
                    this.#loadAvatar();
                    this.#showToast('✅ অ্যাভাটার Cloudinary-তে আপলোড হয়েছে!', 'success');
                } else {
                    console.warn('⚠️ Response missing URL:', data);
                    this.#showToast('⚠️ Cloudinary fail — locally saved', 'warning');
                }
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed:', uploadError);
                console.error('❌ Error message:', uploadError.message);
                this.#showToast('❌ Cloudinary fail — locally saved', 'warning');
            }

            this.#closeCropModal();
        } catch (error) {
            console.error('❌ Final crop error:', error);
            this.#showToast('❌ ক্রপ করা ছবি সংরক্ষণ করা যায়নি!', 'error');
        } finally {
            this.#cropState._saving = false;
        }
    }

    #applyCropTransform() {
        const image = this.#elements.cropImage;
        if (!image) return;
        const state = this.#cropState;
        image.style.transform = `translate(${state.translateX}px, ${state.translateY}px) rotate(${state.rotation}deg) scale(${state.zoom})`;
        image.style.transformOrigin = 'center center';
    }

    #updateCropUI() {
        this.#applyCropTransform();
        if (this.#elements.cropZoomVal) {
            this.#elements.cropZoomVal.textContent = `${Math.round(this.#cropState.zoom * 100)}%`;
        }
        if (this.#elements.cropZoom) {
            this.#elements.cropZoom.value = this.#cropState.zoom;
        }
        if (this.#elements.cropRotate) {
            this.#elements.cropRotate.value = this.#cropState.rotation;
        }
        if (this.#elements.cropRotateVal) {
            this.#elements.cropRotateVal.textContent = `${this.#cropState.rotation}°`;
        }
        this.#updateCropPreview();
    }

    #handlePointerDown(event) {
        const state = this.#cropState;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        state.isDragging = true;
        state.pointerId = event.pointerId;
        state.lastPointerX = event.clientX;
        state.lastPointerY = event.clientY;
        this.#elements.cropViewport?.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    #handlePointerMove(event) {
        const state = this.#cropState;
        if (!state.isDragging) return;
        if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
        const deltaX = event.clientX - state.lastPointerX;
        const deltaY = event.clientY - state.lastPointerY;
        state.translateX += deltaX;
        state.translateY += deltaY;
        state.lastPointerX = event.clientX;
        state.lastPointerY = event.clientY;
        this.#updateCropUI();
    }

    #handlePointerUp(event) {
        const state = this.#cropState;
        if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
        state.isDragging = false;
        state.pointerId = null;
        try {
            this.#elements.cropViewport?.releasePointerCapture(event.pointerId);
        } catch (error) { }
        this.#saveHistory();
    }

    #setupDragEvents() {
        const viewport = this.#elements.cropViewport;
        if (!viewport || this.#dragEventsBound) return;
        this.#dragEventsBound = true;
        this.#onPointerDown = (e) => this.#handlePointerDown(e);
        this.#onPointerMove = (e) => this.#handlePointerMove(e);
        this.#onPointerUp = (e) => this.#handlePointerUp(e);
        viewport.addEventListener('pointerdown', this.#onPointerDown);
        viewport.addEventListener('pointermove', this.#onPointerMove);
        viewport.addEventListener('pointerup', this.#onPointerUp);
        viewport.addEventListener('pointercancel', this.#onPointerUp);
    }

    #resetCrop() {
        this.#cropState.zoom = CROP_CONFIG.DEFAULT_ZOOM;
        this.#cropState.rotation = CROP_CONFIG.DEFAULT_ROTATION;
        this.#cropState.translateX = 0;
        this.#cropState.translateY = 0;
        this.#cropState.shape = CROP_CONFIG.SHAPES.CIRCLE;
        this.#cropState.filter = CROP_CONFIG.FILTERS.NONE;
        this.#updateCropUI();
        this.#updateCropShapeUI();
        this.#updateCropFilterUI();
        this.#saveHistory();
        this.#showToast('🔄 রিসেট করা হয়েছে!', 'info');
    }

    #setCropShape(shape) {
        const validShapes = [CROP_CONFIG.SHAPES.CIRCLE, CROP_CONFIG.SHAPES.SQUARE, CROP_CONFIG.SHAPES.ROUNDED];
        if (!validShapes.includes(shape)) return;
        this.#cropState.shape = shape;
        this.#updateCropShapeUI();
        this.#updateCropPreview();
        this.#saveHistory();
    }

    #setCropFilter(filter) {
        const validFilters = Object.values(CROP_CONFIG.FILTERS);
        if (!validFilters.includes(filter)) return;
        this.#cropState.filter = filter;
        this.#updateCropFilterUI();
        this.#updateCropPreview();
        this.#saveHistory();
    }

    #updateCropShapeUI() {
        const mask = this.#elements.cropOverlayMask;
        if (!mask) return;
        mask.classList.remove('shape-circle', 'shape-square', 'shape-rounded');
        const shape = this.#cropState.shape;
        if (shape === CROP_CONFIG.SHAPES.CIRCLE) {
            mask.classList.add('shape-circle');
        } else if (shape === CROP_CONFIG.SHAPES.ROUNDED) {
            mask.classList.add('shape-rounded');
        } else {
            mask.classList.add('shape-square');
        }
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === shape);
        });
    }

    #updateCropFilterUI() {
        const filter = this.#cropState.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    #openCropModal() {
        const image = this.#originalImageData || storageService.getResizedImage();
        if (!image) {
            this.#showToast('❌ প্রথমে ছবি আপলোড করুন!', 'warning');
            return;
        }

        if (!this.#elements.cropModal || !this.#elements.cropImage) {
            this.#showToast('❌ ক্রপিং ফিচার উপলব্ধ নয়!', 'error');
            return;
        }

        this.#isCropModalOpen = true;
        this.#cropState.zoom = CROP_CONFIG.DEFAULT_ZOOM;
        this.#cropState.rotation = CROP_CONFIG.DEFAULT_ROTATION;
        this.#cropState.translateX = 0;
        this.#cropState.translateY = 0;
        this.#cropState.shape = CROP_CONFIG.SHAPES.CIRCLE;
        this.#cropState.filter = CROP_CONFIG.FILTERS.NONE;
        this.#cropState.isDragging = false;
        this.#cropState.pointerId = null;
        this.#cropState._saving = false;

        this.#history = [];
        this.#historyIndex = -1;

        const cropImg = this.#elements.cropImage;
        cropImg.src = image;

        const srcImg = new Image();
        srcImg.onload = () => {
            this.#loadedSourceImage = srcImg;
            cropImg.style.width = '100%';
            cropImg.style.height = '100%';
            cropImg.style.objectFit = 'contain';
            cropImg.style.objectPosition = 'center';

            const viewport = this.#getCropViewport();
            const imgW = srcImg.naturalWidth;
            const imgH = srcImg.naturalHeight;
            const baseScale = Math.min(viewport.width / imgW, viewport.height / imgH);
            const renderW = imgW * baseScale;
            const renderH = imgH * baseScale;

            this.#cropState.translateX = (viewport.width - renderW) / 2;
            this.#cropState.translateY = (viewport.height - renderH) / 2;
            this.#cropState.zoom = 1;

            this.#updateCropUI();
            this.#updateCropShapeUI();
            this.#updateCropFilterUI();
            this.#updateUndoRedoButtons();

            document.querySelectorAll('.shape-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.shape === CROP_CONFIG.SHAPES.CIRCLE);
            });
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === CROP_CONFIG.FILTERS.NONE);
            });

            this.#setupDragEvents();
        };
        srcImg.src = image;

        this.#elements.cropModal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    #closeCropModal() {
        if (this.#elements.cropModal) {
            this.#elements.cropModal.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
        if (this.#onPointerDown && this.#elements.cropViewport) {
            this.#elements.cropViewport.removeEventListener('pointerdown', this.#onPointerDown);
            this.#elements.cropViewport.removeEventListener('pointermove', this.#onPointerMove);
            this.#elements.cropViewport.removeEventListener('pointerup', this.#onPointerUp);
            this.#elements.cropViewport.removeEventListener('pointercancel', this.#onPointerUp);
        }
        this.#dragEventsBound = false;
        this.#isCropModalOpen = false;
        this.#loadedSourceImage = null;
        const cropImg = this.#elements.cropImage;
        if (cropImg) {
            cropImg.src = '';
            cropImg.style.transform = '';
        }
    }

    #setupCropEvents() {
        if (this.#elements.cropZoom) {
            this.#elements.cropZoom.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.#cropState.zoom = Math.min(CROP_CONFIG.MAX_ZOOM, Math.max(CROP_CONFIG.MIN_ZOOM, value));
                this.#updateCropUI();
                this.#saveHistory();
            });
        }

        if (this.#elements.cropRotate) {
            this.#elements.cropRotate.addEventListener('input', (e) => {
                this.#cropState.rotation = parseInt(e.target.value) || 0;
                this.#updateCropUI();
                this.#saveHistory();
            });
        }

        if (this.#elements.cropReset) {
            this.#elements.cropReset.addEventListener('click', () => {
                this.#resetCrop();
            });
        }

        if (this.#elements.cropUndo) {
            this.#elements.cropUndo.addEventListener('click', () => this.#undo());
        }
        if (this.#elements.cropRedo) {
            this.#elements.cropRedo.addEventListener('click', () => this.#redo());
        }

        if (this.#elements.shapeBtns) {
            this.#elements.shapeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.#setCropShape(btn.dataset.shape);
                });
            });
        }

        if (this.#elements.filterBtns) {
            this.#elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.#setCropFilter(btn.dataset.filter);
                });
            });
        }

        if (this.#elements.cropSave) {
            this.#elements.cropSave.addEventListener('click', () => {
                this.#generateFinalCrop();
            });
        }

        if (this.#elements.cropCancel) {
            this.#elements.cropCancel.addEventListener('click', () => {
                this.#closeCropModal();
            });
        }

        if (this.#elements.cropModalClose) {
            this.#elements.cropModalClose.addEventListener('click', () => {
                this.#closeCropModal();
            });
        }

        if (this.#elements.cropModal) {
            this.#elements.cropModal.addEventListener('click', (e) => {
                if (e.target === this.#elements.cropModal) {
                    this.#closeCropModal();
                }
            });
        }
    }

    #saveHistory() {
        const state = { ...this.#cropState };
        delete state.isDragging;
        delete state.pointerId;
        delete state._saving;
        delete state.lastPointerX;
        delete state.lastPointerY;

        this.#history = this.#history.slice(0, this.#historyIndex + 1);
        this.#history.push(state);
        this.#historyIndex = this.#history.length - 1;

        if (this.#history.length > 10) {
            this.#history.shift();
            this.#historyIndex--;
        }
        this.#updateUndoRedoButtons();
    }

    #undo() {
        if (this.#historyIndex > 0) {
            this.#historyIndex--;
            const state = { ...this.#history[this.#historyIndex] };
            Object.assign(this.#cropState, state);
            this.#cropState.isDragging = false;
            this.#cropState.pointerId = null;
            this.#cropState._saving = false;
            this.#updateCropUI();
            this.#updateCropShapeUI();
            this.#updateCropFilterUI();
            this.#updateUndoRedoButtons();
        }
    }

    #redo() {
        if (this.#historyIndex < this.#history.length - 1) {
            this.#historyIndex++;
            const state = { ...this.#history[this.#historyIndex] };
            Object.assign(this.#cropState, state);
            this.#cropState.isDragging = false;
            this.#cropState.pointerId = null;
            this.#cropState._saving = false;
            this.#updateCropUI();
            this.#updateCropShapeUI();
            this.#updateCropFilterUI();
            this.#updateUndoRedoButtons();
        }
    }

    #updateUndoRedoButtons() {
        if (this.#elements.cropUndo) {
            this.#elements.cropUndo.disabled = this.#historyIndex <= 0;
        }
        if (this.#elements.cropRedo) {
            this.#elements.cropRedo.disabled = this.#historyIndex >= this.#history.length - 1;
        }
    }

    // ============================================================
    // ✅ পাবলিক মেথড - শো / হাইড
    // ============================================================
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.container.classList.add('active');
        }
        this.#loadProfile();
        this.#loadCoverImage();
        this.#loadStats();
        this.#loadActivity();
        this.#stopLiveAvatar();
        this.#setReadonlyMode();
        this.#populateDistricts();

        if (this.#elements.homeBtn) {
            this.#elements.homeBtn.style.display = 'flex';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.container.classList.remove('active');
        }
        this.#closeCropModal();
        this.#stopLiveAvatar();
    }
}

// ============================================================
// ✅ ডায়নামিক স্টাইল
// ============================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes floatAvatar {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-8px) scale(1.02); }
    }
`;
document.head.appendChild(style);