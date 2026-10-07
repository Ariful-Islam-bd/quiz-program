// frontend/js/app.js
// Version: 3.3.0 - প্রোফাইল পেজ সংযোজন ও নেভিগেশন ফিক্স

import { WelcomePage } from './pages/welcome.js';
import { QuizPage } from './pages/quiz.js';
import { AcademiaPage } from './pages/academia.js';
import { ProfilePage } from './pages/profile.js';
import { AuthPage } from './pages/auth.js';
import { storageService } from './services/StorageService.js';
import { authService } from './services/AuthService.js';
import { AuthGuard } from './middleware/auth-guard.js';
import { sessionManager } from './utils/session.js';
import { initializeConstants } from './utils/constants.js';

class App {
    constructor() {
        // ✅ নেভিগেশন অবজেক্ট
        const nav = {
            currentPage: 'welcome',
            pages: {
                welcome: document.getElementById('welcomePage'),
                quiz: document.getElementById('quizFilter'),
                academia: document.getElementById('academiaPage'),
                profile: document.getElementById('profilePageWrapper')  // ← কমা ঠিক আছে
            },
            
            navigateTo: (page) => {
                console.log(`🔀 Navigating to: ${page}`);
                
                // ✅ ১. quiz থেকে বের হওয়ার সময় cleanup
                if (nav.currentPage === 'quiz' && page !== 'quiz' && window.app?.quizPage) {
                    console.log('🧹 Hiding quiz before navigation');
                    try {
                        if (typeof window.app.quizPage.hidePage === 'function') {
                            window.app.quizPage.hidePage();
                        }
                        window.app.quizPage.cleanupQuiz?.();
                    } catch (err) {
                        console.warn('Quiz hide/cleanup error (non-fatal):', err);
                    }
                }
                
                // ✅ Auth Guard চেক
                if (!AuthGuard.check(page, nav)) {
                    return;
                }
                
                const pages = nav.pages;
                
                // ✅ ২. সব পেজ hide
                Object.keys(pages).forEach(key => {
                    const p = pages[key];
                    if (p) {
                        p.style.display = 'none';
                        p.classList.remove('active');
                    }
                });
                
                // ✅ ৩. quizPage-এর ভিতরের সব element hide
                const quizElements = [
                    'quiz-container',
                    'quizResult',
                    'quizReview',
                    'thanksGiving'
                ];
                quizElements.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                });
                
                // ✅ ৪. quiz controls hide
                const controls = document.querySelector('.controls');
                if (controls) controls.style.display = 'none';
                
                // ✅ ৫. টার্গেট পেজ দেখান
                const target = pages[page];
                if (!target) {
                    console.error(`❌ Page not found: ${page}`);
                    return;
                }
                
                // ✅ quiz পেজের জন্য 'flex', অন্য সবার জন্য 'block'
                target.style.display = (page === 'quiz') ? 'flex' : 'block';
                target.classList.add('active');
                nav.currentPage = page;
                console.log(`✅ Page shown: ${page}`);
                
                // ✅ ৬. ✅ ✅ ✅ MAIN HEADER CONTROL (শুধু এই একটাই লাইন!)
                if (window.app) {
                    window.app.controlHeader(page);
                }
                
                // ✅ ৭. auth UI update
                window.app._updateAuthUI();
                
                // ✅ ৮. পেজভিত্তিক show মেথড
                switch (page) {
                    case 'welcome':
                        window.app?.welcomePage?.show?.();
                        break;
                    case 'academia':
                        window.app?.academiaPage?.show?.();
                        break;
                    case 'profile':
                        window.app?.profilePage?.show?.();
                        break;
                    case 'quiz':
                        if (typeof window.app?.quizPage?.showPage === 'function') {
                            window.app.quizPage.showPage();
                        }
                        break;
                    default:
                        console.warn(`⚠️ No show handler for page: ${page}`);
                }
            },
            
