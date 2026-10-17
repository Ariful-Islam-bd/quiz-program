// frontend/js/pages/academia.js
// Version: 4.0.0 - Nested Publisher→Paper→Chapter structure
// Changes: CHAPTER_DATA nested for hmath-11, flat for others
//          New render: renderPublisherList, renderPaperChapters
//          Breadcrumb: extended with publisher + paper levels

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
        { id: 'hmath-11', name: 'উচ্চতর গণিত', icon: '📐', chapters: 6 },
        { id: 'ict-11', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', chapters: 2 },
        { id: 'logic-11', name: 'যুক্তিবিদ্যা', icon: '🧠', chapters: 1 },
        { id: 'physics-11', name: 'পদার্থবিজ্ঞান', icon: '⚛️', chapters: 12 },
        { id: 'chemistry-11', name: 'রসায়ন', icon: '🧪', chapters: 10 },
        { id: 'biology-11', name: 'জীববিজ্ঞান', icon: '🧬', chapters: 8 }
    ]
};

// ============================================================
// ✅ CHAPTER_DATA — Two types:
//    type: 'publisher-nested' → publisher → paper → chapters
//    type: 'flat'              → chapters (no publisher)
// ============================================================
const CHAPTER_DATA = {

    // ════════════════════════════════════════════════════════
    // HSC → উচ্চতর গণিত (NESTED: Publisher → Paper → Chapter)
    // ════════════════════════════════════════════════════════
    'hmath-11': {
        type: 'publisher-nested',
        publishers: [
            // ─────────────────────────────────────────────
            // 📘 অক্ষরপত্র
            // ─────────────────────────────────────────────
            {
                id: 'okkhorpotro',
                name: 'অক্ষরপত্র',
                icon: '📘',
                description: 'অক্ষরপত্র প্রকাশনী',
                papers: [
                    {
                        id: 'okkhorpotro-1st',
                        name: '১ম পত্র',
                        icon: '📕',
                        chapters: [
                            {
                                id: 'okkhorpotro-determinant',
                                number: 1,
                                name: 'নির্ণায়ক',
                                icon: '🔢',
                                topics: [
                                    { id: 'HSC-Math-Okkhorpotro-1st-Determinant-1B', name: 'অনুশীলনী ১(B)', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Determinant-1B-Q1', name: 'প্রশ্ন ১', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Determinant-1B-Q2', name: 'প্রশ্ন ২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Determinant-1B-Q3', name: 'প্রশ্ন ৩', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Determinant-1B-Q4-Q5', name: 'প্রশ্ন ৪-৫', icon: '✅', type: 'note' }
                                ]
                            },                            
                            {
                                id: 'okkhorpotro-differ',
                                number: 9,
                                name: 'অন্তরীকরণ',
                                icon: '📈',
                                topics: [
                                    { id: 'HSC-Math-Okkhorpotro-1st-Differ-9A', name: 'অনুশীলনী ৯(A)', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Differ-9B', name: 'অনুশীলনী ৯(B)', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Differ-9C-All', name: '৯(C) - সকল প্রশ্ন', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-1st-Differ-9C-Q1', name: '৯(C) - প্রশ্ন ১', icon: '✅', type: 'note' }
                                ]
                            },
                        ]
                    },
                    {
                        id: 'okkhorpotro-2nd',
                        name: '২য় পত্র',
                        icon: '📗',
                        chapters: [
                            {
                                id: 'okkhorpotro-linearprog',
                                number: 2,
                                name: 'যোগাশ্রয়ী প্রোগ্রাম',
                                icon: '📐',
                                topics: [
                                    { id: 'HSC-Math-Okkhorpotro-2nd-LinearProg-Q2', name: 'প্রশ্ন ২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-LinearProg-Q3-Q4', name: 'প্রশ্ন ৩-৪', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-LinearProg-Q5', name: 'প্রশ্ন ৫', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-LinearProg-Q6', name: 'প্রশ্ন ৬', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-LinearProg-Q7', name: 'প্রশ্ন ৭', icon: '✅', type: 'note' }
                                ]
                            },                            
                            {
                                id: 'okkhorpotro-complex',
                                number: 3,
                                name: 'জটিল সংখ্যা',
                                icon: '📊',
                                topics: [
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-All', name: '৩(A) - সকল প্রশ্ন', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q01-Q02', name: '৩(A) - প্রশ্ন ১-২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q03-Q05', name: '৩(A) - প্রশ্ন ৩-৫', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q06-Q08', name: '৩(A) - প্রশ্ন ৬-৮', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q09', name: '৩(A) - প্রশ্ন ৯', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q10', name: '৩(A) - প্রশ্ন ১০', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q11', name: '৩(A) - প্রশ্ন ১১', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3A-Q12-Q15', name: '৩(A) - প্রশ্ন ১২-১৫', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-All', name: '৩(B) - সকল প্রশ্ন', icon: '📝', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q01-Q02', name: '৩(B) - প্রশ্ন ১-২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q03-Q04', name: '৩(B) - প্রশ্ন ৩-৪', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q05-Q09', name: '৩(B) - প্রশ্ন ৫-৯', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q10-Q11', name: '৩(B) - প্রশ্ন ১০-১১', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q12', name: '৩(B) - প্রশ্ন ১২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Okkhorpotro-2nd-Complex-3B-Q13-Q17', name: '৩(B) - প্রশ্ন ১৩-১৭', icon: '✅', type: 'note' }
                                ]
                            },
                        ]
                    }
                ]
            },

            // ─────────────────────────────────────────────
            // 📗 সিস্টেক
            // ─────────────────────────────────────────────
            {
                id: 'systech',
                name: 'সিস্টেক',
                icon: '📗',
                description: 'সিস্টেক প্রকাশনী',
                papers: [
                    {
                        id: 'systech-1st',
                        name: '১ম পত্র',
                        icon: '📕',
                        chapters: [
                            {
                                id: 'systech-trigono-ch6',
                                number: 6,
                                name: 'ত্রিকোণমিতি - অধ্যায় ৬',
                                icon: '🔺',
                                topics: [
                                    { id: 'HSC-Math-Systech-1st-Trigono-6A-Q01-Q10', name: '৬(A) - প্রশ্ন ১-১০', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-6A-Q11-Q21', name: '৬(A) - প্রশ্ন ১১-২১', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-6A-Q22-Q30', name: '৬(A) - প্রশ্ন ২২-৩০', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-6B-Q1-Q12', name: '৬(B) - প্রশ্ন ১-১২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-6B-Q13-Q24', name: '৬(B) - প্রশ্ন ১৩-২৪', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-6B-Q25-Q36', name: '৬(B) - প্রশ্ন ২৫-৩৬', icon: '✅', type: 'note' }
                                ]
                            },
                            {
                                id: 'systech-trigono-ch7',
                                number: 7,
                                name: 'ত্রিকোণমিতি - অধ্যায় ৭',
                                icon: '🔺',
                                topics: [
                                    { id: 'HSC-Math-Systech-1st-Trigono-7A-Q01-Q12', name: '৭(A) - প্রশ্ন ১-১২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-7A-Q13-Q24', name: '৭(A) - প্রশ্ন ১৩-২৪', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-7A-Q25-Q36', name: '৭(A) - প্রশ্ন ২৫-৩৬', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-7B-Q01-Q12', name: '৭(B) - প্রশ্ন ১-১২', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-7B-Q13-Q24', name: '৭(B) - প্রশ্ন ১৩-২৪', icon: '✅', type: 'note' },
                                    { id: 'HSC-Math-Systech-1st-Trigono-7B-Q25-Q36', name: '৭(B) - প্রশ্ন ২৫-৩৬', icon: '✅', type: 'note' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // ════════════════════════════════════════════════════════
    // HSC → ICT (FLAT: no publisher)
    // ════════════════════════════════════════════════════════
    'ict-11': {
        type: 'flat',
        chapters: [
            { id: 'ict-ch1', number: 1, name: 'বিশ্ব ও বাংলাদেশ প্রেক্ষিত', icon: '🌍', topics: [{ id: 'ict-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] },
            { id: 'ict-ch3', number: 3, name: 'সংখ্যা পদ্ধতি', icon: '🔢', topics: [{ id: 'ict-ch3-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] }
        ]
    },

    // ════════════════════════════════════════════════════════
    // HSC → যুক্তিবিদ্যা (FLAT)
    // ════════════════════════════════════════════════════════
    'logic-11': {
        type: 'flat',
        chapters: [
            { id: 'logic-ch1', number: 1, name: 'যৌক্তিক সংজ্ঞা', icon: '🧠', topics: [{ id: 'logic-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }] }
        ]
    }
};

// ============================================================
// ✅ Main Page Class
// ============================================================
export class AcademiaPage {
    constructor(navigation) {
        this.navigation = navigation;
        this.currentClass = null;
        this.currentSubject = null;
        this.currentPublisher = null;   // 🆕
        this.currentPaper = null;        // 🆕
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
    // ✅ Helper: Get subject config (with type check)
    // ============================================================
    getSubjectConfig(subjectId) {
        const config = CHAPTER_DATA[subjectId];
        if (!config) return { type: 'flat', chapters: [] };

        // Backward compat: if it's an array, treat as flat
        if (Array.isArray(config)) {
            return { type: 'flat', chapters: config };
        }

        return config;
    }

    // ============================================================
    // ✅ Render: Class Grid (unchanged)
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
    // ✅ Render: Subjects (unchanged)
    // ============================================================
    renderSubjects(container, classId) {
        const classData = CLASS_DATA.find(c => c.id === classId);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjects = SUBJECT_DATA[classId] || [];
        this.currentClass = classId;
        this.currentSubject = null;
        this.currentPublisher = null;
        this.currentPaper = null;

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
    // ✅ Render: Chapters — DISPATCHER
    // ============================================================
    renderChapters(container, subjectId) {
        this.currentSubject = subjectId;
        this.currentPublisher = null;
        this.currentPaper = null;

        const config = this.getSubjectConfig(subjectId);

        if (config.type === 'publisher-nested') {
            this.renderPublisherList(container, config.publishers);
        } else {
            // flat
            this.renderFlatChapters(container, config.chapters);
        }
    }

    // ============================================================
    // ✅ Render: Publisher List (NEW)
    // ============================================================
    renderPublisherList(container, publishers) {
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📚 প্রকাশনী</span>
            </div>
            <div class="publisher-grid">
                ${publishers.map(pub => `
                    <div class="publisher-card" data-publisher="${pub.id}">
                        <div class="publisher-icon">${pub.icon}</div>
                        <div class="publisher-info">
                            <div class="publisher-name">${pub.name}</div>
                            <div class="publisher-desc">${pub.description || ''}</div>
                        </div>
                        <div class="publisher-meta">
                            <span class="publisher-paper-count">${pub.papers.length}টি পত্র</span>
                        </div>
                        <span class="publisher-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.attachPublisherEvents(container, publishers);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Papers within Publisher (NEW)
    // ============================================================
    renderPublisherPapers(container, publisherId) {
        const config = this.getSubjectConfig(this.currentSubject);
        const publisher = config.publishers?.find(p => p.id === publisherId);
        if (!publisher) {
            console.error('Publisher not found:', publisherId);
            this.renderChapters(container, this.currentSubject);
            return;
        }

        this.currentPublisher = publisherId;
        this.currentPaper = null;

        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link publisher-link" data-action="back-to-publishers">${publisher.icon} ${publisher.name}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📄 পত্র</span>
            </div>
            <div class="paper-grid">
                ${publisher.papers.map(paper => `
                    <div class="paper-card" data-paper="${paper.id}">
                        <div class="paper-icon">${paper.icon || '📄'}</div>
                        <div class="paper-info">
                            <div class="paper-name">${paper.name}</div>
                            <div class="paper-desc">${paper.chapters.length}টি অধ্যায়</div>
                        </div>
                        <span class="paper-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.attachPaperEvents(container, publisher.papers);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Chapters within Paper (NEW)
    // ============================================================
    renderPaperChapters(container, paperId) {
        const config = this.getSubjectConfig(this.currentSubject);
        const publisher = config.publishers?.find(p => p.id === this.currentPublisher);
        if (!publisher) {
            this.renderChapters(container, this.currentSubject);
            return;
        }
        const paper = publisher.papers.find(p => p.id === paperId);
        if (!paper) {
            console.error('Paper not found:', paperId);
            return;
        }

        this.currentPaper = paperId;

        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

        container.innerHTML = `
            <div class="academia-breadcrumb">
                <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link publisher-link" data-action="back-to-publishers">${publisher.icon} ${publisher.name}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item"><span class="breadcrumb-link paper-link" data-action="back-to-papers">${paper.icon} ${paper.name}</span></span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">📑 অধ্যায়</span>
            </div>
            ${this.renderChapterListHTML(paper.chapters)}
        `;
        this.attachChapterEvents(container);
        this.attachTopicEvents(container);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Render: Flat Chapters (for non-publisher subjects)
    // ============================================================
    renderFlatChapters(container, chapters) {
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

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
            ${this.renderChapterListHTML(chapters)}
        `;
        this.attachChapterEvents(container);
        this.attachTopicEvents(container);
        this.attachBreadcrumbEvents(container);
    }

    // ============================================================
    // ✅ Helper: Chapter list HTML (reused)
    // ============================================================
    renderChapterListHTML(chapters) {
        return `
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
    }

    // ============================================================
    // ✅ Render: Content (unchanged)
    // ============================================================
    async renderContent(container, topicId) {
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';

        let chapterName = 'অধ্যায়', topicName = topicId;
        const config = this.getSubjectConfig(this.currentSubject);
        if (config) {
            let allChapters = [];
            if (config.type === 'flat') {
                allChapters = config.chapters || [];
            } else if (config.type === 'publisher-nested') {
                const publisher = config.publishers?.find(p => p.id === this.currentPublisher);
                const paper = publisher?.papers?.find(p => p.id === this.currentPaper);
                allChapters = paper?.chapters || [];
            }
            for (const chapter of allChapters) {
                const found = chapter.topics.find(t => t.id === topicId);
                if (found) {
                    chapterName = chapter.name;
                    topicName = found.name;
                    break;
                }
            }
        }

        // Build breadcrumb with publisher/paper if applicable
        let breadcrumbHTML = `
            <span class="breadcrumb-item"><span class="breadcrumb-link home-link" data-action="go-home">🏠 হোম</span></span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item"><span class="breadcrumb-link class-link" data-action="back-to-classes">📚 ${className}</span></span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item"><span class="breadcrumb-link subject-link" data-action="back-to-subjects">📖 ${subjectName}</span></span>
        `;

        if (config.type === 'publisher-nested' && this.currentPublisher && this.currentPaper) {
            const publisher = config.publishers.find(p => p.id === this.currentPublisher);
            const paper = publisher?.papers.find(p => p.id === this.currentPaper);
            if (publisher && paper) {
                breadcrumbHTML += `
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-item"><span class="breadcrumb-link publisher-link" data-action="back-to-publishers">${publisher.icon} ${publisher.name}</span></span>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-item"><span class="breadcrumb-link paper-link" data-action="back-to-papers">${paper.icon} ${paper.name}</span></span>
                `;
            }
        }

        breadcrumbHTML += `
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item"><span class="breadcrumb-link chapter-link" data-action="back-to-chapters">📑 ${chapterName}</span></span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">📄 ${topicName}</span>
        `;

        container.innerHTML = `
            <div class="academia-breadcrumb">
                ${breadcrumbHTML}
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

        const reloadBtn = container.querySelector('#reloadContentBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                contentService.clearTopicCache(topicId);
                this.loadContentFromAPI(topicId, container);
            });
        }

        await this.loadContentFromAPI(topicId, container);
    }

    // ============================================================
    // ✅ Load content from backend API (unchanged)
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

            contentBody.innerHTML = data.html;
            contentBody.classList.add('math-content');
            this.renderMath(contentBody);

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
    // ✅ Error state (unchanged)
    // ============================================================
    renderContentError(contentBody, topicId, error) {
        contentBody.innerHTML = `
            <div class="content-error">
                <div class="content-error-icon">❌</div>
                <h3 class="content-error-title">কন্টেন্ট লোড করতে সমস্যা হয়েছে</h3>
                <p class="content-error-message">${error.message || 'অজানা ত্রুটি'}</p>
                <p class="content-error-hint">📁 <code>${topicId}</code></p>
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
            this.goBack();
        });
    }

    // ============================================================
    // ✅ KaTeX rendering (unchanged)
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
        if (!document.querySelector('link[href*="katex.min.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            const renderScript = document.createElement('script');
            renderScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
            renderScript.onload = () => {
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(container, {
                        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
                        throwOnError: false
                    });
                }
            };
            document.head.appendChild(renderScript);
        };
        document.head.appendChild(script);
    }

    // ============================================================
    // ✅ Event attach helpers
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

    // 🆕 Publisher events
    attachPublisherEvents(container, publishers) {
        container.querySelectorAll('.publisher-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({
                    type: 'publishers',
                    subjectId: this.currentSubject
                });
                this.renderPublisherPapers(container, card.dataset.publisher);
            });
        });
    }

    // 🆕 Paper events
    attachPaperEvents(container, papers) {
        container.querySelectorAll('.paper-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({
                    type: 'papers',
                    subjectId: this.currentSubject,
                    publisherId: this.currentPublisher
                });
                this.renderPaperChapters(container, card.dataset.paper);
            });
        });
    }

    attachChapterEvents(container) {
        container.querySelectorAll('.chapter-header[data-chapter-toggle]').forEach(header => {
            header.addEventListener('click', () => {
                const id = header.dataset.chapterToggle;
                const body = container.querySelector(`[data-chapter-body="${id}"]`);
                const toggle = container.querySelector(`.chapter-toggle[data-chapter-toggle="${id}"]`);
                if (!body) return;

                const isOpen = body.classList.contains('open');
                if (isOpen) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                    void body.offsetHeight;
                    body.style.maxHeight = '0';
                    body.classList.remove('open');
                } else {
                    body.classList.add('open');
                    body.style.maxHeight = body.scrollHeight + 'px';
                    setTimeout(() => {
                        if (body.classList.contains('open')) body.style.maxHeight = 'none';
                    }, 400);
                }
                if (toggle) toggle.classList.toggle('open');
            });
        });
    }

    attachTopicEvents(container) {
        container.querySelectorAll('.topic-card').forEach(card => {
            card.addEventListener('click', () => {
                this.history.push({
                    type: 'topics',
                    subjectId: this.currentSubject,
                    publisherId: this.currentPublisher,
                    paperId: this.currentPaper
                });
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
                    case 'back-to-publishers':
                        this.renderChapters(container, this.currentSubject);
                        break;
                    case 'back-to-papers':
                        if (this.currentPublisher) this.renderPublisherPapers(container, this.currentPublisher);
                        break;
                    case 'back-to-chapters':
                        if (this.currentPaper) {
                            this.renderPaperChapters(container, this.currentPaper);
                        } else {
                            this.renderChapters(container, this.currentSubject);
                        }
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
                uiClosed = true;
            }
            modals.forEach(modal => {
                if (modal.style.display === 'flex' || modal.style.display === 'block') {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    uiClosed = true;
                }
            });
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
    // ✅ Lifecycle
    // ============================================================
    goBack() {
        const container = this.container || document.getElementById('academiaContent');
        if (!container || this.history.length === 0) {
            this.navigation.navigateTo('welcome');
            return;
        }
        const last = this.history.pop();
        if (last.type === 'subjects') this.renderSubjects(container, last.classId);
        else if (last.type === 'publishers') this.renderChapters(container, last.subjectId);
        else if (last.type === 'papers') this.renderPublisherPapers(container, last.publisherId);
        else if (last.type === 'topics') {
            this.currentPublisher = last.publisherId || null;
            this.currentPaper = last.paperId || null;
            if (this.currentPaper) this.renderPaperChapters(container, this.currentPaper);
            else this.renderChapters(container, last.subjectId);
        }
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