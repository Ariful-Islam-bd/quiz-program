// frontend/js/pages/welcome.js
// Version: 5.0.0 - 

import { storageService } from '../services/StorageService.js';
import { authService } from '../services/AuthService.js';
import { getAvatarColor } from '../utils/AvatarColor.js';

export class WelcomePage {
    #lastRenderedUser = null;

    constructor(navigation) {
        this.navigation = navigation;
        this.container = document.getElementById('welcomePage');
        this.elements = {};
        this._clickHandlers = [];
        this._isInitialized = false;
        this.init();
    }

    init() {
        this.cacheElements();
        this.loadStats();
        this.setupEventListeners();
        this.updateUserInfo();
        this._isInitialized = true;
        console.log('✅ WelcomePage initialized');
    }

    updateUserInfo() {
        try {
            const isAuthenticated = authService.isAuthenticated();

            if (!isAuthenticated) {
                const guestKey = 'guest';
                if (this.#lastRenderedUser !== guestKey) {
                    console.log('👤 User not authenticated, showing guest mode');
                    this.#showGuestMode();
                    this.#lastRenderedUser = guestKey;
                }
                return;
            }

            const user = authService.getCurrentUser();
            const profile = storageService.getProfile();
            const avatar = storageService.getAvatar() || 'noavatar';
            const currentKey = `${user?._id || user?.id || 'user'}|${profile.name || user?.name || ''}|${profile.org || ''}|${avatar}`;

            // ✅ একই state — skip
            if (this.#lastRenderedUser === currentKey) {
                return;
            }

            console.log('👤 User authenticated, showing profile');
            this.#showUserProfile();
            this.#lastRenderedUser = currentKey;

        } catch (error) {
            console.warn('User info update error:', error);
            this.#showGuestMode();
        }
    }

    cacheElements() {
        this.elements = {
            totalQuizzes: document.getElementById('totalQuizzes'),
            avgScore: document.getElementById('avgScore'),
            totalQuestions: document.getElementById('totalQuestions'),
            cards: document.querySelectorAll('.welcome-card'),
            userName: document.getElementById('welcomeUserName'),
            userOrg: document.getElementById('welcomeUserOrg'),
            userAvatar: document.getElementById('welcomeUserAvatar'),
            avatarInitials: document.getElementById('welcomeAvatarInitials'),
            avatarWrapper: document.getElementById('welcomeAvatarWrapper')
        };
    }

    setupEventListeners() {
        // পুরানো হ্যান্ডলার রিমুভ
        if (this._clickHandlers.length > 0) {
            this._clickHandlers.forEach(({ card, handler }) => {
                try {
                    card.removeEventListener('click', handler);
                } catch (e) {
                    // সাইলেন্ট ফেইল
                }
            });
            this._clickHandlers = [];
        }
        
        // প্রতিটি কার্ডের জন্য নতুন ইভেন্ট লিসেনার
        this.elements.cards.forEach((card) => {
            const page = card.dataset.page;
            
            if (!page) {
                console.warn('⚠️ Card has no data-page attribute:', card);
                return;
            }
            
            const cardHandler = (e) => {
                if (e.target.closest('.btn')) {
                    e.stopPropagation();
                }
                console.log(`🖱️ Card clicked: ${page}`);
                this.handleCardClick(page);
            };
            
            card.addEventListener('click', cardHandler);
            this._clickHandlers.push({ card, handler: cardHandler });
        });
    }

    handleCardClick(page) {
        if (!this.navigation) {
            if (window.app?.navigation) {
                window.app.navigation.navigateTo(page);
                return;
            }
            return;
        }
        
        switch(page) {
            case 'academia':
                this.navigation.navigateTo('academia');
                break;
            case 'quiz':
                this.navigation.navigateTo('quiz');
                break;
            case 'profile':
                this.navigation.navigateTo('profile');
                break;
            default:
                console.warn('⚠️ Unknown page:', page);
                this.navigation.navigateTo('welcome');
        }
    }

    loadStats() {
        try {
            const leaderboard = storageService.getLeaderboard(20);
            const totalQuizzes = leaderboard.length;
            let totalScore = 0;
            leaderboard.forEach(entry => totalScore += entry.score || 0);
            const avgScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuizzes) * 100) / 100 : 0;
            