            goBack: () => {
                console.log('🔙 Going back to welcome');
                nav.navigateTo('welcome');
            }
        };
        
        this.navigation = nav;
        window.app = this;
        
        // ✅ পেজ ইনিশিয়ালাইজ
        this.welcomePage = new WelcomePage(this.navigation);
        this.quizPage = new QuizPage(this.navigation);
        this.academiaPage = new AcademiaPage(this.navigation);
        this.profilePage = new ProfilePage(this.navigation);
        this.authPage = new AuthPage(this.navigation);
        
        // ✅ ডিফল্ট পেজ
        this.navigation.navigateTo('welcome');
        this.setupGlobalEvents();
        this.applyDarkMode();
        
        // ✅ সেশন মনিটরিং শুরু
        if (authService.isAuthenticated()) {
            sessionManager.start();
        }
        
        // ✅ অথেন্টিকেশন ইভেন্ট লিসেন
        let lastAuthState = authService.isAuthenticated();
        document.addEventListener('auth-state-change', () => {
            const currentAuthState = authService.isAuthenticated();
            
            // ✅ শুধু actual state change হলে update করুন
            if (currentAuthState !== lastAuthState) {
                lastAuthState = currentAuthState;
                this._updateAuthUI();
                // ✅ Welcome Page-এর updateUserInfo() এখানে দরকার নেই —
                //    navigateTo() → welcomePage.show() এটাই করবে
            }
        });
        
        console.log('✅ App initialized successfully');
    }
    
    controlHeader(page) {
        const header = document.getElementById('mainHeader');
        if (!header) return;
        
        // ✅ একমাত্র নিয়ম: Welcome, Profile, academia-এ header নেই, বাকি সব পেজে আছে
        //    (কুইজ ফিল্টার, কুইজ, রেজাল্ট, রিভিউ, থ্যাঙ্কস পেজে অবশ্যই থাকবে)
        const pagesWithoutHeader = ['welcome', 'profile', 'academia'];
        
        if (pagesWithoutHeader.includes(page)) {
            // header নেই
            header.classList.add('hidden');
            header.classList.remove('visible');
            header.style.display = 'none';
            console.log(`🚫 Main header hidden (${page} page)`);
        } else {
            // header আছে (quiz filter, quiz, result, review, thanks)
            header.classList.remove('hidden');
            header.classList.add('visible');
            header.style.display = 'flex';
            console.log(`✅ Main header shown (${page} page)`);
        }
    }

    setupGlobalEvents() {
        // ===== মেনু টগল =====
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = document.getElementById('sideMenu');
                const icon = document.querySelector('#menuToggle .hamburger-icon');
                if (menu) {
                    if (menu.style.left === '0px') {
                        menu.style.left = '-360px';
                        menu.classList.remove('open');
                        menu.setAttribute('aria-hidden', 'true');
                        if (icon) icon.classList.remove('menu-open');
                    } else {
                        menu.style.left = '0px';
                        menu.classList.add('open');
                        menu.setAttribute('aria-hidden', 'false');
                        if (icon) icon.classList.add('menu-open');
                        const pb = document.getElementById('profileBox');
                        if (pb?.style.right === '0px') {
                            pb.style.right = '-320px';
                            pb.classList.remove('visible');
                            pb.style.display = 'none';
                            pb.style.visibility = 'hidden';
                            pb.style.opacity = '0';
                            pb.setAttribute('aria-hidden', 'true');
                            const ab = document.getElementById('userAvatar');
                            if (ab) { ab.style.borderColor = ''; ab.style.boxShadow = ''; }
                        }
                    }
                }
            });
        }

        // ===== মেনু ক্লোজ =====
        document.getElementById('menuClose')?.addEventListener('click', () => {
            const menu = document.getElementById('sideMenu');
            const icon = document.querySelector('#menuToggle .hamburger-icon');
            if (menu) {
                menu.style.left = '-360px';
                menu.classList.remove('open');
                menu.setAttribute('aria-hidden', 'true');
                if (icon) icon.classList.remove('menu-open');
            }
        });

        // ===== হোম বাটন =====
        document.getElementById('menuHome')?.addEventListener('click', () => {
            const menu = document.getElementById('sideMenu');
            if (menu) {
                menu.style.left = '-360px';
                menu.classList.remove('open');
                menu.setAttribute('aria-hidden', 'true');
                const icon = document.querySelector('#menuToggle .hamburger-icon');
                if (icon) icon.classList.remove('menu-open');
            }
            const pb = document.getElementById('profileBox');
            if (pb?.classList.contains('visible')) {
                pb.style.right = '-320px';
                pb.classList.remove('visible');
                pb.style.display = 'none';
                pb.style.visibility = 'hidden';
                pb.style.opacity = '0';
                pb.setAttribute('aria-hidden', 'true');
                const ab = document.getElementById('userAvatar');
                if (ab) { ab.style.borderColor = ''; ab.style.boxShadow = ''; }
            }
            if (this.quizPage?.goToHome) this.quizPage.goToHome();
            else if (this.quizPage?.cleanupQuiz) this.quizPage.cleanupQuiz();
            this.navigation.navigateTo('welcome');
        });

        // ===== ডার্ক মোড টগল =====
        const darkToggle = document.getElementById('menuDarkToggle');
        if (darkToggle) {
            darkToggle.checked = document.body.classList.contains('dark');
            darkToggle.addEventListener('change', function(e) {
                e.stopPropagation();
                const checked = this.checked;
                document.body.classList.toggle('dark', checked);
                storageService.setDarkMode(checked);
            });
        }

        document.getElementById('darkToggleFloat')?.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            storageService.setDarkMode(isDark);
            const dt = document.getElementById('menuDarkToggle');
            if (dt) dt.checked = isDark;
        });

        // ===== সেটিংস =====
        document.getElementById('menuSettings')?.addEventListener('click', () => {
            const block = document.getElementById('settingsBlock');
            if (block) block.style.display = block.style.display === 'block' ? 'none' : 'block';
        });

        // ===== অ্যাভাটার বাটন =====
        const avatarBtn = document.getElementById('userAvatar');
        if (avatarBtn) {
            // পুরনো ইভেন্ট রিমুভ করুন
            const newAvatarBtn = avatarBtn.cloneNode(true);
            avatarBtn.parentNode.replaceChild(newAvatarBtn, avatarBtn);
    
            newAvatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
        
                // ✅ সবসময় প্রোফাইল বক্স টগল করুন (কুইজ পেজে)
                const box = document.getElementById('profileBox');
                if (box) {
                    if (box.style.right === '0px') {
                        box.style.right = '-320px';
                        box.classList.remove('visible');
                        box.style.display = 'none';
                        box.style.visibility = 'hidden';
                        box.style.opacity = '0';
                        box.setAttribute('aria-hidden', 'true');
                        newAvatarBtn.style.borderColor = '';
                        newAvatarBtn.style.boxShadow = '';
                    } else {
                        box.style.right = '0px';
                        box.style.display = 'block';
                        box.style.visibility = 'visible';
                        box.style.opacity = '1';
                        box.classList.add('visible');
                        box.setAttribute('aria-hidden', 'false');
                        newAvatarBtn.style.borderColor = 'var(--accent)';
                        newAvatarBtn.style.boxShadow = '0 0 0 2px var(--accent)';
                
                        // সাইড মেনু বন্ধ করুন
                        const menu = document.getElementById('sideMenu');
                        if (menu?.style.left === '0px') {
                            menu.style.left = '-360px';
                            menu.classList.remove('open');
                            menu.setAttribute('aria-hidden', 'true');
                            const icon = document.querySelector('#menuToggle .hamburger-icon');
                            if (icon) icon.classList.remove('menu-open');
                        }
                    }
                }
            });
        }

        // ===== প্রোফাইল ক্লোজ =====
        document.getElementById('profileCloseBtn')?.addEventListener('click', () => {
            const box = document.getElementById('profileBox');
            const ab = document.getElementById('userAvatar');
            if (box) {
                box.style.right = '-320px';
                box.classList.remove('visible');
                box.style.display = 'none';
                box.style.visibility = 'hidden';
                box.style.opacity = '0';
                box.setAttribute('aria-hidden', 'true');
                if (ab) { ab.style.borderColor = ''; ab.style.boxShadow = ''; }
            }
        });

        // ===== কিবোর্ড শর্টকাট =====
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // ১. সাইড মেনু বন্ধ করুন
                const menu = document.getElementById('sideMenu');
                if (menu?.style.left === '0px') {
                    menu.style.left = '-360px';
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden', 'true');
                    const icon = document.querySelector('#menuToggle .hamburger-icon');
                    if (icon) icon.classList.remove('menu-open');
                }
        
                // ২. প্রোফাইল বক্স বন্ধ করুন
                const pb = document.getElementById('profileBox');
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
        
                // ৩. মডাল বন্ধ করুন (যদি খোলা থাকে)
                const cropModal = document.getElementById('cropModal');
                if (cropModal?.style.display === 'flex') {
                    cropModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
        
                const confirmOverlay = document.getElementById('confirmOverlay');
                if (confirmOverlay?.style.display === 'flex') {
                    confirmOverlay.style.display = 'none';
                    document.body.style.overflow = '';
                }
        
                // ৪. ✅ কোনো পেজ নেভিগেশন করবেন না
                // শুধু UI এলিমেন্ট বন্ধ করবেন
        
                // ৫. event propagation বন্ধ করুন
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // ===== বাইরে ক্লিক =====
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('sideMenu');
            const hb = document.getElementById('menuToggle');
            if (menu?.style.left === '0px') {
                if (!menu.contains(e.target) && !hb?.contains(e.target)) {
                    menu.style.left = '-360px';
                    menu.classList.remove('open');
                    menu.setAttribute('aria-hidden', 'true');
                    const icon = document.querySelector('#menuToggle .hamburger-icon');
                    if (icon) icon.classList.remove('menu-open');
                }
            }
            const pb = document.getElementById('profileBox');
            const ab = document.getElementById('userAvatar');
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

        // ===== ✅ হোম বাটন (ফ্লোটিং) =====
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (this.quizPage?.cleanupQuiz) {
                    this.quizPage.cleanupQuiz();
                }
                this.navigation.navigateTo('welcome');
            });
        }

        // ✅ অথেন্টিকেশন মেনু আইটেম
        const menuAuth = document.getElementById('menuAuth');
        if (menuAuth) {
            menuAuth.addEventListener('click', () => {
                const action = menuAuth.dataset.action;
                if (action === 'logout') {
                    // ✅ লগআউট কনফার্ম
                    if (confirm('আপনি কি লগআউট করতে চান?')) {
                        authService.logout();
                        sessionManager.stop();
                        this._updateAuthUI();
                        this.navigation.navigateTo('welcome');
                        if (this.showToast) {
                            this.showToast('👋 লগআউট করা হয়েছে', 'info');
                        }
                    }
                } else {
                    // ✅ লগইন পেজ দেখান
                    this.authPage.show('login');
                }
            });
        }
        
        // ✅ অথেন্টিকেশন স্টেট আপডেট
        this._updateAuthUI();        
    }

    _updateAuthUI() {
        const isAuth = authService.isAuthenticated();
        const user = authService.getCurrentUser();
        const menuAuth = document.getElementById('menuAuth');
        const authLabel = document.getElementById('authMenuLabel');
        const authIcon = document.getElementById('authMenuIcon');
        
        if (menuAuth && authLabel && authIcon) {
            if (isAuth) {
                authLabel.textContent = `👤 ${user?.name || 'ইউজার'} (লগআউট)`;
                authIcon.textContent = '🚪';
                menuAuth.dataset.action = 'logout';
            } else {
                authLabel.textContent = '🔐 লগইন করুন';
                authIcon.textContent = '🔐';
                menuAuth.dataset.action = 'login';
            }
        }
        
        /* ✅ Welcome Page আপডেট
        if (this.welcomePage) {
            this.welcomePage.updateUserInfo();
        }  */
        
        // ✅ প্রোফাইল বক্স আপডেট
        this._updateProfileBox();
    }

    _updateProfileBox() {
        const user = authService.getCurrentUser();
        const nameDisplay = document.getElementById('profileBoxNameDisplay');
        const emailDisplay = document.getElementById('profileBoxEmailDisplay');
        const orgDisplay = document.getElementById('profileBoxOrgDisplay');
        
        if (nameDisplay) {
            nameDisplay.textContent = user?.name || 'অতিথি';
        }
        if (emailDisplay) {
            emailDisplay.textContent = user?.email || '—';
        }
        if (orgDisplay) {
            orgDisplay.textContent = user?.org || 'প্রতিষ্ঠান';
        }
    }

    applyDarkMode() {
        if (storageService.getSettings().darkMode) {
            document.body.classList.add('dark');
            const dt = document.getElementById('menuDarkToggle');
            if (dt) dt.checked = true;
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) { alert(message); return; }
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
}

/*/ ✅ DOM লোড হলে অ্যাপ শুরু করুন
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); */


// ✅ Ensure runtime config is loaded BEFORE app starts
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Loading runtime config...');

    try {
        // ✅ Wait for config.json to load
        await initializeConstants();
        console.log('✅ Runtime config ready, starting app...');

        // ✅ Now safe to initialize app
        window.app = new App();
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        alert('Configuration load failed. Please refresh the page.');
    }
});