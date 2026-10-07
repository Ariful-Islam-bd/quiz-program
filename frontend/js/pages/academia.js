// frontend/js/pages/academia.js
// Version: 2.1.0 - Optimized

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
        { id: 'bangla-2-9', name: 'বাংলা ২য় পত্র', icon: '📖', chapters: 12 },
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

const CHAPTER_DATA = {
    'hmath-11': [
        { id: 'ch-3A', number: 3, name: 'জটিল সংখ্যা (অনুশীলনী ৩A)', icon: '📊',
            topics: [
                { id: '3A-All-Q', name: 'সকল প্রশ্ন', icon: '📝', type: 'note' },
                { id: '3A-Q01-Q02', name: 'প্রশ্ন ১-২ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q03-Q05', name: 'প্রশ্ন ৩-৫ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q06-Q08', name: 'প্রশ্ন ৬-৮ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q09', name: 'প্রশ্ন ৯ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q10', name: 'প্রশ্ন ১০ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q11', name: 'প্রশ্ন ১১ সমাধান', icon: '✅', type: 'note' },
                { id: '3A-Q12-Q15', name: 'প্রশ্ন ১২-১৫ সমাধান', icon: '✅', type: 'note' }
            ]
        },
        { id: 'ch-3B', number: 3, name: 'জটিল সংখ্যা (অনুশীলনী ৩B)', icon: '📊',
            topics: [
                { id: '3B-All-Q', name: 'সকল প্রশ্ন', icon: '📝', type: 'note' },
                { id: '3B-Q01-Q02', name: 'প্রশ্ন ১-২ সমাধান', icon: '✅', type: 'note' },
                { id: '3B-Q03-Q04', name: 'প্রশ্ন ৩-৪ সমাধান', icon: '✅', type: 'note' },
                { id: '3B-Q05-Q09', name: 'প্রশ্ন ৫-৯ সমাধান', icon: '✅', type: 'note' },
                { id: '3B-Q10-Q11', name: 'প্রশ্ন ১০-১১ সমাধান', icon: '✅', type: 'note' },
                { id: '3B-Q12', name: 'প্রশ্ন ১২ সমাধান', icon: '✅', type: 'note' },
                { id: '3B-Q13-Q17', name: 'প্রশ্ন ১৩-১৭ সমাধান', icon: '✅', type: 'note' }
            ]
        }
    ],
    'ict-11': [
        { id: 'ict-ch1', number: 1, name: 'বিশ্ব ও বাংলাদেশ প্রেক্ষিত', icon: '🌍', topics: [{ id: 'ict-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }]},
        { id: 'ict-ch3', number: 3, name: 'সংখ্যা পদ্ধতি', icon: '🔢', topics: [{ id: 'ict-ch3-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }]}
    ],
    'logic-11': [
        { id: 'logic-ch1', number: 1, name: 'যৌক্তিক সংজ্ঞা', icon: '🧠', topics: [{ id: 'logic-ch1-q', name: 'সকল প্রশ্ন', icon: '📝', type: 'quiz' }]}
    ]
};

const contentMap = {
    '3A-All-Q': { name: 'জটিল সংখ্যা - অনুশীলনী ৩(A) (সকল প্রশ্ন)', type: 'note', file: './content/HSC/math/3A/3A All Q Complex Numbers.html' },
    '3A-Q01-Q02': { name: 'জটিল সংখ্যা - প্রশ্ন ১-২ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q01-Q02 Solution Comp Num.html' },
    '3A-Q03-Q05': { name: 'জটিল সংখ্যা - প্রশ্ন ৩-৫ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q03-Q05 Solution Comp Num.html' },
    '3A-Q06-Q08': { name: 'জটিল সংখ্যা - প্রশ্ন ৬-৮ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q06-Q08 Solution Comp Num.html' },
    '3A-Q09': { name: 'জটিল সংখ্যা - প্রশ্ন ৯ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q09 Solution Comp Num.html' },
    '3A-Q10': { name: 'জটিল সংখ্যা - প্রশ্ন ১০ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q10 Solution Comp Num.html' },
    '3A-Q11': { name: 'জটিল সংখ্যা - প্রশ্ন ১১ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q11 Solution Comp Num.html' },
    '3A-Q12-Q15': { name: 'জটিল সংখ্যা - প্রশ্ন ১২-১৫ সমাধান', type: 'note', file: './content/HSC/math/3A/3A Q12-Q15 Solution Comp Num.html' },
    '3B-All-Q': { name: 'জটিল সংখ্যা - অনুশীলনী ৩(B) (সকল প্রশ্ন)', type: 'note', file: './content/HSC/math/3B/3B All Q Complex Numbers.html' },
    '3B-Q01-Q02': { name: 'জটিল সংখ্যা - প্রশ্ন ১-২ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q01-Q02.html' },
    '3B-Q03-Q04': { name: 'জটিল সংখ্যা - প্রশ্ন ৩-৪ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q03-Q04.html' },
    '3B-Q05-Q09': { name: 'জটিল সংখ্যা - প্রশ্ন ৫-৯ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q05-Q09.html' },
    '3B-Q10-Q11': { name: 'জটিল সংখ্যা - প্রশ্ন ১০-১১ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q10-Q11.html' },
    '3B-Q12': { name: 'জটিল সংখ্যা - প্রশ্ন ১২ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q12.html' },
    '3B-Q13-Q17': { name: 'জটিল সংখ্যা - প্রশ্ন ১৩-১৭ সমাধান', type: 'note', file: './content/HSC/math/3B/3B Q13-Q17.html' }
};

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
                console.error('academiaPage not found!');
                return;
            }
        }
        this.container = container;
        this.renderClassGrid(container);
        this.setupEventListeners();
    }

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

    renderContent(container, topicId) {
        const topicData = contentMap[topicId];
        const classData = CLASS_DATA.find(c => c.id === this.currentClass);
        const className = classData ? classData.name : 'শ্রেণি';
        const subjectData = SUBJECT_DATA[this.currentClass]?.find(s => s.id === this.currentSubject);
        const subjectName = subjectData ? subjectData.name : 'বিষয়';
        let chapterName = 'অধ্যায়', topicName = topicId;
        if (this.currentSubject) {
            const chapters = CHAPTER_DATA[this.currentSubject] || [];
            for (const chapter of chapters) {
                const found = chapter.topics.find(t => t.id === topicId);
                if (found) { chapterName = chapter.name; topicName = found.name; break; }
            }
        }
        if (!topicData) {
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
                <div class="empty-state" style="padding:60px 20px;text-align:center;">
                    <div style="font-size:4rem;margin-bottom:16px;">🔍</div>
                    <div style="font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:8px;">কন্টেন্ট পাওয়া যায়নি</div>
                    <div style="color:var(--text-light);font-size:0.95rem;">"${topicName}" টপিকের জন্য কোনো কন্টেন্ট নেই।</div>
                </div>
            `;
            this.attachBreadcrumbEvents(container);
            return;
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
                <span class="breadcrumb-item active">📄 ${topicData.name}</span>
            </div>
            <div class="content-viewer">
                <div class="content-header">
                    <div class="content-title">
                        <span>📄</span> ${topicData.name}
                        <span class="topic-badge ${topicData.type}" style="font-size:0.7rem;padding:2px 12px;">
                            ${topicData.type === 'quiz' ? '🧠 কুইজ' : '📝 নোট'}
                        </span>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-primary btn-sm" onclick="window.open('${topicData.file}', '_blank')">🔗 নতুন ট্যাবে খুলুন</button>
                    </div>
                </div>
                <div class="content-body" id="contentBody">
                    <div style="padding:40px;text-align:center;color:var(--text-light);">
                        <div class="spinner" style="margin:20px auto;"></div>
                        <p>⏳ কন্টেন্ট লোড হচ্ছে...</p>
                    </div>
                </div>
            </div>
        `;
        this.loadHTMLContent(topicData.file, container);
        this.attachBreadcrumbEvents(container);
    }

    async loadHTMLContent(filePath, container) {
        try {
            let fullPath = filePath;
            if (!fullPath.startsWith('./') && !fullPath.startsWith('/') && !fullPath.startsWith('http')) {
                fullPath = `./${fullPath}`;
            }
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw response.status === 404 
                    ? new Error(`📁 ফাইল পাওয়া যায়নি!\nপাথ: ${fullPath}`)
                    : new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const htmlContent = await response.text();
            if (htmlContent.includes('quiz_program') && htmlContent.includes('app.js')) {
                throw new Error('❌ ভুল ফাইল লোড হয়েছে! (index.html লোড হয়েছে)');
            }
            const contentBody = container.querySelector('#contentBody');
            if (!contentBody) throw new Error('contentBody এলিমেন্ট পাওয়া যায়নি!');
            contentBody.innerHTML = htmlContent;
            contentBody.style.cssText = `display:block!important;visibility:visible!important;opacity:1!important;min-height:400px!important;padding:20px!important;background:var(--card)!important;color:var(--text)!important;width:100%!important;border:2px solid var(--accent)!important;border-radius:8px!important;margin-top:10px!important;overflow:auto!important;`;
            const viewer = contentBody.closest('.content-viewer');
            if (viewer) {
                viewer.style.cssText = `display:block!important;visibility:visible!important;opacity:1!important;min-height:300px!important;padding:10px!important;background:var(--card)!important;border:2px solid var(--success)!important;border-radius:12px!important;margin-top:10px!important;`;
            }
            const page = document.getElementById('academiaPage');
            if (page) { page.style.display = 'block'; page.classList.add('active'); }
            this.renderMath(contentBody);
            setTimeout(() => {
                contentBody.style.display = 'none';
                contentBody.offsetHeight;
                contentBody.style.display = 'block';
                contentBody.style.visibility = 'visible';
                contentBody.style.opacity = '1';
            }, 50);
            setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        } catch (error) {
            console.error('Error loading HTML:', error);
            const contentBody = container.querySelector('#contentBody');
            if (contentBody) {
                contentBody.innerHTML = `
                    <div style="padding:40px;text-align:center;color:var(--danger);background:var(--card);border-radius:12px;border:2px solid var(--danger);">
                        <div style="font-size:3rem;margin-bottom:16px;">❌</div>
                        <h3 style="color:var(--danger);margin-bottom:8px;">কন্টেন্ট লোড করতে সমস্যা হয়েছে</h3>
                        <p style="color:var(--text);margin-bottom:8px;white-space:pre-wrap;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;background:var(--bg);padding:10px;border-radius:4px;">${error.message}</p>
                        <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:16px;word-break:break-all;">📁 <code style="background:var(--bg);padding:2px 8px;border-radius:4px;">${filePath}</code></p>
                        <button class="btn btn-primary" onclick="location.reload()" style="padding:10px 24px;font-size:1rem;cursor:pointer;">🔄 পুনরায় চেষ্টা করুন</button>
                    </div>
                `;
                contentBody.style.cssText = `display:block!important;visibility:visible!important;opacity:1!important;min-height:400px!important;padding:20px!important;background:var(--card)!important;`;
            }
        }
    }

    renderMath(container) {
        try {
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(container, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false });
            } else {
                this.loadKaTeX(container);
            }
        } catch (error) {
            console.warn('KaTeX render error:', error);
        }
    }

    loadKaTeX(container) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            const renderScript = document.createElement('script');
            renderScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
            renderScript.onload = () => {
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(container, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false });
                }
            };
            document.head.appendChild(renderScript);
        };
        document.head.appendChild(script);
    }

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
                const toggle = container.querySelector(`[data-chapter-toggle="${id}"]`);
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
                    case 'go-home': this.navigation.navigateTo('welcome'); break;
                    case 'back-to-classes': this.renderClassGrid(container); this.history = []; break;
                    case 'back-to-subjects': if (this.currentClass) this.renderSubjects(container, this.currentClass); break;
                    case 'back-to-chapters': if (this.currentSubject) this.renderChapters(container, this.currentSubject); break;
                    default: console.warn('Unknown breadcrumb action:', action);
                }
            });
        });
    }

