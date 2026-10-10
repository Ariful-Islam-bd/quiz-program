// frontend/js/pages/academia.js
// Version: 3.0.0 - API-based content loading
// Changes: Static file fetch → Backend API calls
//          Added: Loading skeleton, error states, URL routing

import { contentService } from '../services/ContentService.js';

// ============================================================
// ✅ Static taxonomy (navigation structure)
// ============================================================
const CLASS_DATA = [
    { id: 'class-7', name: '৭ম শ্রেণি', icon: '📘', subjects: ['গণিত', 'বাংলা', 'ইংরেজি', 'বিজ্ঞান'] },
    { id: 'class-8', name: '৮ম শ্রেণি', icon: '📗', subjects: ['গণিত', 'বাংলা', 'ইংরেজি', 'বিজ্ঞান'] },
    { id: 'class-9-10', name: '৯ম - ১০ম শ্রেণি', icon: '📕', subjects: ['গণিত', 'বাংলা', 'ইংরেজি', 'বিজ্ঞান', 'সাধারণ গণিত'] },
    { id: 'class-11-12', name: 'উচ্চমাধ্যমিক (HSC)', icon: '📙', subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'ICT', 'যুক্তিবিদ্যা'] },
    { id: 'ssc-2027', name: 'SSC 2027', icon: '🎯', subjects: ['গণিত', 'বাংলা', 'ইংরেজি', 'সাধারণ বিজ্ঞান'] },
    { id: 'hsc-2027', name: 'HSC 2027', icon: '🏆', subjects: ['উচ্চতর গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন'] }
];

