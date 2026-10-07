// frontend/js/pages/quiz.js
// Version: 3.5.0 - সম্পূর্ণ ফিক্স

import { QuizEngine } from '../core/QuizEngine.js';
import { MCQRenderer } from '../renderers/MCQRenderer.js';
import { BlankRenderer } from '../renderers/BlankRenderer.js';
import { RearrangingRenderer } from '../renderers/RearrangingRenderer.js';
import { apiService } from '../services/ApiService.js';
import { storageService } from '../services/StorageService.js';
import { ANSWER_STATUS, QUESTION_TYPES } from '../utils/constants.js';
import { SoundManager } from '../utils/SoundManager.js';
import { vibrationManager } from '../utils/VibrationManager.js';
import { getAvatarColor } from '../utils/AvatarColor.js';

export class QuizPage {
    #isRestarting = false;
    #quizEngine = null;
    #currentRenderer = null;
    #elements = {};
    #settings = {};
    #toast = null;
    #soundManager = null;
    #pendingSelectedTime = null;
    #pendingFullTimerMode = null;
    #navigation = null;
    #beforeUnloadHandler = null;
    #isQuizActive = false;
    #isQuizStarted = false;
    #selectedFilters = { board: '', class: '', subject: '', chapter: '', exercise: '' };

    constructor(navigation) {
        this.#navigation = navigation;
        this.#toast = new Toast();
        this.#soundManager = new SoundManager();
        this.#cacheElements();
        this.#loadSettings();
        this.#initEventListeners();
        this.#loadInitialData();
        this.#loadProfile();
        this.#applyDarkMode();
        this.#showQuizFilter();
        this.#updateLeaderboard();
        this.#beforeUnloadHandler = (e) => {
            if (this.#isQuizActive && this.#quizEngine?.getCurrentQuestion()) {
                const msg = 'কুইজ চলছে। পেজ রিফ্রেশ করলে আপনার অগ্রগতি হারাবে। আপনি কি নিশ্চিত?';
                e.preventDefault();
                e.returnValue = msg;
                return msg;
            }
        };
        this.#setupNotificationToggles();
    }

    #cacheElements() {
        const g = (id) => document.getElementById(id);
        const q = (sel) => document.querySelector(sel);
        this.#elements = {
            quizFilter: g('quizFilter'), boardSelect: g('boardSelect'), classSelect: g('classSelect'),
            subjectSelect: g('subjectSelect'), chapterSelect: g('chapterSelect'), exerciseSelect: g('exerciseSelect'),
            startBtn: g('startQuizBtn'), quizContainer: g('quiz-container'), topbar: q('.topbar'),
            controls: q('.controls'), nextBtn: g('nextBtn'), skipBtn: g('skipBtn'), quitBtn: g('quitBtn'),
            restartBtn: g('restartBtn'), timerDisplay: g('time'), scoreBoard: g('scoreBoard'),
            progressBar: g('progressBar'), metaInfo: g('metaInfo'), quizResult: g('quizResult'),
            totalQuestionsResult: g('totalQuestionsResult'), totalMarksResult: g('totalMarksResult'),
            scoreObtainedResult: g('scoreObtainedResult'), attemptedQuestionsResult: g('attemptedQuestionsResult'),
            correctAnswersResult: g('correctAnswersResult'), wrongAnswersResult: g('wrongAnswersResult'),
            skippedQuestionsResult: g('skippedQuestionsResult'), timedOutQuestionsResult: g('timedOutQuestionsResult'),
            percentageScoreResult: g('percentageScoreResult'), quizReview: g('quizReview'),
            reviewContent: g('reviewContent'), reviewBtn: g('reviewBtn'), resultQuitBtn: g('resultQuitBtn'),
            resultRestartBtn: g('resultRestartBtn'), reviewPageQuitBtn: g('reviewPageQuitBtn'),
            reviewPageResultBtn: g('reviewPageResultBtn'), reviewPageRestartBtn: g('reviewPageRestartBtn'),
            thanksGiving: g('thanksGiving'), thanksHomeBtn: g('thanksHomeBtn'), thanksNewQuizBtn: g('thanksNewQuizBtn'),
            thanksRestartBtn: g('thanksRestartBtn'), avatarBtn: g('avatarBtn'), profileBox: g('profileBox'),
            profileName: g('profileName'), profileEmail: g('profileEmail'), profileOrg: g('profileOrg'),
            profileClass: g('profileClass'), profileSection: g('profileSection'), profileBoard: g('profileBoard'),
            profileAvatarPreview: g('profileAvatarPreview'), uploadAvatar: g('uploadAvatar'),
            changeAvatarBtn: g('changeAvatarBtn'), editProfileBtn: g('editProfileBtn'), topUserName: g('topUserName'),
            topUserOrg: g('topUserOrg'), avatarImg: g('avatarImg'), avatarInitials: g('avatarInitials'),
            profileTimesHundred: g('profileTimesHundred'), profileProgressPct: g('profileProgressPct'),
            profileProgressBar: g('profileProgressBar'), profileProgressText: g('profileProgressText'),
            // ✅ প্রোফাইল বক্স ডিসপ্লে এলিমেন্ট (রিড-অনলি)
            profileBoxNameDisplay: g('profileBoxNameDisplay'),
            profileBoxEmailDisplay: g('profileBoxEmailDisplay'),
            profileBoxOrgDisplay: g('profileBoxOrgDisplay'),
            profileBoxClassDisplay: g('profileBoxClassDisplay'),
            profileBoxSectionDisplay: g('profileBoxSectionDisplay'),
            profileBoxBoardDisplay: g('profileBoxBoardDisplay'),
            // ✅ অ্যাভাটার এলিমেন্ট (রিড-অনলি)
            avatarImg: g('avatarImg'),
            avatarInitials: g('avatarInitials'),
            profileAvatarPreview: g('profileAvatarPreview'),
            
            hamburgerBtn: g('menuToggle'), sideMenu: g('sideMenu'), menuToggle: g('menuToggle'), userAvatar: g('userAvatar'), menuSettings: g('menuSettings'),
            settingsBlock: g('settingsBlock'), timeSlider: g('timeSlider'), sliderVal: g('sliderVal'),
            fullTimerCheckbox: g('fullTimerCheckbox'), menuDarkToggle: g('menuDarkToggle'),
            menuKeys: g('menuKeys'), menuFAQ: g('menuFAQ'), menuClose: g('menuClose'),
            saveScoreBtn: g('saveScoreBtn'), saveNameInput: g('saveName'), leaderboardList: g('leaderboardList'),
            confirmOverlay: g('confirmOverlay'), confirmTitle: g('confirmTitle'), confirmMessage: g('confirmMessage'),
            confirmOk: g('confirmOk'), confirmCancel: g('confirmCancel'), appWrap: g('appWrap')
        };
    }

    showPage() {
        console.log('📄 QuizPage.showPage() called');
        
        // ✅ main header দৃশ্যমান রাখুন — কুইজ ফিল্টার পেজে header থাকবেই
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        
        // ✅ quizFilter দেখান
        const filter = document.getElementById('quizFilter');
        if (filter) {
            filter.style.display = 'flex';
            filter.classList.add('active');
        }
        
        // ✅ অন্যান্য quiz element hide
        const hiddenElements = [
            'quiz-container',
            'quizResult',
            'quizReview',
            'thanksGiving'
        ];
        hiddenElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        // ✅ controls hide
        const controls = document.querySelector('.controls');
        if (controls) controls.style.display = 'none';
        
        /* ✅ ফিল্টার রিফ্রেশ
        if (typeof this.refreshFilters === 'function') {
            this.refreshFilters();
        } */

        // ✅ ✅ ✅ CRITICAL FIX: Categories reload when page shown
        console.log('🔄 Reloading categories...');
        this.#loadInitialData().catch(err => {
            console.error('❌ Failed to reload categories:', err);
        });
        
        console.log('✅ QuizPage shown (filter + header visible)');
    }

    hidePage() {
        console.log('📄 QuizPage.hidePage() called');
        
        // ✅ শুধু quiz-related element hide
        const filter = document.getElementById('quizFilter');
        if (filter) {
            filter.style.display = 'none';
            filter.classList.remove('active');
        }
        
        const container = document.getElementById('quiz-container');
        if (container) container.style.display = 'none';
        
        const controls = document.querySelector('.controls');
        if (controls) controls.style.display = 'none';
        
        const result = document.getElementById('quizResult');
        if (result) {
            result.style.display = 'none';
            result.classList.remove('visible');
        }
        
        const review = document.getElementById('quizReview');
        if (review) {
            review.style.display = 'none';
            review.classList.remove('visible');
        }
        
        const thanks = document.getElementById('thanksGiving');
        if (thanks) {
            thanks.style.display = 'none';
            thanks.classList.remove('visible');
        }
        
        // ❌ header কে touch করবেন না — controlHeader() এর কাজ
    }

    #loadSettings() {
        this.#settings = storageService.getSettings();
        const { timeSlider, sliderVal, menuDarkToggle, fullTimerCheckbox } = this.#elements;
        if (timeSlider) {
            const t = this.#settings.selectedTime || 60;
            timeSlider.value = t;
            if (sliderVal) sliderVal.textContent = t;
            this.#updateSliderProgress(t);
            document.querySelectorAll('.preset-btn').forEach(b => 
                b.classList.toggle('active', parseInt(b.dataset.time, 10) === t));
        }
        if (menuDarkToggle) menuDarkToggle.checked = this.#settings.darkMode;
        if (fullTimerCheckbox) fullTimerCheckbox.checked = this.#settings.fullTimerMode;
    
        const toastToggle = document.getElementById('toastToggle');
        if (toastToggle) toastToggle.checked = storageService.getToastEnabled();
    
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) soundToggle.checked = storageService.getSoundEnabled();
    
        const vibrationToggle = document.getElementById('vibrationToggle');
        if (vibrationToggle) vibrationToggle.checked = storageService.getVibrationEnabled();
    }

    // ✅ ডার্ক মোড অ্যাপ্লাই
    #applyDarkMode() {
        if (this.#settings.darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        const darkToggle = document.getElementById('menuDarkToggle');
        if (darkToggle) {
            darkToggle.checked = this.#settings.darkMode;
        }
    }

    // ✅ কুইজ ফিল্টার দেখান
    #showQuizFilter() {
        const e = this.#elements;
        if (e.quizFilter) e.quizFilter.style.display = 'flex';
        if (e.topbar) e.topbar.style.display = 'none';
        if (e.controls) e.controls.style.display = 'none';
        if (e.quizContainer) e.quizContainer.style.display = 'none';
        if (e.quizResult) e.quizResult.classList.remove('visible');
        if (e.quizReview) e.quizReview.classList.remove('visible');
        if (e.thanksGiving) e.thanksGiving.classList.remove('visible');
    }

    // ✅ লিডারবোর্ড আপডেট
    #updateLeaderboard() {
        const lb = storageService.getLeaderboard();
        const list = this.#elements.leaderboardList;
        if (!list) return;
        list.innerHTML = '';
        if (!lb.length) {
            list.innerHTML = '<li>এখনো কেউ স্কোর সেভ করেনি</li>';
            return;
        }
        lb.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} — ${item.score}`;
            list.appendChild(li);
        });
    }

    // ✅ টোস্ট নোটিফিকেশন সেটআপ
    #setupNotificationToggles() {
        const toastToggle = document.getElementById('toastToggle');
        if (toastToggle) {
            toastToggle.checked = storageService.getToastEnabled();
            toastToggle.addEventListener('change', () => {
                const enabled = toastToggle.checked;
                storageService.setToastEnabled(enabled);
                if (this.#toast) {
                    this.#toast.setEnabled(enabled);
                }
                if (enabled && this.#toast) {
                    this.#showToast('🔔 টোস্ট নোটিফিকেশন চালু হয়েছে', 'success');
                }
            });
        }

        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = storageService.getSoundEnabled();
            soundToggle.addEventListener('change', () => {
                const enabled = soundToggle.checked;
                storageService.setSoundEnabled(enabled);
                if (this.#soundManager) {
                    this.#soundManager.setEnabled(enabled);
                }
                if (enabled && this.#toast) {
                    this.#showToast('🔊 সাউন্ড নোটিফিকেশন চালু হয়েছে', 'success');
                }
            });
        }

        const vibrationToggle = document.getElementById('vibrationToggle');
        if (vibrationToggle) {
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
            const hasVibration = 'vibrate' in navigator;
            const isSupported = isMobile && hasVibration;

            vibrationToggle.checked = storageService.getVibrationEnabled();

            if (!isSupported) {
                vibrationToggle.disabled = true;
                vibrationToggle.checked = false;
                const row = vibrationToggle.closest('.toggle-row');
                if (row) {
                    row.style.opacity = '0.5';
                    row.style.pointerEvents = 'none';
                    row.title = 'শুধুমাত্র মোবাইল ডিভাইসে কাজ করে';
                }
            }

            vibrationToggle.addEventListener('change', () => {
                const enabled = vibrationToggle.checked;
                storageService.setVibrationEnabled(enabled);
                vibrationManager.setEnabled(enabled);
                if (this.#toast && enabled && isSupported) {
                    this.#showToast('📳 ভাইব্রেশন চালু হয়েছে', 'success');
                }
            });
        }
    }

    #playSound(type) {
        if (this.#soundManager) {
            this.#soundManager.play(type);
        }
    }

    #resizeAvatar(file, maxWidth = 150, maxHeight = 150, quality = 0.7) {
        return new Promise((resolve, reject) => {
            if (file.size < 500 * 1024) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async #handleAvatarUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.#showToast('শুধুমাত্র ইমেজ ফাইল আপলোড করুন', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.#showToast('ছবির সাইজ 5MB এর বেশি হতে পারবে না', 'error');
            return;
        }
        
        try {
            const resizedDataUrl = await this.#resizeAvatar(file);
            
            storageService.saveAvatar(resizedDataUrl);
            const el = this.#elements;
            
            if (el.profileAvatarPreview) {
                el.profileAvatarPreview.innerHTML = `<img src="${resizedDataUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
            }
            
            if (el.avatarImg) {
                el.avatarImg.src = resizedDataUrl;
                el.avatarImg.style.display = 'block';
                if (el.avatarInitials) {
                    el.avatarInitials.style.display = 'none';
                }
            }
            
            if (window.app?.welcomePage) {
                window.app.welcomePage.updateUserInfo();
            }
            
            this.#showToast('প্রোফাইল ছবি আপডেট করা হয়েছে', 'success');
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.#showToast('ছবি আপলোড করতে সমস্যা হয়েছে', 'error');
        }
    }

    #initEventListeners() {
        const { boardSelect, classSelect, subjectSelect, chapterSelect, exerciseSelect, startBtn,
                nextBtn, skipBtn, quitBtn, restartBtn, reviewBtn, resultQuitBtn, resultRestartBtn,
                reviewPageQuitBtn, reviewPageResultBtn, reviewPageRestartBtn, thanksHomeBtn, thanksNewQuizBtn,
                thanksRestartBtn, timeSlider, fullTimerCheckbox, menuDarkToggle, changeAvatarBtn,
                uploadAvatar, editProfileBtn, saveScoreBtn } = this.#elements;

        boardSelect?.addEventListener('change', (e) => {
            this.#selectedFilters.board = e.target.value === 'all' ? '' : e.target.value;
            this.#handleFilterSequence('board');
            this.#loadClasses();
        });
        classSelect?.addEventListener('change', (e) => {
            this.#selectedFilters.class = e.target.value === 'all' ? '' : e.target.value;
            this.#handleFilterSequence('class');
            this.#loadSubjects();
        });
        subjectSelect?.addEventListener('change', (e) => {
            this.#selectedFilters.subject = e.target.value === 'all' ? '' : e.target.value;
            this.#handleFilterSequence('subject');
            this.#loadChapters();
        });
        chapterSelect?.addEventListener('change', (e) => {
            this.#selectedFilters.chapter = e.target.value === 'all' ? '' : e.target.value;
            this.#handleFilterSequence('chapter');
            this.#loadExercises();
        });
        exerciseSelect?.addEventListener('change', (e) => {
            this.#selectedFilters.exercise = e.target.value === 'all' ? '' : e.target.value;
            this.#handleFilterSequence('exercise');
        });
        startBtn?.addEventListener('click', () => this.#startQuiz());
        nextBtn?.addEventListener('click', () => this.#nextQuestion());
        skipBtn?.addEventListener('click', () => this.#skipQuestion());
        quitBtn?.addEventListener('click', () => this.#quitQuiz());
        restartBtn?.addEventListener('click', () => this.#restartQuiz());
        reviewBtn?.addEventListener('click', () => this.#showReview());
        resultQuitBtn?.addEventListener('click', () => this.#showThanksGiving());
        resultRestartBtn?.addEventListener('click', () => this.#restartQuiz());
        reviewPageQuitBtn?.addEventListener('click', () => this.#showThanksGiving());
        reviewPageResultBtn?.addEventListener('click', () => this.#showResults());
        reviewPageRestartBtn?.addEventListener('click', () => this.#restartQuiz());
        thanksHomeBtn?.addEventListener('click', () => this.#goToHome());
        thanksNewQuizBtn?.addEventListener('click', () => this.#goToNewQuiz());
        thanksRestartBtn?.addEventListener('click', () => this.#restartQuiz());
        timeSlider?.addEventListener('input', (e) => this.#updateTimeSlider(e));
        fullTimerCheckbox?.addEventListener('change', () => this.#updateFullTimerMode());
        menuDarkToggle?.addEventListener('change', (e) => this.#toggleDarkMode(e.target.checked));
        //changeAvatarBtn?.addEventListener('click', () => uploadAvatar?.click());
        //uploadAvatar?.addEventListener('change', (e) => this.#handleAvatarUpload(e));
        //editProfileBtn?.addEventListener('click', () => this.#saveProfile());
        saveScoreBtn?.addEventListener('click', () => this.#saveScore());
        
        document.addEventListener('keydown', (e) => this.#handleKeyboard(e));
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = parseInt(btn.dataset.time, 10);
                if (isNaN(t)) return;
                if (this.#elements.timeSlider) this.#elements.timeSlider.value = t;
                if (this.#elements.sliderVal) this.#elements.sliderVal.textContent = t;
                this.#updateSliderProgress(t);
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.#pendingSelectedTime = t;
                if (this.#isQuizActive) {
                    const sliderVal = this.#elements.sliderVal;
                    if (sliderVal) {
                        sliderVal.style.color = 'var(--warning)';
                        setTimeout(() => { sliderVal.style.color = ''; }, 1500);
                    }
                }
            });
        });


        // Escape key - শুধু UI বন্ধ করবে, পেজ নেভিগেট করবে না
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const menu = document.getElementById('sideMenu');
                const pb = document.getElementById('profileBox');
        
                // সাইড মেনু বন্ধ করুন
                if (menu?.style.left === '0px') {
                    menu.style.left = '-360px';
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden', 'true');
                    const icon = document.querySelector('#menuToggle .hamburger-icon');
                    if (icon) icon.classList.remove('menu-open');
                    this.#handlePendingTimerChanges();
                }
        
                // প্রোফাইল বক্স বন্ধ করুন
                if (pb?.style.right === '0px') {
                    pb.style.right = '-320px';
                    pb.classList.remove('visible');
                    pb.style.display = 'none';
                    pb.style.visibility = 'hidden';
                    pb.style.opacity = '0';
                    pb.setAttribute('aria-hidden', 'true');
                    const ab = document.getElementById('userAvatar');
                    if (ab) { 
                        ab.style.borderColor = ''; 
                        ab.style.boxShadow = ''; 
                    }
                }
        
                // ✅ কোনো পেজ নেভিগেশন করবেন না - শুধু UI বন্ধ করুন
                // ⚠️ এখানে navigation.navigateTo('welcome') কল করা যাবে না
        
                // event propagation বন্ধ করুন
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Click outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('sideMenu');
            const hb = document.getElementById('menuToggle');
            const pb = document.getElementById('profileBox');
            const ab = document.getElementById('userAvatar');

            if (menu?.style.left === '0px') {
                if (!menu.contains(e.target) && !hb?.contains(e.target)) {
                    menu.style.left = '-360px';
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden', 'true');
                    const icon = document.querySelector('#menuToggle .hamburger-icon');
                    if (icon) icon.classList.remove('menu-open');
                    this.#handlePendingTimerChanges();
                }
            }

            if (pb?.style.right === '0px') {
                if (!pb.contains(e.target) && !ab?.contains(e.target)) {
                    pb.style.right = '-320px';
                    pb.classList.remove('visible');
                    pb.style.display = 'none';
                    pb.style.visibility = 'hidden';
                    pb.style.opacity = '0';
                    pb.setAttribute('aria-hidden', 'true');
                    if (ab) { ab.style.borderColor = ''; ab.style.boxShadow = ''; }
                }
            }
        });

        // Menu close button
        document.getElementById('menuClose')?.addEventListener('click', () => {
            const menu = document.getElementById('sideMenu');
            const icon = document.querySelector('#menuToggle .hamburger-icon');
            if (menu) {
                menu.style.left = '-360px';
                menu.classList.remove('open');
                menu.setAttribute('aria-hidden', 'true');
                if (icon) icon.classList.remove('menu-open');
                this.#handlePendingTimerChanges();
            }
        });

        // ✅ Profile Close button
        const profileCloseBtn = document.getElementById('profileCloseBtn');
        if (profileCloseBtn) {
            const newCloseBtn = profileCloseBtn.cloneNode(true);
            profileCloseBtn.parentNode.replaceChild(newCloseBtn, profileCloseBtn);
    
            newCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#closeProfileBox();
            });
        }

        // Menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', (e) => {
            const menu = document.getElementById('sideMenu');
            if (menu?.style.left === '0px') {
                setTimeout(() => {
                    this.#handlePendingTimerChanges();
                }, 50);
            }
        });

        // User avatar
        // ✅ User Avatar - প্রোফাইল বক্স টগল করুন
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            // পুরনো ইভেন্ট রিমুভ করতে ক্লোন করুন
            const newAvatar = userAvatar.cloneNode(true);
            userAvatar.parentNode.replaceChild(newAvatar, userAvatar);
    
            newAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
        
                // মেনু খোলা থাকলে বন্ধ করুন
                const menu = document.getElementById('sideMenu');
                if (menu?.style.left === '0px') {
                    menu.style.left = '-360px';
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden', 'true');
                    const icon = document.querySelector('#menuToggle .hamburger-icon');
                    if (icon) icon.classList.remove('menu-open');
                    setTimeout(() => {
                        this.#handlePendingTimerChanges();
                    }, 50);
                }
        
                // প্রোফাইল বক্স টগল করুন
                this.#toggleProfileBox();
            });
        }
    }

    #handleFilterSequence(key) {
        const { classSelect, subjectSelect, chapterSelect, exerciseSelect, startBtn } = this.#elements;
        const f = this.#selectedFilters;
        if (key === 'board') { classSelect.disabled = !f.board; if (!f.board) classSelect.value = 'all'; }
        else if (key === 'class') { subjectSelect.disabled = !f.class; if (!f.class) subjectSelect.value = 'all'; }
        else if (key === 'subject') { chapterSelect.disabled = !f.subject; if (!f.subject) chapterSelect.value = 'all'; }
        else if (key === 'chapter') { exerciseSelect.disabled = !f.chapter; if (!f.chapter) exerciseSelect.value = 'all'; }
        const all = f.board && f.class && f.subject && f.chapter && f.exercise;
        if (startBtn) {
            startBtn.disabled = !all;
            startBtn.classList.toggle('active', all);
        }
    }

/*    async #loadInitialData() {
        try {
            const data = await apiService.getCategories();
            if (!data?.success) throw new Error('Invalid response');
            const cats = data.data || {};
            this.#populateDropdown(this.#elements.boardSelect, cats.boards || []);
            if (this.#elements.boardSelect) this.#elements.boardSelect.disabled = false;
            this.#resetAllSelects();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.#showToast('ক্যাটাগরি লোড করতে সমস্যা হয়েছে', 'error');
            if (this.#elements.boardSelect) this.#elements.boardSelect.disabled = false;
        }
    }  */

    async #loadInitialData() {
        console.log('📥 #loadInitialData() called');
        console.log('🔑 Board element exists:', !!this.#elements.boardSelect);
        
        try {
            const data = await apiService.getCategories();
            console.log('📥 Categories API response:', data);
            
            if (!data?.success) {
                throw new Error(`Invalid response: ${JSON.stringify(data)}`);
            }
            
            const cats = data.data || {};
            console.log('📊 Boards received:', cats.boards);
            
            this.#populateDropdown(this.#elements.boardSelect, cats.boards || []);
            if (this.#elements.boardSelect) {
                this.#elements.boardSelect.disabled = false;
                console.log('✅ Board dropdown enabled');
            }
            this.#resetAllSelects();
            console.log('✅ Initial data loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load categories:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                apiBase: apiService.getBaseURL()
            });
            this.#showToast('ক্যাটাগরি লোড করতে সমস্যা হয়েছে', 'error');
            if (this.#elements.boardSelect) this.#elements.boardSelect.disabled = false;
        }
    }

    #resetAllSelects() {
        const texts = ['-- শ্রেণি নির্বাচন করুন --', '-- বিষয় নির্বাচন করুন --', 
                       '-- অধ্যায়/টপিক নির্বাচন করুন --', '-- অনুশীলনী/সাব-টপিক নির্বাচন করুন --'];
        [this.#elements.classSelect, this.#elements.subjectSelect, 
         this.#elements.chapterSelect, this.#elements.exerciseSelect].forEach((s, i) => {
            if (s) { s.innerHTML = `<option value="all">${texts[i]}</option>`; s.disabled = true; }
        });
    }

    #populateDropdown(select, items, text = '-- নির্বাচন করুন --') {
        if (!select) return;
        select.innerHTML = `<option value="all">${text}</option>`;
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            select.appendChild(opt);
        });
    }

    async #loadClasses() {
        const board = this.#elements.boardSelect?.value;
        if (!board || board === 'all') {
            if (this.#elements.classSelect) { this.#elements.classSelect.disabled = true; this.#resetBelow(this.#elements.classSelect); }
            return;
        }
        try {
            const data = await apiService.getCategories({ board });
            this.#populateDropdown(this.#elements.classSelect, data.data.classes);
            if (this.#elements.classSelect) this.#elements.classSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load classes:', error);
            this.#showToast('ক্লাস লোড করতে সমস্যা হয়েছে', 'error');
        }
    }

    async #loadSubjects() {
        const board = this.#elements.boardSelect?.value;
        const cls = this.#elements.classSelect?.value;
        if (!cls || cls === 'all') {
            if (this.#elements.subjectSelect) { this.#elements.subjectSelect.disabled = true; this.#resetBelow(this.#elements.subjectSelect); }
            return;
        }
        try {
            const data = await apiService.getCategories({ board, className: cls });
            this.#populateDropdown(this.#elements.subjectSelect, data.data.subjects);
            if (this.#elements.subjectSelect) this.#elements.subjectSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load subjects:', error);
            this.#showToast('বিষয় লোড করতে সমস্যা হয়েছে', 'error');
        }
    }

    async #loadChapters() {
        const board = this.#elements.boardSelect?.value;
        const cls = this.#elements.classSelect?.value;
        const sub = this.#elements.subjectSelect?.value;
        if (!sub || sub === 'all') {
            if (this.#elements.chapterSelect) { this.#elements.chapterSelect.disabled = true; this.#resetBelow(this.#elements.chapterSelect); }
            return;
        }
        try {
            const data = await apiService.getCategories({ board, className: cls, subject: sub });
            this.#populateDropdown(this.#elements.chapterSelect, data.data.chapters);
            if (this.#elements.chapterSelect) this.#elements.chapterSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load chapters:', error);
            this.#showToast('অধ্যায় লোড করতে সমস্যা হয়েছে', 'error');
        }
    }

    async #loadExercises() {
        const board = this.#elements.boardSelect?.value;
        const cls = this.#elements.classSelect?.value;
        const sub = this.#elements.subjectSelect?.value;
        const ch = this.#elements.chapterSelect?.value;
        if (!ch || ch === 'all') {
            if (this.#elements.exerciseSelect) {
                this.#elements.exerciseSelect.disabled = true;
                this.#elements.exerciseSelect.innerHTML = '<option value="all">-- অনুশীলনী নির্বাচন করুন --</option>';
            }
            if (this.#elements.startBtn) this.#elements.startBtn.disabled = true;
            this.#selectedFilters.exercise = '';
            return;
        }
        try {
            const data = await apiService.getCategories({ board, className: cls, subject: sub, chapter: ch });
            if (data?.data?.exercises?.length) {
                this.#populateDropdown(this.#elements.exerciseSelect, data.data.exercises);
                this.#elements.exerciseSelect.disabled = false;
            } else {
                this.#elements.exerciseSelect.innerHTML = '<option value="all">-- কোনো অনুশীলনী নেই --</option>';
                this.#elements.exerciseSelect.disabled = true;
            }
            this.#selectedFilters.exercise = '';
            if (this.#elements.exerciseSelect) this.#elements.exerciseSelect.value = 'all';
            if (this.#elements.startBtn) this.#elements.startBtn.disabled = true;
        } catch (error) {
            console.error('Failed to load exercises:', error);
            this.#showToast('অনুশীলনী লোড করতে সমস্যা হয়েছে', 'error');
        }
    }

    #resetBelow(el) {
        if (!el) return;
        let cur = el.nextElementSibling;
        while (cur && cur.tagName === 'SELECT') {
            cur.innerHTML = '<option value="all">-- নির্বাচন করুন --</option>';
            cur.disabled = true;
            cur = cur.nextElementSibling;
        }
    }

    async #startQuiz() {
        const f = {
            board: this.#elements.boardSelect?.value || 'all',
            className: this.#elements.classSelect?.value || 'all',
            subject: this.#elements.subjectSelect?.value || 'all',
            chapter: this.#elements.chapterSelect?.value || 'all',
            exercise: this.#elements.exerciseSelect?.value || 'all'
        };
        if (f.board === 'all' || f.className === 'all' || f.subject === 'all' || f.chapter === 'all' || f.exercise === 'all') {
            this.#showToast('দয়া করে সব ফিল্টার সিলেক্ট করুন', 'warning');
            return;
        }
        await this.#startQuizWithFilters(f);
    }

    #setupQuizEngineEvents() {
        if (!this.#quizEngine) return;
        const e = this.#elements;
        this.#quizEngine.on('timerTick', (t) => {
            if (e.timerDisplay) {
                e.timerDisplay.textContent = this.#formatTime(t);
                e.timerDisplay.style.color = t <= 10 ? 'orange' : '';
            }
        });
        this.#quizEngine.on('timeout', () => {
            this.#showToast('সময় শেষ!', 'warning');
            this.#playSound('timeout');
            if (e.nextBtn) e.nextBtn.style.display = 'block';
            if (e.skipBtn) { e.skipBtn.disabled = true; e.skipBtn.classList.add('disabled'); }
            if (this.#currentRenderer?.handleTimeout) this.#currentRenderer.handleTimeout();
            this.#updateUI();
        });
        this.#quizEngine.on('timerExpired', () => {
            if (this.#currentRenderer?.handleTimeout) this.#currentRenderer.handleTimeout();
            this.#updateUI();
        });
        this.#quizEngine.on('questionAnswered', () => this.#updateUI());
        this.#quizEngine.on('autoSubmitted', () => {
            this.#showToast('সময় শেষ! উত্তর স্বয়ংক্রিয়ভাবে জমা হয়েছে।', 'warning');
            this.#updateUI();
        });
        this.#quizEngine.on('questionChanged', () => {
            if (e.timerDisplay) e.timerDisplay.style.color = '';
            if (e.nextBtn) e.nextBtn.style.display = 'none';
            if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
            this.#renderCurrentQuestion();
            this.#updateUI();
            setTimeout(() => this.#renderKaTeX(), 150);
        });
        this.#quizEngine.on('fullQuizTimeout', () => {
            this.#showToast('সময় শেষ! পুরো কুইজের সময় শেষ হয়েছে।', 'warning');
            this.#playSound('timeout');
            this.#showResults();
        });
    }

    #computeTotalQuizTime(data) {
        const base = this.#settings.selectedTime;
        return data.reduce((sum, item) => sum + (item.isGroup ? 
            item.questions.reduce((s, q) => s + this.#computeSubQuestionTime(q, base), 0) :
            this.#computeSubQuestionTime(item.questions[0], base)), 0);
    }

    #computeQuestionTime(q) {
        const base = this.#settings.selectedTime;
        return q.isGroup ? q.questions.reduce((s, sq) => s + this.#computeSubQuestionTime(sq, base), 0) :
                           this.#computeSubQuestionTime(q.questions[0], base);
    }

    #computeSubQuestionTime(sq, base) {
        switch (sq.type) {
            case QUESTION_TYPES.MCQ: return base;
            case QUESTION_TYPES.BLANK_TYPE_A:
            case QUESTION_TYPES.BLANK_TYPE_B:
            case QUESTION_TYPES.BLANK_SUFFIX_PREFIX:
                return base * ((sq.q.match(/____|__Aa__|\([^)]+\)/g) || []).length);
            case QUESTION_TYPES.SENTENCE_REARRANGING:
                return base * ((sq.options || []).length);
            default: return base;
        }
    }

    #formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

    #showQuizScreen() {
        const e = this.#elements;
        
        // ✅ main header দৃশ্যমান রাখুন — কুইজ চলাকালীন header থাকবেই
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        
        // ✅ কুইজ স্ক্রিন দেখান
        if (e.quizFilter) e.quizFilter.style.display = 'none';
        if (e.controls) e.controls.style.display = 'flex';
        if (e.quizContainer) e.quizContainer.style.display = 'block';
        if (e.appWrap) e.appWrap.classList.remove('hidden');
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
        if (this.#quizEngine) this.#isQuizActive = true;
        this.#updateUI();
        if (e.timerDisplay) e.timerDisplay.style.color = '';
        this.#scrollToTop();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    #showMainHeader() { const h = document.getElementById('mainHeader'); if (h) h.style.display = 'flex'; }
    #hideMainHeader() { const h = document.getElementById('mainHeader'); if (h) h.style.display = 'none'; }

    #updateUI() {
        if (!this.#quizEngine) return;
        const p = this.#quizEngine.getProgress();
        const score = this.#quizEngine.getScore();
        const totalMarks = this.#quizEngine.getTotalMarks();
        const curQ = this.#quizEngine.getCurrentQuestionNumber();
        const totalQ = this.#quizEngine.getTotalQuestions();
        const pct = Math.min(p.percentage, 100);
        const hb = document.getElementById('progressBar');
        if (hb) hb.style.width = `${pct}%`;
        this.#updateTopbarStats(score, totalMarks, curQ, totalQ, pct);
        const e = this.#elements;
        if (e.scoreBoard) e.scoreBoard.textContent = `স্কোর: ${score.toFixed(2)}/${totalMarks}`;
        if (e.progressBar) e.progressBar.style.width = `${pct}%`;
        if (e.metaInfo) e.metaInfo.textContent = `প্রশ্ন: ${curQ}/${totalQ}`;
        const qpb = document.getElementById('quizProgressBar');
        if (qpb) qpb.style.width = `${pct}%`;
        const qsb = document.getElementById('quizScoreBoard');
        if (qsb) { const s = qsb.querySelector('strong'); if (s) s.textContent = score.toFixed(1); }
        const qmi = document.getElementById('quizMetaInfo');
        if (qmi) { const s = qmi.querySelector('strong'); if (s) s.textContent = `${curQ}/${totalQ}`; }
        const td = document.getElementById('time');
        if (td && this.#quizEngine) {
            const tl = this.#quizEngine._timer?.getTimeLeft?.();
            if (tl !== undefined && tl !== null) {
                td.textContent = this.#formatTime(tl);
                td.style.color = tl <= 10 ? 'orange' : '';
            }
        }
    }

    #updateTopbarTitle(title) {
        const b = document.getElementById('brandName');
        if (b && title) { b.textContent = `📚 ${title}`; b.classList.remove('hidden'); }
    }

    #updateTopbarStats(score, totalMarks, curQ, totalQ, pct) {
        const sb = document.getElementById('scoreBoard');
        const tm = document.getElementById('totalMarks');
        const cq = document.getElementById('currentQ');
        const tq = document.getElementById('totalQ');
        const pb = document.getElementById('progressBar');
        if (sb) { const s = sb.querySelector('strong'); if (s) s.textContent = score.toFixed(1); }
        if (tm) tm.textContent = totalMarks;
        if (cq) cq.textContent = curQ;
        if (tq) tq.textContent = totalQ;
        if (pb) pb.style.width = `${Math.min(pct, 100)}%`;
    }

    #renderCurrentQuestion() {
        const item = this.#quizEngine.getCurrentQuestion();
        if (!item) { console.error('No current question found!'); return; }
        const e = this.#elements;
        if (e.quizContainer) e.quizContainer.innerHTML = '';
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        const wrapper = document.createElement('div');
        wrapper.className = item.isGroup ? 'group-wrapper' : 'single-wrapper';
        if (item.stimulant?.trim()) {
            const s = document.createElement('div');
            s.className = 'stimulant-box';
            s.innerHTML = item.stimulant;
            wrapper.appendChild(s);
        }
        const questions = item.isGroup ? item.questions : [item.questions[0]];
        let answered = 0, total = questions.length, renderers = [];
        questions.forEach((sq, idx) => {
            sq.numid = sq.serialNumber;
            const sub = document.createElement('div');
            sub.className = 'sub-question-item';
            sub.style.cssText = `margin-bottom:20px;padding-bottom:15px;${idx < questions.length-1 ? 'border-bottom:1px solid var(--border);' : ''}`;
            const onAnswered = () => {
                if (++answered === total) {
                    if (this.#quizEngine?.getMode?.() !== 'full') this.#quizEngine.pauseTimer();
                    if (e.nextBtn) e.nextBtn.style.display = 'block';
                    if (e.skipBtn) { e.skipBtn.disabled = true; }
                }
                this.#updateUI();
            };
            let r = null;
            try {
                if (sq.type === QUESTION_TYPES.MCQ) {
                    r = new MCQRenderer(sub, this.#quizEngine);
                    r.renderSubQuestion(sq, onAnswered, sub, item.isGroup);
                } else if ([
                    QUESTION_TYPES.BLANK_TYPE_A,
                    QUESTION_TYPES.BLANK_TYPE_B,
                    QUESTION_TYPES.BLANK_SUFFIX_PREFIX
                ].includes(sq.type) ||
                    // ✅ Robust fallback — case-insensitive match
                    ['blank-type-a', 'blank-type-b', 'blank-suffix-prefix']
                        .includes(String(sq.type || '').trim().toLowerCase().replace(/\s+/g, '-'))) {
                    // ✅ Fix: options parameter সহ construct করুন
                    r = new BlankRenderer(sub, this.#quizEngine, { mode: 'quiz' });
                    
                    // ✅ ✅ ✅ Fix: render() method ব্যবহার করুন (renderBlankTypeA নয়)
                    // render() method নিজেই subQ.type চেক করে সঠিক method call করবে
                    const fakeQuestion = {
                        isGroup: false,
                        questions: [sq],
                        stimulant: null
                    };
                    r.render(fakeQuestion, onAnswered);
                } else if (sq.type === QUESTION_TYPES.SENTENCE_REARRANGING ||
                            String(sq.type || '').trim().toLowerCase().replace(/\s+/g, '-') === 'sentence-rearranging') {
                    r = new RearrangingRenderer(sub, this.#quizEngine, { mode: 'quiz' });
                    const fakeQuestion = {
                        isGroup: false,
                        questions: [sq],
                        stimulant: null
                    };
                    r.render(fakeQuestion, onAnswered);
                } else {
                    sub.innerHTML = `<div class="error">অজানা প্রশ্নের ধরন: ${sq.type}</div>`;
                }
                if (r) renderers.push(r);
            } catch (error) {
                console.error('Error rendering question:', error);
                sub.innerHTML = '<div class="error">প্রশ্ন রেন্ডার করতে সমস্যা হয়েছে</div>';
            }
            wrapper.appendChild(sub);
        });
        if (e.quizContainer) e.quizContainer.appendChild(wrapper);
        this.#currentRenderer = { handleTimeout: () => renderers.forEach(r => r?.handleTimeout?.()) };
        this.#updateUI();
        this.#scrollToTop();
        if (this.#quizEngine.getMode?.() !== 'full') {
            this.#quizEngine.setTimerDuration(this.#computeQuestionTime(item));
            this.#quizEngine.startTimer();
        }
        setTimeout(() => {
            this.#renderKaTeX();
            this.#scrollToTop();
        }, 100);
    }

    #scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const container = this.#elements.quizContainer;
        if (container) { container.scrollTop = 0; }
        const wrapper = document.querySelector('.app-wrapper');
        if (wrapper) { wrapper.scrollTop = 0; }
        document.querySelectorAll('.quiz-container, .question-card, .sub-question-item').forEach(el => {
            el.scrollTop = 0;
        });
    }

    #renderKaTeX() {
        const c = this.#elements.quizContainer;
        if (!c) return;
        c.querySelectorAll('.math, script[type="math/tex"]').forEach(el => {
            el.classList.add('katex-raw');
            el.classList.remove('katex-rendered');
        });
        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(c, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false });
                c.querySelectorAll('.math, script[type="math/tex"]').forEach(el => {
                    el.classList.remove('katex-raw');
                    el.classList.add('katex-rendered');
                });
                return;
            } catch (e) { /* ignore */ }
        }
        if (typeof katex !== 'undefined') {
            c.querySelectorAll('.math, script[type="math/tex"]').forEach(el => {
                try {
                    const tex = el.textContent?.trim();
                    if (tex) {
                        el.classList.add('katex-raw');
                        el.classList.remove('katex-rendered');
                        katex.render(tex, el, { throwOnError: false, displayMode: el.tagName === 'SCRIPT' || el.classList.contains('katex-display') });
                        el.classList.remove('katex-raw');
                        el.classList.add('katex-rendered');
                    }
                } catch (e) { /* ignore */ }
            });
        }
    }

    #nextQuestion() {
        if (this.#quizEngine.isComplete()) { this.#showResults(); return; }
        if (this.#quizEngine.getMode?.() !== 'full') this.#quizEngine.stopTimer();  
        this.#quizEngine.next();
        const e = this.#elements;
        this.#scrollToTop();
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
    }

    #skipQuestion() {
        if (this.#elements.skipBtn?.disabled) return;
        if (this.#quizEngine.getMode?.() !== 'full') this.#quizEngine.stopTimer();
        const item = this.#quizEngine.getCurrentQuestion();
        if (item?.questions) item.questions.forEach(sq => { if (sq.status === ANSWER_STATUS.UNANSWERED) sq.status = ANSWER_STATUS.SKIPPED; });
        this.#showToast(`প্রশ্ন ${this.#quizEngine.getCurrentQuestionNumber()} স্কিপ করা হয়েছে`, 'info');
        if (this.#quizEngine.getCurrentIndex() === this.#quizEngine.getTotalItems() - 1) {
            this.#showResults();
        } else {
            this.#quizEngine.next();
            const e = this.#elements;
            this.#scrollToTop();
            if (e.nextBtn) e.nextBtn.style.display = 'none';
            if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
            this.#renderCurrentQuestion();
        }
    }

    #quitQuiz() {
        if (this.#quizEngine) this.#quizEngine.pauseTimer();
        const o = document.getElementById('confirmOverlay');
        if (!o) { console.error('Confirm overlay not found'); this.#showResults(); return; }
        document.getElementById('confirmTitle').textContent = 'নিশ্চিতকরণ';
        document.getElementById('confirmMessage').textContent = 'তুমি কি সত্যিই কুইজ শেষ করে রেজাল্ট দেখতে চাও?';
        o.style.display = 'flex';
        const ok = document.getElementById('confirmOk'), cancel = document.getElementById('confirmCancel');
        const newOk = ok.cloneNode(true);
        ok.parentNode.replaceChild(newOk, ok);
        newOk.onclick = () => { o.style.display = 'none'; this.#showResults(); };
        const newCancel = cancel.cloneNode(true);
        cancel.parentNode.replaceChild(newCancel, cancel);
        newCancel.onclick = () => { o.style.display = 'none'; if (this.#quizEngine) this.#quizEngine.resumeTimer(); };
        o.onclick = (e) => { if (e.target === o) newCancel.click(); };
    }

    async #restartQuiz() {
        if (this.#isQuizActive && !confirm('পুনরায় শুরু করলে চলতি কুইজ রিসেট হবে। আপনি কি নিশ্চিত?')) return;
        this.#isQuizActive = false; this.#isQuizStarted = false;
        if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        const filters = {
            board: this.#elements.boardSelect?.value || 'all',
            className: this.#elements.classSelect?.value || 'all',
            subject: this.#elements.subjectSelect?.value || 'all',
            chapter: this.#elements.chapterSelect?.value || 'all',
            exercise: this.#elements.exerciseSelect?.value || 'all'
        };
        if (filters.board === 'all' || filters.className === 'all' || filters.subject === 'all' || filters.chapter === 'all' || filters.exercise === 'all') {
            this.#showToast('দয়া করে সব ফিল্টার সিলেক্ট করুন', 'warning');
            return;
        }
        if (this.#quizEngine) { try { this.#quizEngine.stopTimer(); } catch(e) {} this.#quizEngine = null; }
        if (this.#currentRenderer) { try { this.#currentRenderer.destroy?.(); } catch(e) {} this.#currentRenderer = null; }
        const e = this.#elements;
        if (e.quizContainer) { e.quizContainer.innerHTML = ''; e.quizContainer.style.display = 'block'; }
        if (e.quizResult) { e.quizResult.classList.remove('visible'); e.quizResult.style.display = 'none'; }
        if (e.quizReview) { e.quizReview.classList.remove('visible'); e.quizReview.style.display = 'none'; }
        if (e.thanksGiving) { e.thanksGiving.classList.remove('visible'); e.thanksGiving.style.display = 'none'; }
        if (e.controls) e.controls.style.display = 'flex';
        if (e.topbar) e.topbar.style.display = 'flex';
        if (e.quizFilter) e.quizFilter.style.display = 'none';
        if (e.scoreBoard) e.scoreBoard.textContent = 'স্কোর: 0/0';
        if (e.progressBar) e.progressBar.style.width = '0%';
        if (e.timerDisplay) { e.timerDisplay.textContent = '00:00'; e.timerDisplay.style.color = ''; }
        if (e.metaInfo) e.metaInfo.textContent = 'প্রশ্ন: 0/0';
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
        if (e.startBtn) { e.startBtn.disabled = true; e.startBtn.textContent = 'লোড হচ্ছে...'; }
        await this.#startQuizWithFilters(filters);
    }

    async #startQuizWithFilters(filters) {
        try {
            if (this.#elements.startBtn) { this.#elements.startBtn.textContent = 'লোড হচ্ছে...'; this.#elements.startBtn.disabled = true; }
            const result = await apiService.getFilteredQuizzes(filters);
            if (!result?.success) { console.error('API error:', result); this.#showToast('API কল ব্যর্থ হয়েছে!', 'error'); return; }
            if (!result.data?.length) { this.#showToast('এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি!', 'warning'); return; }
            this.#cleanupQuiz();
            this.#isQuizActive = true; this.#isQuizStarted = true;
            if (this.#beforeUnloadHandler) { window.removeEventListener('beforeunload', this.#beforeUnloadHandler); window.addEventListener('beforeunload', this.#beforeUnloadHandler); }
            this.#updateTopbarTitle(filters.subject || filters.className || 'কুইজ');
            if (this.#elements.quizContainer) this.#elements.quizContainer.innerHTML = '';
            const full = this.#elements.fullTimerCheckbox?.checked || false;
            let total = null;
            if (full) total = this.#computeTotalQuizTime(result.data);
            this.#quizEngine = new QuizEngine(result.data, { timePerQuestion: this.#settings.selectedTime, mode: full ? 'full' : 'perQuestion', totalDuration: total, soundManager: this.#soundManager });
            if (full) this.#quizEngine.startTimer();
            this.#setupQuizEngineEvents();
            this.#showQuizScreen();
            this.#renderCurrentQuestion();
            this.#scrollToTop();
            this.#updateLeaderboard();
            this.#showToast(`${result.data.length}টি প্রশ্ন লোড হয়েছে! 🚀`, 'success');
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.#showToast('কুইজ শুরু করতে সমস্যা হয়েছে: ' + (error.message || 'অজানা ত্রুটি'), 'error');
            this.#isQuizActive = false; this.#isQuizStarted = false;
            if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        } finally {
            if (this.#elements.startBtn) { this.#elements.startBtn.textContent = 'কুইজ শুরু করুন'; this.#elements.startBtn.disabled = false; }
        }
    }

    #cleanupQuiz() {
        if (this.#quizEngine) { this.#quizEngine.stopTimer(); this.#quizEngine = null; }
        if (this.#currentRenderer) { try { this.#currentRenderer.destroy?.(); } catch(e) {} this.#currentRenderer = null; }
        if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        this.#isQuizActive = false; this.#isQuizStarted = false;
        this.#pendingSelectedTime = null;
        this.#pendingFullTimerMode = null;
    }

    #getCurrentFilters() {
        return {
            board: this.#elements.boardSelect?.value || 'all',
            className: this.#elements.classSelect?.value || 'all',
            subject: this.#elements.subjectSelect?.value || 'all',
            chapter: this.#elements.chapterSelect?.value || 'all',
            exercise: this.#elements.exerciseSelect?.value || 'all'
        };
    }

    #resetQuizUI() {
        const e = this.#elements;
        if (e.scoreBoard) e.scoreBoard.textContent = 'স্কোর: 0/0';
        if (e.progressBar) e.progressBar.style.width = '0%';
        if (e.timerDisplay) { e.timerDisplay.textContent = '00:00'; e.timerDisplay.style.color = ''; }
        if (e.metaInfo) e.metaInfo.textContent = 'প্রশ্ন: 0 / 0';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
        if (e.nextBtn) e.nextBtn.style.display = 'none';
    }

    #showResults() {
        // ✅ main header দৃশ্যমান রাখুন
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        if (this.#quizEngine) { try { this.#quizEngine.stopTimer(); if (this.#soundManager) { this.#soundManager.play('complete'); } } catch(e) {} }
        this.#isQuizActive = false; this.#isQuizStarted = false;
        if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        if (!this.#quizEngine) { this.#showToast('কুইজ ডেটা পাওয়া যায়নি!', 'error'); return; }
        const results = this.#quizEngine.getResults();
        const e = this.#elements;
        if (e.quizReview) { e.quizReview.classList.remove('visible'); e.quizReview.style.display = 'none'; }
        if (e.thanksGiving) { e.thanksGiving.classList.remove('visible'); e.thanksGiving.style.display = 'none'; }
        if (e.quizContainer) { e.quizContainer.style.display = 'none'; e.quizContainer.innerHTML = ''; }
        if (e.controls) e.controls.style.display = 'none';
        this.#hideMainHeader();
        if (e.quizResult) { e.quizResult.classList.add('visible'); e.quizResult.style.display = 'block'; }
        this.#updateResultsUI(results);
        this.#updateProfileProgress();
        if (results.stats.percentage === 100) {
            storageService.incrementTimesHundred();
            if (e.profileTimesHundred) e.profileTimesHundred.textContent = storageService.getTimesHundred();
            this.#showToast('🎉 অভিনন্দন! ১০০% নম্বর পেয়েছেন! 🎉', 'success');
        }
        this.#updateLeaderboard();
        if (e.timerDisplay) { e.timerDisplay.textContent = '00:00'; e.timerDisplay.style.color = ''; }
        this.#playSound('complete');
        this.#scrollToTop();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    #updateResultsUI(r) {
        const s = r.stats;
        const pct = s.percentage % 1 === 0 ? s.percentage : s.percentage.toFixed(2);
        const e = this.#elements;
        if (e.totalQuestionsResult) e.totalQuestionsResult.textContent = s.total;
        if (e.totalMarksResult) e.totalMarksResult.textContent = r.totalMarks;
        if (e.scoreObtainedResult) e.scoreObtainedResult.textContent = r.score.toFixed(2);
        if (e.attemptedQuestionsResult) e.attemptedQuestionsResult.textContent = s.correct + s.wrong + (s.partial || 0);
        if (e.correctAnswersResult) e.correctAnswersResult.textContent = s.correct;
        if (e.wrongAnswersResult) e.wrongAnswersResult.textContent = s.wrong;
        if (e.skippedQuestionsResult) e.skippedQuestionsResult.textContent = s.skipped;
        if (e.timedOutQuestionsResult) e.timedOutQuestionsResult.textContent = s.timedOut + s.unanswered;
        if (e.percentageScoreResult) e.percentageScoreResult.textContent = `${pct}%`;
    }

    #showReview() {
        // ✅ main header দৃশ্যমান রাখুন
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        if (this.#elements.quizResult) {
            this.#elements.quizResult.classList.remove('visible');
            this.#elements.quizResult.style.display = 'none';
        }
        if (this.#elements.quizReview) {
            this.#elements.quizReview.classList.add('visible');
            this.#elements.quizReview.style.display = 'block';
        }

        // ✅ FIX: Review panel render করার আগে scroll lock + position reset
        document.body.style.overflow = 'hidden';

        this.#renderReview();

        // ✅ FIX: সব scrollable container শীর্ষে reset (sync + async)
        this.#scrollReviewToTop();

        // ✅ FIX: DOM render হওয়ার পরে forcefully scroll reset
        requestAnimationFrame(() => {
            this.#scrollReviewToTop();
            setTimeout(() => {
                this.#scrollReviewToTop();
                document.body.style.overflow = '';
            }, 100);
        });
    }

    #scrollReviewToTop() {
        // ✅ 1. Window scroll reset
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

        // ✅ 2. Review panel-এর নিজের scroll reset
        const reviewPanel = this.#elements.quizReview;
        if (reviewPanel) {
            reviewPanel.scrollTop = 0;
        }

        // ✅ 3. Review content (inner scroll container) reset
        const reviewContent = this.#elements.reviewContent;
        if (reviewContent) {
            reviewContent.scrollTop = 0;
        }

        // ✅ 4. সব parent scroll container reset
        const appWrapper = document.querySelector('.app-wrapper');
        if (appWrapper) appWrapper.scrollTop = 0;

        const appContent = document.getElementById('appContent');
        if (appContent) appContent.scrollTop = 0;

        const reviewCards = document.querySelector('.review-cards-container');
        if (reviewCards) reviewCards.scrollTop = 0;

        // ✅ 5. documentElement ও body — double reset (browser inconsistency এর জন্য)
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }

    #renderReview() {
        const results = this.#quizEngine.getResults();
        const rc = this.#elements.reviewContent;
        if (!rc) return;
        rc.innerHTML = '';

        // ============================================================
        // ✅ ১. Collect all sub-questions that need review
        // ============================================================
        const all = [];
        const counts = { wrong: 0, partial: 0, skipped: 0, timedout: 0 };

        results.quiz.forEach(item => {
            item.questions.forEach(sq => {
                if ([
                    ANSWER_STATUS.WRONG,
                    ANSWER_STATUS.PARTIAL,
                    ANSWER_STATUS.SKIPPED,
                    ANSWER_STATUS.TIMED_OUT
                ].includes(sq.status)) {
                    all.push({ subQ: sq, stimulant: item.stimulant, parentItem: item });
                    
                    if (sq.status === ANSWER_STATUS.WRONG) counts.wrong++;
                    else if (sq.status === ANSWER_STATUS.PARTIAL) counts.partial++;
                    else if (sq.status === ANSWER_STATUS.SKIPPED) counts.skipped++;
                    else if (sq.status === ANSWER_STATUS.TIMED_OUT) counts.timedout++;
                }
            });
        });

        // ============================================================
        // ✅ ২. Empty state
        // ============================================================
        if (!all.length) {
            rc.innerHTML = '<p class="no-review">রিভিউ করার জন্য কোনো প্রশ্ন নেই। সব উত্তর সঠিক হয়েছে! 🎉</p>';
            return;
        }

        // ============================================================
        // ✅ ৩. Summary bar
        // ============================================================
        rc.innerHTML = `
            <div class="review-summary-bar">
                <span class="summary-text">মোট <strong>${all.length}</strong>টি প্রশ্ন রিভিউ করা বাকি — </span>
                <span class="summary-item wrong">❌ ${counts.wrong} ভুল</span>
                <span class="summary-item partial">🔶 ${counts.partial} আংশিক</span>
                <span class="summary-item skipped">⏭️ ${counts.skipped} স্কিপ</span>
                <span class="summary-item timedout">⏰ ${counts.timedout} সময় শেষ</span>
            </div>
            <div class="review-filter-bar">
                <button class="filter-tab active" data-filter="all">সবগুলো (${all.length})</button>
                <button class="filter-tab" data-filter="wrong">❌ ভুল (${counts.wrong})</button>
                <button class="filter-tab" data-filter="partial">🔶 আংশিক (${counts.partial})</button>
                <button class="filter-tab" data-filter="skipped">⏭️ স্কিপ (${counts.skipped})</button>
                <button class="filter-tab" data-filter="timedout">⏰ সময় শেষ (${counts.timedout})</button>
            </div>
            <div class="review-cards-container"></div>
        `;

        const container = rc.querySelector('.review-cards-container');
        if (!container) return;

        // ============================================================
        // ✅ ৪. Render function — với chunked rendering
        // ============================================================
        const renderFilteredCards = (filter) => {
            // ✅ Filter apply
            const filtered = filter === 'all'
                ? all
                : all.filter(item => {
                    const s = item.subQ.status;
                    if (filter === 'wrong') return s === ANSWER_STATUS.WRONG;
                    if (filter === 'partial') return s === ANSWER_STATUS.PARTIAL;
                    if (filter === 'skipped') return s === ANSWER_STATUS.SKIPPED;
                    if (filter === 'timedout') return s === ANSWER_STATUS.TIMED_OUT;
                    return true;
                });

            container.innerHTML = '';

            if (!filtered.length) {
                container.innerHTML = '<p class="no-review">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</p>';
                return;
            }

            // ✅ ৫. Chunked rendering — প্রতি frame-এ ৫টি card
            const CHUNK_SIZE = 5;
            let currentIndex = 0;

            const renderChunk = () => {
                const fragment = document.createDocumentFragment();
                const endIndex = Math.min(currentIndex + CHUNK_SIZE, filtered.length);

                for (let i = currentIndex; i < endIndex; i++) {
                    const { subQ } = filtered[i];
                    
                    // ✅ MCQ sub-question-এর জন্য ReviewMode renderer
                    if (subQ.type === QUESTION_TYPES.MCQ) {
                        const cardWrapper = document.createElement('div');
                        fragment.appendChild(cardWrapper);

                        // ✅ MCQRenderer with review mode
                        const renderer = new MCQRenderer(cardWrapper, this.#quizEngine, {
                            mode: 'review',
                            readOnly: true,
                            showCorrectAnswer: true,
                            showUserAnswer: true,
                            showExplanationBtn: true,
                            showStatusBadge: true
                        });

                        // ✅ Single sub-question fake wrapper object
                        const fakeQuestion = {
                            isGroup: false,
                            questions: [subQ],
                            stimulant: filtered[i].stimulant || null
                        };
                        
                        renderer.render(fakeQuestion, null);
                    } else if (subQ.type === QUESTION_TYPES.BLANK_TYPE_A) {
                        const cardWrapper = document.createElement('div');
                        fragment.appendChild(cardWrapper);

                        const renderer = new BlankRenderer(cardWrapper, this.#quizEngine, {
                            mode: 'review',
                            readOnly: true
                        });

                        const fakeQuestion = {
                            isGroup: false,
                            questions: [subQ],
                            stimulant: filtered[i].stimulant || null
                        };

                        renderer.render(fakeQuestion, null);
                    }

                    // ============================================================
                    // ✅ Blank-Type-B (Phase 3)
                    // ============================================================
                    else if (subQ.type === QUESTION_TYPES.BLANK_TYPE_B) {
                        const cardWrapper = document.createElement('div');
                        fragment.appendChild(cardWrapper);

                        const renderer = new BlankRenderer(cardWrapper, this.#quizEngine, {
                            mode: 'review',
                            readOnly: true
                        });

                        const fakeQuestion = {
                            isGroup: false,
                            questions: [subQ],
                            stimulant: filtered[i].stimulant || null
                        };

                        renderer.render(fakeQuestion, null);
                    }

                    // ============================================================
                    // ✅ Blank-Suffix-Prefix (Phase 4A — NEW)
                    // ============================================================
                    else if (subQ.type === QUESTION_TYPES.BLANK_SUFFIX_PREFIX) {
                        const cardWrapper = document.createElement('div');
                        fragment.appendChild(cardWrapper);

                        const renderer = new BlankRenderer(cardWrapper, this.#quizEngine, {
                            mode: 'review',
                            readOnly: true
                        });

                        const fakeQuestion = {
                            isGroup: false,
                            questions: [subQ],
                            stimulant: filtered[i].stimulant || null
                        };

                        renderer.render(fakeQuestion, null);
                    }

                    // ============================================================
                    // ✅ Sentence-Rearranging (Phase 4B)
                    // ============================================================
                    else if (subQ.type === QUESTION_TYPES.SENTENCE_REARRANGING) {
                        const cardWrapper = document.createElement('div');
                        fragment.appendChild(cardWrapper);

                        const renderer = new RearrangingRenderer(cardWrapper, this.#quizEngine, {
                            mode: 'review',
                            readOnly: true
                        });

                        const fakeQuestion = {
                            isGroup: false,
                            questions: [subQ],
                            stimulant: filtered[i].stimulant || null
                        };

                        renderer.render(fakeQuestion, null);
                    }

                    // ============================================================
                    // ✅ Fallback (unknown types)
                    // ============================================================
                    else {
                        const fallbackCard = document.createElement('div');
                        fallbackCard.className = 'review-card';
                        fallbackCard.innerHTML = `
                            <div class="review-question">${subQ.numid}. ${subQ.q}</div>
                            <div class="review-unsupported">📝 এই প্রশ্নের ধরন (${subQ.type}) রিভিউ এখনো সমর্থিত নয়।</div>
                        `;
                        fragment.appendChild(fallbackCard);
                    }
                }

                container.appendChild(fragment);
                currentIndex = endIndex;

                // ✅ পরবর্তী chunk
                if (currentIndex < filtered.length) {
                    if (typeof requestIdleCallback === 'function') {
                        requestIdleCallback(renderChunk, { timeout: 100 });
                    } else {
                        setTimeout(renderChunk, 16);
                    }
                } else {
                    // ✅ সব render শেষ — KaTeX apply
                    this.#renderKaTeXInReview(container);
                }
            };

            // ✅ প্রথম chunk শুরু
            renderChunk();
        };

        // ============================================================
        // ✅ ৬. Filter Tab Event Binding
        // ============================================================
        rc.querySelectorAll('.filter-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                rc.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderFilteredCards(btn.dataset.filter);
            });
        });

        // ✅ Initial render
        renderFilteredCards('all');
    }

    #renderKaTeXInReview(container) {
        if (!container) return;
        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                });
            } catch (e) {
                console.warn('KaTeX render error in review:', e);
            }
        }
    }

    #showThanksGiving() {
        // ✅ main header দৃশ্যমান রাখুন
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        this.#isQuizActive = false; this.#isQuizStarted = false;
        if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        const e = this.#elements;
        if (e.quizResult) { e.quizResult.classList.remove('visible'); e.quizResult.style.display = 'none'; }
        if (e.quizReview) { e.quizReview.classList.remove('visible'); e.quizReview.style.display = 'none'; }
        if (e.quizContainer) { e.quizContainer.style.display = 'none'; e.quizContainer.innerHTML = ''; }
        if (e.controls) e.controls.style.display = 'none';
        this.#hideMainHeader();
        if (e.thanksGiving) { e.thanksGiving.classList.add('visible'); e.thanksGiving.style.display = 'block'; }
        if (e.timerDisplay) { e.timerDisplay.textContent = '00:00'; e.timerDisplay.style.color = ''; }
        if (e.scoreBoard) e.scoreBoard.textContent = 'স্কোর: 0/0';
        if (e.progressBar) e.progressBar.style.width = '0%';
        if (e.metaInfo) e.metaInfo.textContent = 'প্রশ্ন: 0/0';
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
        this.#scrollToTop();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    #goToNewQuiz() {
        // ✅ main header দৃশ্যমান রাখুন (কুইজ ফিল্টারে ফিরে যাচ্ছি)
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
        }
        if (this.#quizEngine) { this.#quizEngine.stopTimer(); this.#quizEngine = null; }
        if (this.#currentRenderer) { try { this.#currentRenderer.destroy?.(); } catch(e) {} this.#currentRenderer = null; }
        const e = this.#elements;
        if (e.quizResult) { e.quizResult.classList.remove('visible'); e.quizResult.style.display = 'none'; }
        if (e.quizReview) { e.quizReview.classList.remove('visible'); e.quizReview.style.display = 'none'; }
        if (e.thanksGiving) { e.thanksGiving.classList.remove('visible'); e.thanksGiving.style.display = 'none'; }
        if (e.quizContainer) { e.quizContainer.style.display = 'none'; e.quizContainer.innerHTML = ''; }
        if (e.controls) e.controls.style.display = 'none';
        if (e.quizFilter) e.quizFilter.style.display = 'flex';
        this.#showMainHeader();
        this.#resetQuizUI();
    }

    #goToHome() {
        // ✅ main header hide করুন (welcome-এ যাচ্ছি)
        // কিন্তু এটা controlHeader() এর কাজ — আমরা শুধু navigation কল করব
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.add('hidden');
            header.classList.remove('visible');
            header.style.display = 'none';
        }
        
        this.#isQuizActive = false; this.#isQuizStarted = false;
        if (this.#beforeUnloadHandler) window.removeEventListener('beforeunload', this.#beforeUnloadHandler);
        if (this.#quizEngine) { try { this.#quizEngine.stopTimer(); } catch(e) {} this.#quizEngine = null; }
        if (this.#currentRenderer) { try { this.#currentRenderer.destroy?.(); } catch(e) {} this.#currentRenderer = null; }
        const e = this.#elements;
        if (e.quizContainer) { e.quizContainer.innerHTML = ''; e.quizContainer.style.display = 'none'; }
        if (e.controls) e.controls.style.display = 'none';
        this.#hideMainHeader();
        if (e.quizResult) { e.quizResult.classList.remove('visible'); e.quizResult.style.display = 'none'; }
        if (e.quizReview) { e.quizReview.classList.remove('visible'); e.quizReview.style.display = 'none'; }
        if (e.thanksGiving) { e.thanksGiving.classList.remove('visible'); e.thanksGiving.style.display = 'none'; }
        if (e.quizFilter) e.quizFilter.style.display = 'none';
        if (e.appWrap) e.appWrap.classList.add('hidden');
        if (e.scoreBoard) e.scoreBoard.textContent = 'স্কোর: 0/0';
        if (e.timerDisplay) { e.timerDisplay.textContent = '00:00'; e.timerDisplay.style.color = ''; }
        if (e.progressBar) e.progressBar.style.width = '0%';
        if (e.metaInfo) e.metaInfo.textContent = 'প্রশ্ন: 0/0';
        if (e.nextBtn) e.nextBtn.style.display = 'none';
        if (e.skipBtn) { e.skipBtn.disabled = false; e.skipBtn.classList.remove('disabled'); }
        this.#resetFilters();
        if (this.#navigation) this.#navigation.navigateTo('welcome');
    }

    goToHome() { this.#goToHome(); }
    cleanupQuiz() { this.#cleanupQuiz(); }

    #resetFilters() {
        this.#selectedFilters = { board: '', class: '', subject: '', chapter: '', exercise: '' };
        const selects = [
            { el: this.#elements.boardSelect, txt: '-- বোর্ড/লেভেল নির্বাচন করুন --' },
            { el: this.#elements.classSelect, txt: '-- শ্রেণি নির্বাচন করুন --' },
            { el: this.#elements.subjectSelect, txt: '-- বিষয় নির্বাচন করুন --' },
            { el: this.#elements.chapterSelect, txt: '-- অধ্যায়/টপিক নির্বাচন করুন --' },
            { el: this.#elements.exerciseSelect, txt: '-- অনুশীলনী/সাব-টপিক নির্বাচন করুন --' }
        ];
        selects.forEach(({ el, txt }) => {
            if (el) { el.innerHTML = `<option value="all">${txt}</option>`; el.value = 'all'; el.disabled = el !== this.#elements.boardSelect; }
        });
        if (this.#elements.startBtn) { this.#elements.startBtn.disabled = true; this.#elements.startBtn.classList.remove('active'); }
        setTimeout(async () => { await this.#loadInitialData(); }, 50);
    }

    #loadProfile() {
        const p = storageService.getProfile();
        const name = p.name || 'অতিথি';
        const org = p.org || 'প্রতিষ্ঠান';
    
        // ✅ ডিসপ্লে এলিমেন্ট আপডেট (রিড-অনলি)
        const topUserName = document.getElementById('topUserName');
        const topUserOrg = document.getElementById('topUserOrg');
        const profileBoxNameDisplay = document.getElementById('profileBoxNameDisplay');
        const profileBoxOrgDisplay = document.getElementById('profileBoxOrgDisplay');
        const profileBoxEmailDisplay = document.getElementById('profileBoxEmailDisplay');
        const profileBoxClassDisplay = document.getElementById('profileBoxClassDisplay');
        const profileBoxSectionDisplay = document.getElementById('profileBoxSectionDisplay');
        const profileBoxBoardDisplay = document.getElementById('profileBoxBoardDisplay');
    
        if (topUserName) topUserName.textContent = name;
        if (topUserOrg) topUserOrg.textContent = org;
        if (profileBoxNameDisplay) profileBoxNameDisplay.textContent = name;
        if (profileBoxOrgDisplay) profileBoxOrgDisplay.textContent = org || 'প্রতিষ্ঠান';
        if (profileBoxEmailDisplay) profileBoxEmailDisplay.textContent = p.email || '—';
        if (profileBoxClassDisplay) profileBoxClassDisplay.textContent = p.class || '—';
        if (profileBoxSectionDisplay) profileBoxSectionDisplay.textContent = p.section || '—';
        if (profileBoxBoardDisplay) profileBoxBoardDisplay.textContent = p.board || '—';
    
        // ✅ খালি ভ্যালুগুলোর জন্য স্টাইল
        [profileBoxEmailDisplay, profileBoxClassDisplay, profileBoxSectionDisplay, profileBoxBoardDisplay].forEach(el => {
            if (el && (el.textContent === '' || el.textContent === '—')) {
                el.classList.add('empty');
            } else if (el) {
                el.classList.remove('empty');
            }
        });
    
        // ✅ ইনিশিয়াল জেনারেশন
        const initials = name
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'A';
    
        const avatarInitials = document.getElementById('avatarInitials');
        if (avatarInitials) {
            avatarInitials.textContent = initials;
        }
    
        // ✅ অ্যাভাটার লোড
        const avatar = storageService.getAvatar();
        const avatarImg = document.getElementById('avatarImg');
        const profileAvatarPreview = document.getElementById('profileAvatarPreview');
    
        if (avatar && avatarImg) {
            avatarImg.src = avatar;
            avatarImg.style.display = 'block';
            if (avatarInitials) avatarInitials.style.display = 'none';
            if (profileAvatarPreview) {
                profileAvatarPreview.innerHTML = `<img src="${avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
            }
        } else if (avatarImg) {
            avatarImg.style.display = 'none';
            if (avatarInitials) {
                avatarInitials.style.display = 'flex';
                const color = getAvatarColor(name);
                avatarInitials.style.background = color;
                avatarInitials.style.color = '#fff';
            }
            if (profileAvatarPreview) {
                const color = getAvatarColor(name);
                profileAvatarPreview.innerHTML = `<div class="avatar-placeholder" style="background:${color};display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;width:100%;height:100%;">${initials}</div>`;
            }
        }
    
        // ✅ প্রগ্রেস আপডেট
        const profileTimesHundred = document.getElementById('profileTimesHundred');
        if (profileTimesHundred) {
            profileTimesHundred.textContent = storageService.getTimesHundred();
        }
    
        // ✅ প্রগ্রেস বার আপডেট
        this.#updateProfileProgress();
    }


    #isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    #toggleProfileBox() {
        const pb = document.getElementById('profileBox');
        if (!pb) return;
        pb.style.right === '0px' ? this.#closeProfileBox() : this.#openProfileBox();
    }

    #openProfileBox() {
        const pb = document.getElementById('profileBox');
        if (!pb) return;
    
        // ✅ খোলার আগে ডেটা রিফ্রেশ করুন
        this.#loadProfile();
    
        pb.style.right = '0px';
        pb.style.display = 'block';
        pb.style.visibility = 'visible';
        pb.style.opacity = '1';
        pb.classList.add('visible');
        pb.setAttribute('aria-hidden', 'false');
    
        const ab = document.getElementById('userAvatar');
        if (ab) {
            ab.style.borderColor = 'var(--accent)';
            ab.style.boxShadow = '0 0 0 2px var(--accent)';
        }
    
        const sm = document.getElementById('sideMenu');
        if (sm?.style.left === '0px') this.#closeSideMenu();
    }

    #closeProfileBox() {
        const pb = document.getElementById('profileBox');
        if (!pb) return;
        pb.style.right = '-320px'; pb.style.display = 'none'; pb.style.visibility = 'hidden'; pb.style.opacity = '0';
        pb.classList.remove('visible'); pb.setAttribute('aria-hidden', 'true');
        const ab = document.getElementById('userAvatar');
        if (ab) { ab.style.borderColor = ''; ab.style.boxShadow = ''; }
    }

    #saveScore() {
        const name = this.#elements.saveNameInput?.value.trim() || 'অতিথি';
        const score = this.#quizEngine?.getScore() || 0;
        storageService.saveScore(name, score);
        if (this.#elements.saveNameInput) this.#elements.saveNameInput.value = '';
        this.#updateLeaderboard();
        this.#showToast('স্কোর সেভ করা হয়েছে', 'success');
    }

    #toggleSettings() {
        const b = this.#elements.settingsBlock;
        if (b) b.style.display = b.style.display === 'none' ? 'block' : 'none';
    }

    #updateTimeSlider(e) {
        const t = parseInt(e.target.value, 10);
        if (isNaN(t)) return;
        if (this.#elements.sliderVal) this.#elements.sliderVal.textContent = t;
        this.#updateSliderProgress(t);
        document.querySelectorAll('.preset-btn').forEach(b => 
            b.classList.toggle('active', parseInt(b.dataset.time, 10) === t));
        this.#pendingSelectedTime = t;
        if (this.#isQuizActive) {
            const sliderVal = this.#elements.sliderVal;
            if (sliderVal) {
                sliderVal.style.color = 'var(--warning)';
                setTimeout(() => { sliderVal.style.color = ''; }, 1500);
            }
        }
    }

    #updateSliderProgress(value) {
        const s = this.#elements.timeSlider;
        if (!s) return;
        const min = parseInt(s.min) || 10, max = parseInt(s.max) || 90;
        s.style.setProperty('--progress', `${Math.min(((value - min) / (max - min)) * 100, 100)}%`);
    }

    #updateFullTimerMode() {
        const newMode = this.#elements.fullTimerCheckbox?.checked || false;
        this.#pendingFullTimerMode = newMode;
        if (this.#isQuizActive) {
            const toggleRow = this.#elements.fullTimerCheckbox?.closest('.toggle-row');
            if (toggleRow) {
                toggleRow.style.borderColor = 'var(--warning)';
                setTimeout(() => { toggleRow.style.borderColor = ''; }, 1500);
            }
        }
    }

    #applyPendingSettings() {
        let changed = false;
        if (this.#pendingSelectedTime !== null && this.#pendingSelectedTime !== this.#settings.selectedTime) {
            storageService.setSelectedTime(this.#pendingSelectedTime);
            this.#settings.selectedTime = this.#pendingSelectedTime;
            changed = true;
        }
        if (this.#pendingFullTimerMode !== null && this.#pendingFullTimerMode !== this.#settings.fullTimerMode) {
            storageService.setFullTimerMode(this.#pendingFullTimerMode);
            this.#settings.fullTimerMode = this.#pendingFullTimerMode;
            changed = true;
        }
        this.#pendingSelectedTime = null;
        this.#pendingFullTimerMode = null;
        return changed;
    }

    #cancelPendingSettings() {
        if (this.#pendingSelectedTime !== null) {
            if (this.#elements.timeSlider) {
                this.#elements.timeSlider.value = this.#settings.selectedTime;
            }
            if (this.#elements.sliderVal) {
                this.#elements.sliderVal.textContent = this.#settings.selectedTime;
            }
            this.#updateSliderProgress(this.#settings.selectedTime);
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.time, 10) === this.#settings.selectedTime);
            });
        }
        if (this.#pendingFullTimerMode !== null && this.#elements.fullTimerCheckbox) {
            this.#elements.fullTimerCheckbox.checked = this.#settings.fullTimerMode;
        }
        this.#pendingSelectedTime = null;
        this.#pendingFullTimerMode = null;
    }

    #toggleDarkMode(force) {
        const isDark = force !== undefined ? force : !this.#settings.darkMode;
        storageService.setDarkMode(isDark);
        this.#settings.darkMode = isDark;
        if (this.#elements.menuDarkToggle) this.#elements.menuDarkToggle.checked = isDark;
    }

    #updateProfileProgress() {
        const r = this.#quizEngine?.getResults();
        if (!r) {
            // ডিফল্ট মান
            const pctEl = document.getElementById('profileProgressPct');
            const barEl = document.getElementById('profileProgressBar');
            const textEl = document.getElementById('profileProgressText');
            if (pctEl) pctEl.textContent = '0%';
            if (barEl) barEl.style.width = '0%';
            if (textEl) textEl.textContent = `০/০ — ১০০% করা হয়েছে: ${storageService.getTimesHundred()} বার`;
            return;
        }
    
        const total = r.quiz?.length || 0;
        const correct = r.stats?.correct || 0;
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    
        const pctEl = document.getElementById('profileProgressPct');
        const barEl = document.getElementById('profileProgressBar');
        const textEl = document.getElementById('profileProgressText');
    
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (barEl) barEl.style.width = `${pct}%`;
        if (textEl) textEl.textContent = `${correct}/${total} — ১০০% করা হয়েছে: ${storageService.getTimesHundred()} বার`;
    }

    #toggleSideMenu() {
        const sm = document.getElementById('sideMenu');
        if (!sm) return;
        sm.style.left === '0px' ? this.#closeSideMenu() : this.#openSideMenu();
    }

    #openSideMenu() {
        const sm = document.getElementById('sideMenu');
        if (!sm) return;
        sm.style.left = '0px'; sm.classList.add('open'); sm.setAttribute('aria-hidden', 'false');
        const icon = document.getElementById('menuToggle')?.querySelector('.hamburger-icon');
        if (icon) icon.classList.add('menu-open');
        const pb = document.getElementById('profileBox');
        if (pb?.style.right === '0px') this.#closeProfileBox();
    }

    #closeSideMenu() {
        const sm = document.getElementById('sideMenu');
        if (!sm) return;
        sm.style.left = '-360px'; sm.classList.remove('open'); sm.setAttribute('aria-hidden', 'true');
        const icon = document.getElementById('menuToggle')?.querySelector('.hamburger-icon');
        if (icon) icon.classList.remove('menu-open');
        this.#handlePendingTimerChanges();
    }

    #handlePendingTimerChanges() {
        const hasPendingTime = this.#pendingSelectedTime !== null && 
                           this.#pendingSelectedTime !== this.#settings.selectedTime;
        const hasPendingFullMode = this.#pendingFullTimerMode !== null && 
                               this.#pendingFullTimerMode !== this.#settings.fullTimerMode;
        const isQuizRunning = this.#isQuizActive && this.#quizEngine !== null;
        if ((!hasPendingTime && !hasPendingFullMode) || !isQuizRunning) {
            return;
        }
        this.#showTimerChangeConfirmation(
            hasPendingTime ? this.#pendingSelectedTime : this.#settings.selectedTime,
            hasPendingFullMode ? this.#pendingFullTimerMode : this.#settings.fullTimerMode,
            hasPendingTime,
            hasPendingFullMode
        );
    }

    #showTimerChangeConfirmation(newTime, newFullMode, timeChanged, modeChanged) {
        const overlay = document.getElementById('confirmOverlay');
        if (!overlay) {
            this.#applyPendingSettings();
            return;
        }

        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (title) title.textContent = '⏱️ টাইমার পরিবর্তন';
    
        let msg = 'টাইমার পরিবর্তন করা হয়েছে। ';
        const changes = [];
        if (timeChanged) changes.push(`প্রতি প্রশ্নের সময়: ${newTime} সেকেন্ড`);
        if (modeChanged) changes.push(`ফুল টাইমার মোড: ${newFullMode ? 'চালু' : 'বন্ধ'}`);
        msg += changes.join(', ');
        msg += '\n\nআপনার কুইজটি পুনরায় চালু হবে।';
    
        if (message) message.textContent = msg;

        const cancelHandler = () => {
            overlay.style.display = 'none';
            this.#cancelPendingSettings();
            this.#applyDarkMode();
        };

        const okHandler = () => {
            overlay.style.display = 'none';
            this.#applyPendingSettings();
            if (this.#isQuizActive && this.#quizEngine) {
                const currentFilters = this.#getCurrentFilters();
                this.#cleanupQuiz();
                this.#startQuizWithFilters(currentFilters);
            }
        };

        const newOk = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);
        newOk.addEventListener('click', okHandler);

        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        newCancel.addEventListener('click', cancelHandler);

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    #showConfirm(message, onConfirm, onCancel) {
        const o = this.#elements.confirmOverlay;
        if (!o) { console.warn('Confirm overlay not found'); if (onConfirm) onConfirm(); return; }
        if (this.#elements.confirmTitle) this.#elements.confirmTitle.textContent = 'নিশ্চিতকরণ';
        if (this.#elements.confirmMessage) this.#elements.confirmMessage.textContent = message;
        o.style.display = 'flex';
        const ok = this.#elements.confirmOk;
        if (ok) {
            const n = ok.cloneNode(true);
            ok.parentNode.replaceChild(n, ok);
            this.#elements.confirmOk = n;
            n.onclick = () => { o.style.display = 'none'; if (onConfirm) onConfirm(); };
        }
        const cancel = this.#elements.confirmCancel;
        if (cancel) {
            const n = cancel.cloneNode(true);
            cancel.parentNode.replaceChild(n, cancel);
            this.#elements.confirmCancel = n;
            n.onclick = () => { o.style.display = 'none'; if (onCancel) onCancel(); };
        }
    }

    #showExplanationModal(title, content) {
        const o = document.getElementById('confirmOverlay');
        const t = document.getElementById('confirmTitle');
        const m = document.getElementById('confirmMessage');
        const ok = document.getElementById('confirmOk');
        const c = document.getElementById('confirmCancel');
        if (!o || !t || !m) { alert(content); return; }
        t.textContent = title || 'ব্যাখ্যা';
        m.innerHTML = content;
        if (c) c.style.display = 'none';
        const close = () => { o.style.display = 'none'; document.body.style.overflow = ''; document.body.removeEventListener('touchmove', this._preventScroll); if (c) c.style.display = 'inline-block'; };
        const n = ok.cloneNode(true);
        ok.parentNode.replaceChild(n, ok);
        n.onclick = close;
        o.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.addEventListener('touchmove', this._preventScroll, { passive: false });
    }

    _preventScroll(e) { e.preventDefault(); }

    #showToast(message, type = 'info') {
        if (this.#toast) this.#toast.show(message, type);
        else alert(message);
    }

    #handleKeyboard(e) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        switch (e.key.toLowerCase()) {
            case 's': if (!this.#elements.skipBtn?.disabled) this.#elements.skipBtn?.click(); break;
            case 'n': case 'enter': if (this.#elements.nextBtn?.style.display !== 'none') this.#elements.nextBtn?.click(); break;
            case 'q': this.#elements.quitBtn?.click(); break;
            case 'r': this.#elements.restartBtn?.click(); break;
        }
    }

    #handleOutsideClick(e) {
        const sm = document.getElementById('sideMenu');
        const hb = document.getElementById('menuToggle');
        if (sm?.style.left === '0px' && !sm.contains(e.target) && !hb?.contains(e.target)) this.#closeSideMenu();
        const pb = document.getElementById('profileBox');
        const ab = document.getElementById('userAvatar');
        if (pb?.style.right === '0px' && !pb.contains(e.target) && !ab?.contains(e.target)) this.#closeProfileBox();
    }
}

class Toast {
    constructor() {
        this.container = document.querySelector('.toast-container') || (() => {
            const c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
            return c;
        })();
        this.enabled = storageService.getToastEnabled() !== false;
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    show(msg, type = 'info', duration = 3000) {
        if (!this.enabled) return;
        
        const t = document.createElement('div');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        t.className = `toast toast-${type}`;
        t.innerHTML = `<div class="toast-icon">${icons[type] || 'ℹ️'}</div>
                      <div class="toast-content">${msg}</div>
                      <button class="toast-close">✕</button>
                      <div class="toast-progress"></div>`;
        this.container.appendChild(t);
        
        t.querySelector('.toast-close').addEventListener('click', () => this.#remove(t));
        
        const to = setTimeout(() => this.#remove(t), duration);
        
        t.addEventListener('mouseenter', () => clearTimeout(to));
        t.addEventListener('mouseleave', () => {
            setTimeout(() => this.#remove(t), 500);
        });
    }
    
    #remove(t) {
        t.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (t.parentNode) t.remove();
        }, 300);
    }
}