            if (this.elements.totalQuizzes) {
                this.elements.totalQuizzes.textContent = totalQuizzes;
            }
            if (this.elements.avgScore) {
                this.elements.avgScore.textContent = `${avgScore}%`;
            }
            if (this.elements.totalQuestions) {
                this.elements.totalQuestions.textContent = totalQuizzes * 10 || 0;
            }
        } catch (error) {
            console.warn('Stats loading error:', error);
        }
    }

    updateUserInfo() {
        try {
            // ✅ অথেন্টিকেশন স্টেট চেক
            const isAuthenticated = authService.isAuthenticated();
            
            if (!isAuthenticated) {
                // ❌ লগআউট বা অথেন্টিকেটেড নয় → "অতিথি" দেখান
                console.log('👤 User not authenticated, showing guest mode');
                this.#showGuestMode();
                return;
            }
            
            // ✅ লগইন করা ইউজার → প্রোফাইল দেখান
            console.log('👤 User authenticated, showing profile');
            this.#showUserProfile();
            
        } catch (error) {
            console.warn('User info update error:', error);
            this.#showGuestMode();
        }
    }

    #showGuestMode() {
        // নাম সেট
        if (this.elements.userName) {
            this.elements.userName.textContent = 'অতিথি';
        }
        
        // প্রতিষ্ঠান সেট
        if (this.elements.userOrg) {
            this.elements.userOrg.textContent = 'আপনার শিক্ষা যাত্রাকে আরও মজাদার করুন';
        }
        
        // ডিফল্ট অ্যাভাটার দেখান
        this.#showDefaultAvatar();
    }

    // ✅ ইউজার প্রোফাইল দেখানো
    #showUserProfile() {
        const profile = storageService.getProfile();
        const name = profile.name || 'অতিথি';
        const org = profile.org || 'আপনার শিক্ষা যাত্রাকে আরও মজাদার করুন';
        
        // ✅ DOM-এ আগের মানের সাথে তুলনা করুন
        const currentName = this.elements.userName?.textContent || '';
        const currentOrg = this.elements.userOrg?.textContent || '';
        
        if (currentName === name && currentOrg === org) {
            // ✅ ইতোমধ্যে একই মান — DOM update skip
            return;
        }
        
        if (this.elements.userName) {
            this.elements.userName.textContent = name;
        }
        if (this.elements.userOrg) {
            this.elements.userOrg.textContent = org;
        }
        
        this.#loadUserAvatar(name);
    }

    // ✅ ডিফল্ট অ্যাভাটার দেখানো
    #showDefaultAvatar() {
        const wrapper = this.elements.avatarWrapper;
        const img = this.elements.userAvatar;
        const initials = this.elements.avatarInitials;
        
        // ইমেজ লুকান
        if (img) {
            img.style.display = 'none';
            img.src = '';
        }
        
        // ইনিশিয়াল দেখান
        if (initials) {
            initials.style.display = 'flex';
            initials.textContent = 'A';
            initials.style.background = '#4facfe';
            initials.style.color = '#fff';
            initials.style.alignItems = 'center';
            initials.style.justifyContent = 'center';
            initials.style.width = '100%';
            initials.style.height = '100%';
            initials.style.borderRadius = '50%';
        }
        
        // র‍্যাপার স্টাইল
        if (wrapper) {
            wrapper.style.background = '#4facfe';
            wrapper.style.backgroundColor = '#4facfe';
            wrapper.style.backgroundImage = 'none';
        }
    }

    // ✅ ইউজার অ্যাভাটার লোড
    #loadUserAvatar(name) {
        const avatar = storageService.getAvatar();
        const img = this.elements.userAvatar;
        const initials = this.elements.avatarInitials;
        const wrapper = this.elements.avatarWrapper;
        
        if (avatar) {
            // অ্যাভাটার ইমেজ দেখান
            if (img) {
                img.src = avatar;
                img.style.display = 'block';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
            }
            if (initials) {
                initials.style.display = 'none';
            }
            if (wrapper) {
                wrapper.style.background = 'none';
                wrapper.style.backgroundColor = 'transparent';
                wrapper.style.backgroundImage = 'none';
            }
        } else {
            // ডিফল্ট ইনিশিয়াল দেখান
            if (img) {
                img.style.display = 'none';
            }
            if (initials) {
                const initialChars = name
                    .split(' ')
                    .map(word => word[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'A';
                
                initials.style.display = 'flex';
                initials.textContent = initialChars;
                initials.style.alignItems = 'center';
                initials.style.justifyContent = 'center';
                initials.style.width = '100%';
                initials.style.height = '100%';
                initials.style.borderRadius = '50%';
                
                const color = getAvatarColor(name);
                initials.style.background = color;
                initials.style.color = '#fff';
            }
            if (wrapper) {
                const color = getAvatarColor(name);
                wrapper.style.background = color;
                wrapper.style.backgroundColor = color;
                wrapper.style.backgroundImage = 'none';
            }
        }
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.container.classList.add('active');
            
            // ✅ ডেটা রিফ্রেশ
            this.updateUserInfo();
            this.loadStats();
        }
        
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.add('hidden');
            header.classList.remove('visible');
        }
        
        const quizTopbar = document.getElementById('quizTopbar');
        if (quizTopbar) {
            quizTopbar.style.display = 'none';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.container.classList.remove('active');
        }
    }
}