const SUBJECT_DATA = {
    'class-7': [
        { id: 'math-7', name: 'গণিত', icon: '📐', chapters: 12 },
        { id: 'bangla-7', name: 'বাংলা', icon: '📖', chapters: 8 },
        { id: 'english-7', name: 'ইংরেজি', icon: '🔤', chapters: 10 },
        { id: 'science-7', name: 'বিজ্ঞান', icon: '🔬', chapters: 6 }
    ],
    'class-9-10': [
        { id: 'gmath-9', name: 'সাধারণ গণিত', icon: '📐', chapters: 14 },
        { id: 'bangla-2-9', name: 'বাংলা ২য় পত্র', icon: '📖', chapters: 12 },
        { id: 'english-2-9', name: 'English 2nd Paper', icon: '🔤', chapters: 10 }
    ],
    'class-11-12': [
        { id: 'hmath-11', name: 'উচ্চতর গণিত', icon: '📐', chapters: 10 },
        { id: 'ict-11', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', chapters: 8 },
        { id: 'logic-11', name: 'যুক্তিবিদ্যা', icon: '🧠', chapters: 6 },
        { id: 'physics-11', name: 'পদার্থবিজ্ঞান', icon: '⚛️', chapters: 12 },
        { id: 'chemistry-11', name: 'রসায়ন', icon: '🧪', chapters: 10 },
        { id: 'biology-11', name: 'জীববিজ্ঞান', icon: '🧬', chapters: 8 }
    ]
};

// ✅ Chapter/topic structure with topicId matching backend
const CHAPTER_DATA = {
    'hmath-11': [
        {
            id: 'ch-3A',
            number: 3,
            name: 'জটিল সংখ্যা (অনুশীলনী ৩A)',
            icon: '📊',
            topics: [
                { id: 'HSC-Math-3A-All-Q', name: 'সকল প্রশ্ন', icon: '📝', type: 'note' },
                { id: 'HSC-Math-3A-Q01-Q02', name: 'প্রশ্ন ১-২ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q03-Q05', name: 'প্রশ্ন ৩-৫ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q06-Q08', name: 'প্রশ্ন ৬-৮ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q09', name: 'প্রশ্ন ৯ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q10', name: 'প্রশ্ন ১০ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q11', name: 'প্রশ্ন ১১ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3A-Q12-Q15', name: 'প্রশ্ন ১২-১৫ সমাধান', icon: '✅', type: 'note' }
            ]
        },
        {
            id: 'ch-3B',
            number: 3,
            name: 'জটিল সংখ্যা (অনুশীলনী ৩B)',
            icon: '📊',
            topics: [
                { id: 'HSC-Math-3B-All-Q', name: 'সকল প্রশ্ন', icon: '📝', type: 'note' },
                { id: 'HSC-Math-3B-Q01-Q02', name: 'প্রশ্ন ১-২ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3B-Q03-Q04', name: 'প্রশ্ন ৩-৪ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3B-Q05-Q09', name: 'প্রশ্ন ৫-৯ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3B-Q10-Q11', name: 'প্রশ্ন ১০-১১ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3B-Q12', name: 'প্রশ্ন ১২ সমাধান', icon: '✅', type: 'note' },
                { id: 'HSC-Math-3B-Q13-Q17', name: 'প্রশ্ন ১৩-১৭ সমাধান', icon: '✅', type: 'note' }
            ]
        }
    ],
    'ict-11': [
        { id: 'ict-ch1', number: 1, name: 'বিশ্ব ও বাংলাদেশ প্রেক্ষিত', icon: '🌍', topics: [{ id: 'ict-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] },
        { id: 'ict-ch3', number: 3, name: 'সংখ্যা পদ্ধতি', icon: '🔢', topics: [{ id: 'ict-ch3-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] }
    ],
    'logic-11': [
        { id: 'logic-ch1', number: 1, name: 'যৌক্তিক সংজ্ঞা', icon: '🧠', topics: [{ id: 'logic-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] }
    ]
};

// ============================================================
// ✅ Main Page Class
// ============================================================
export class AcademiaPage {
    constructor(navigation) {
        this.navigation = navigation;
        this.currentClass = null;
        this.currentSubject = null;
        this.history = [];
        this.container = null;

        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', () => this.init())
            : this.init();
    }

    init() {
        let container = document.getElementById('academiaContent') || document.querySelector('#academiaContent');
        if (!container) {
            const pageContainer = document.getElementById('academiaPage');
            if (pageContainer) {
                container = document.createElement('div');
                container.id = 'academiaContent';
                pageContainer.appendChild(container);
            } else {
                console.error('❌ academiaPage not found!');
                return;
            }
        }
        this.container = container;
        this.renderClassGrid(container);
        this.setupEventListeners();
    }

    // ============================================================
    // ✅ Render: Class Grid
    // ============================================================
    renderClassGrid(container) {
        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📚 শ্রেণি নির্বাচন করুন</span>
            </div>
            <div class="class-grid">
                ${CLASS_DATA.map(cls => `
                    <div class="class-card" data-class="${cls.id}">
                        <div class="class-icon">${cls.icon}</div>
                        <div class="class-name">${cls.name}</div>
                        <div class="class-subjects">${cls.subjects.join(', ')}</div>
                        <span class="class-badge">${cls.subjects.length}টি বিষয়</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.attachClassEvents(container);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Subjects
    // ============================================================
    renderSubjects(container, classId) {
        const classData = CLASS_DATA.find(c => c.id === classId);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjects = SUBJECT_DATA[classId] || [];
        this.currentClass = classId;

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📖 বিষয়</span>
            </div>
            <div class="subject-grid">
                ${subjects.map(sub => `
                    <div class="subject-card" data-subject="${sub.id}">
                        <div class="subject-icon">${sub.icon}</div>
                        <div class="subject-info">
                            <div class="subject-name">${sub.name}</div>
                            <div class="subject-desc">${sub.chapters}টি অধ্যায়</div>
                        </div>
                        <span class="subject-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.attachSubjectEvents(container);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Chapters + Topics
    // ============================================================
    renderChapters(container, subjectId) {
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === subjectId);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';
        const chapters = CHAPTER_DATA[subjectId] || [];
        this.currentSubject = subjectId;

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📑 অধ্যায়</span>
            </div>
            <div class="chapter-list">
                ${chapters.map(chapter => `
                    <div class="chapter-card">
                        <div class="chapter-header" data-chapter-toggle="${chapter.id}">
                            <div class="chapter-info">
                                <span class="chapter-number">অধ্যায় ${chapter.number}</span>
                                <span class="chapter-name">${chapter.name}</span>
                                <span class="chapter-icon">${chapter.icon || '📄'}</span>
                            </div>
                            <span class="chapter-toggle" data-chapter-toggle="${chapter.id}">▼</span>
                        </div>
                        <div class="chapter-body" data-chapter-body="${chapter.id}">
                            <div class="topic-list">
                                ${chapter.topics.map(topic => `
                                    <div class="topic-card" data-topic="${topic.id}">
                                        <span class="topic-icon">${topic.icon}</span>
                                        <span class="topic-name">${topic.name}</span>
                                        <span class="topic-badge ${topic.type}">${topic.type === 'quiz' ? '🧠 কুইজ' : '📝 নোট'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        this.attachChapterEvents(container);
        this.attachTopicEvents(container);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Content (API-based)
    // ============================================================
    async renderContent(container, topicId) {
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

        let chapterName = 'অধ্যায়', topicName = topicId;
        if (this.currentSubject) {
            const chapters = CHAPTER_DATA[this.currentSubject] || [];
            for (const chapter of chapters) {
                const found = chapter.topics.find(t => t.id === topicId);
                if (found) {
                    chapterName = chapter.name;
                    topicName = found.name;
                    break;
                }
            }
        }

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link chapter-link" data-action="back-to-chapters">📑 ${chapterName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📄 ${topicName}</span>
            </div>
            <div class="content-viewer">
                <div class="content-header">
                    <div class="content-title">
                        <span>📄</span> ${topicName}
                        <span class="topic-badge note" style="font-size:0.7rem;padding:2px 12px;">📝 নোট</span>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-secondary btn-sm" id="reloadContentBtn" title="রিফ্রেশ করুন">🔄 রিফ্রেশ</button>
                    </div>
                </div>
                <div class="content-body" id="contentBody">
                    <!-- Skeleton loader (will be replaced) -->
                    <div class="content-skeleton">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line skeleton-short"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line skeleton-short"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachBreadcrumbEvents(container);

        // ✅ Reload button
        const reloadBtn = container.querySelector('#reloadContentBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                contentService.clearTopicCache(topicId);
                this.loadContentFromAPI(topicId, container);
            });
        }

        // ✅ Load content from API
        await this.loadContentFromAPI(topicId, container);
    }

    // ============================================================
    // ✅ Load content from backend API
    // ============================================================
    async loadContentFromAPI(topicId, container) {
        const contentBody = container.querySelector('#contentBody');
        if (!contentBody) return;

        try {
            console.log(`📥 Fetching content: ${topicId}`);
            const data = await contentService.fetchTopicContent(topicId);

            if (!data || !data.html) {
                throw new Error('কন্টেন্ট খালি এসেছে');
            }

            // ✅ Inject HTML
            contentBody.innerHTML = data.html;

            // ✅ Apply styles_math_sol.css scoping
            contentBody.classList.add('math-content');

            // ✅ Render KaTeX math
            this.renderMath(contentBody);

            // ✅ Smooth scroll
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);

            console.log(`✅ Content loaded: ${topicId} (${data.html.length} chars)`);

        } catch (error) {
            console.error('❌ Content load failed:', error);
            this.renderContentError(contentBody, topicId, error);
        }
    }

    // ============================================================
    // ✅ Error state for content
    // ============================================================
    renderContentError(contentBody, topicId, error) {
        contentBody.innerHTML = `
            <div class="content-error">
                <div class="content-error-icon">❌</div>
                <h3 class="content-error-title">কন্টেন্ট লোড করতে সমস্যা হয়েছে</h3>
                <p class="content-error-message">${error.message || 'অজানা ত্রুটি'}</p>
                <p class="content-error-hint">
                    📁 <code>${topicId}</code>
                </p>
                <div class="content-error-actions">
                    <button class="btn btn-primary" id="retryBtn">🔄 আবার চেষ্টা করুন</button>
                    <button class="btn btn-secondary" id="backBtn">← ফিরে যান</button>
                </div>
            </div>
        `;

        contentBody.querySelector('#retryBtn')?.addEventListener('click', () => {
            contentService.clearTopicCache(topicId);
            this.loadContentFromAPI(topicId, contentBody.closest('.content-viewer').parentElement);
        });

        contentBody.querySelector('#backBtn')?.addEventListener('click', () => {
            const container = contentBody.closest('#academiaContent');
            if (this.currentSubject) {
                this.renderChapters(container, this.currentSubject);
            } else {
                this.renderClassGrid(container);
            }
        });
    }

    // ============================================================
    // ✅ KaTeX rendering
    // ============================================================
    renderMath(container) {
        try {
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            } else {
                this.loadKaTeX(container);
            }
        } catch (error) {
            console.warn('⚠️  KaTeX render error:', error);
        }
    }

    loadKaTeX(container) {
        // CSS
        if (!document.querySelector('link[href*="katex.min.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
        }

        // JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            const renderScript = document.createElement('script');
            renderScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
            renderScript.onload = () => {
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(container, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false }
                        ],
                        throwOnError: false
                    });
                }
            };
            document.head.appendChild(renderScript);
        };
        document.head.appendChild(script);
    }

    // ============================================================
    // ✅ Event attach helpers (unchanged)
    // ============================================================
    attachClassEvents(container) {
        container.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({ type: 'classes' });
                this.renderSubjects(container, card.dataset.class);
            });
        });
    }

    attachSubjectEvents(container) {
        container.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({ type: 'subjects', classId: this.currentClass });
                this.renderChapters(container, card.dataset.subject);
            });
        });
    }

    attachChapterEvents(container) {
        container.querySelectorAll('.chapter-header[data-chapter-toggle]').forEach(header => {
            header.addEventListener('click', () => {
                const id = header.dataset.chapterToggle;
                const body = container.querySelector(`[data-chapter-body="${id}"]`);
                const toggle = container.querySelector(`.chapter-toggle[data-chapter-toggle="${id}"]`);
                if (body) body.classList.toggle('open');
                if (toggle) toggle.classList.toggle('open');
            });
        });
    }

    attachTopicEvents(container) {
        container.querySelectorAll('.topic-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({ type: 'chapters', subjectId: this.currentSubject });
                this.renderContent(container, card.dataset.topic);
            });
        });
    }

    attachBreadcrumbEvents(container) {
        container.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = link.dataset.action;
                switch (action) {
                    case 'go-home':
                        this.navigation.navigateTo('welcome');
                        break;
                    case 'back-to-classes':
                        this.renderClassGrid(container);
                        this.history = [];
                        break;
                    case 'back-to-subjects':
                        if (this.currentClass) this.renderSubjects(container, this.currentClass);
                        break;
                    case 'back-to-chapters':
                        if (this.currentSubject) this.renderChapters(container, this.currentSubject);
                        break;
                    default:
                        console.warn('Unknown breadcrumb action:', action);
                }
            });
        });
    }

    // ============================================================
    // ✅ Keyboard shortcuts (unchanged)
    // ============================================================
    setupEventListeners() {
        this._escapeHandler = (e) => {
            if (e.key !== 'Escape') return;

            const menu = document.getElementById('sideMenu');
            const pb = document.getElementById('profileBox');
            const modals = document.querySelectorAll('.modal-overlay');

            let uiClosed = false;

            if (menu?.style.left === '0px') {
                menu.style.left = '-360px';
                menu.classList.remove('open');
                menu.setAttribute('aria-hidden', 'true');
                const icon = document.querySelector('#menuToggle .hamburger-icon');
                if (icon) icon.classList.remove('menu-open');
                uiClosed = true;
            }

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
                uiClosed = true;
            }

            modals.forEach(modal => {
                if (modal.style.display === 'flex' || modal.style.display === 'block') {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    uiClosed = true;
                }
            });

            if (!uiClosed) {
                console.log('🔑 Escape pressed - no UI to close');
            }

            e.preventDefault();
            e.stopPropagation();
        };

        document.addEventListener('keydown', this._escapeHandler);

        document.addEventListener('keydown', (e) => {
            if ((e.key === 'h' || e.key === 'H') && !e.target.matches('input, textarea, select')) {
                this.navigation.navigateTo('welcome');
            }
        });
    }

    // ============================================================
    // ✅ Lifecycle (unchanged)
    // ============================================================
    goBack() {
        const container = this.container || document.getElementById('academiaContent');
        if (!container || this.history.length === 0) {
            this.navigation.navigateTo('welcome');
            return;
        }
        const last = this.history.pop();
        if (last.type === 'subjects') this.renderSubjects(container, last.classId);
        else if (last.type === 'chapters') this.renderChapters(container, last.subjectId);
        else this.renderClassGrid(container);
    }

    show() {
        if (this.container) this.container.style.display = 'block';
        const page = document.getElementById('academiaPage');
        if (page) {
            page.style.display = 'block';
            page.classList.add('active');
        }
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.add('hidden');
            header.classList.remove('visible');
        }
        const quizTopbar = document.getElementById('quizTopbar');
        if (quizTopbar) quizTopbar.style.display = 'none';
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
        const page = document.getElementById('academiaPage');
        if (page) {
            page.style.display = 'none';
            page.classList.remove('active');
        }
    }
}