setupEventListeners() {
    // ✅ Escape ইভেন্ট - শুধু UI বন্ধ করবে
    this._escapeHandler = (e) => {
        if (e.key !== 'Escape') return;
        
        // চেক করুন কোন UI এলিমেন্ট খোলা আছে
        const menu = document.getElementById('sideMenu');
        const pb = document.getElementById('profileBox');
        const modals = document.querySelectorAll('.modal-overlay');
        
        let uiClosed = false;
        
        // সাইড মেনু বন্ধ
        if (menu?.style.left === '0px') {
            menu.style.left = '-360px';
            menu.classList.remove('open');
            menu.setAttribute('aria-hidden', 'true');
            const icon = document.querySelector('#menuToggle .hamburger-icon');
            if (icon) icon.classList.remove('menu-open');
            uiClosed = true;
        }
        
        // প্রোফাইল বক্স বন্ধ
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
        
        // মডাল বন্ধ
        modals.forEach(modal => {
            if (modal.style.display === 'flex' || modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                uiClosed = true;
            }
        });
        
        // ✅ কোনো UI খোলা না থাকলে - কিছু করবেন না
        if (!uiClosed) {
            console.log('🔑 Escape pressed - no UI to close');
        }
        
        e.preventDefault();
        e.stopPropagation();
    };
    
    document.addEventListener('keydown', this._escapeHandler);
    
    // 'H' কী - হোমে যাবে
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'h' || e.key === 'H') && !e.target.matches('input, textarea, select')) {
            this.navigation.navigateTo('welcome');
        }
    });
}

    goBack() {
        const container = this.container || document.getElementById('academiaContent');
        if (!container || this.history.length === 0) { this.navigation.navigateTo('welcome'); return; }
        const last = this.history.pop();
        if (last.type === 'subjects') this.renderSubjects(container, last.classId);
        else if (last.type === 'chapters') this.renderChapters(container, last.subjectId);
        else this.renderClassGrid(container);
    }

    show() {
        if (this.container) this.container.style.display = 'block';
        const page = document.getElementById('academiaPage');
        if (page) { page.style.display = 'block'; page.classList.add('active'); }
        const header = document.getElementById('mainHeader');
        if (header) { header.classList.add('hidden'); header.classList.remove('visible'); }
        const quizTopbar = document.getElementById('quizTopbar');
        if (quizTopbar) quizTopbar.style.display = 'none';
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
        const page = document.getElementById('academiaPage');
        if (page) { page.style.display = 'none'; page.classList.remove('active'); }
    }
}