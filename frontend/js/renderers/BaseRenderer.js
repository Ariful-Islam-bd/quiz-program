// frontend/js/renderers/BaseRenderer.js
// Version: 1.6.0 - Fixed checkGroupAndShowNextButton missing method

import { ANSWER_STATUS, QUESTION_TYPES } from '../utils/constants.js';

export class BaseRenderer {
    constructor(container, quizEngine) {
        if (!container) throw new Error('Container element is required');
        this.container = container;
        this.quizEngine = quizEngine;
        this._scrollY = 0;
    }

    render() { throw new Error('render() method must be implemented by subclass'); }

    destroy() {
        if (this.container) { this.container.innerHTML = ''; this.container = null; }
        if (this.currentOptions) this.currentOptions = [];
        if (this.currentULs) this.currentULs = [];
        this.quizEngine = null;
    }

    createElement(tag, className = '', innerHTML = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }

    createButton(text, className, onClick) {
        const btn = this.createElement('button', `btn ${className}`);
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }

    clear() { this.container.innerHTML = ''; }
    showNextButton() { const b = document.getElementById('nextBtn'); if (b) b.style.display = 'block'; }
    hideNextButton() { const b = document.getElementById('nextBtn'); if (b) b.style.display = 'none'; }

    // ============================================================
    // ✅ FIX: checkGroupAndShowNextButton() — Base method যোগ করা হলো
    // ============================================================
    /**
     * গ্রুপ প্রশ্নের সব sub-question answerd হলে next button দেখায়।
     * Child class-এ override করা যেতে পারে, কিন্তু base-এ ডিফল্ট implementation থাকা জরুরি।
     */
    checkGroupAndShowNextButton() {
        const item = this.quizEngine?.getCurrentQuestion?.();
        if (!item) return;

        // ✅ গ্রুপ না হলে কিছু করার নেই
        if (!item.isGroup) return;

        // ✅ সব sub-question answerd কিনা চেক
        const allAnswered = item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED);
        if (allAnswered) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        }
    }

    checkAndShowNextButton() {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item) return;
        const allAnswered = item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED);
        if (allAnswered) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.showNextButton();
            this.setSkipButtonDisabled(true);
        } else {
            this.hideNextButton();
            this.setSkipButtonDisabled(false);
        }
    }

    setSkipButtonDisabled(disabled) {
        const btn = document.getElementById('skipBtn');
        if (btn) { btn.disabled = disabled; btn.classList.toggle('disabled', disabled); }
    }

    showLoading(msg = 'লোড হচ্ছে...') {
        const loader = this.createElement('div', 'loader');
        loader.textContent = msg;
        this.container.appendChild(loader);
    }

    showError(msg) {
        const div = this.createElement('div', 'error-message');
        div.textContent = msg;
        div.style.cssText = 'color:var(--danger);padding:20px;text-align:center;';
        this.container.appendChild(div);
    }

    renderQuestionText(q) {
        const p = this.createElement('p', 'question-text-header');
        p.innerHTML = `<b>${q.numid || q.serialNumber}.</b> ${q.q}`;
        return p;
    }

    renderStimulant(stimulant) {
        if (!stimulant?.trim()) return null;
        const div = this.createElement('div', 'stimulant-box');
        div.innerHTML = stimulant;
        return div;
    }

    // ============================================================
    // ✅ FIX: showExplanationModal — aria-hidden warning ঠিক করা হলো
    // ============================================================
    showExplanationModal(title, content, onClose) {
        this._lockBodyScroll();

        const modal = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        // ✅ modal-এর aria-hidden সরান — কারণ এতে focusable element আছে
        if (modal) {
            modal.removeAttribute('aria-hidden');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
        }

        const modalContent = modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.overflowY = 'auto';
            modalContent.style.webkitOverflowScrolling = 'touch';
            modalContent.style.maxHeight = '70vh';
            modalContent.style.overscrollBehavior = 'contain';
            modalContent.style.touchAction = 'pan-y';
            modalContent.scrollTop = 0;
        }

        titleEl.textContent = title || 'ব্যাখ্যা';
        msgEl.innerHTML = content;
        if (cancelBtn) cancelBtn.style.display = 'none';
        modal.style.display = 'flex';

        // ✅ background focus trap — modal-এর ভিতরে focus রাখুন
        if (okBtn) {
            setTimeout(() => okBtn.focus(), 100);
        }

        // ✅ modal-এর ভিতরে টাচ স্ক্রল
        if (modal) {
            modal.addEventListener('touchmove', (e) => {
                const target = e.target;
                const content = modal.querySelector('.modal-content');
                if (content && content.contains(target)) {
                    return;
                }
                e.preventDefault();
            }, { passive: false });
        }

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => this._renderKaTeXInModal(msgEl), { timeout: 300 });
        } else {
            setTimeout(() => this._renderKaTeXInModal(msgEl), 150);
        }

        okBtn.onclick = () => {
            const modalContent = modal?.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
            modal.style.display = 'none';
            this._unlockBodyScroll();
            if (onClose) onClose();
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
        };
    }

    // ============================================================
    // ✅ FIX: showExplanationModalWithCallback — aria-hidden warning ঠিক
    // ============================================================
    showExplanationModalWithCallback(title, content, onClose) {
        this._lockBodyScroll();
        if (window.quizApp?.setExplanationModalOpen) window.quizApp.setExplanationModalOpen(true);

        const modal = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        // ✅ modal-এর aria-hidden সরান
        if (modal) {
            modal.removeAttribute('aria-hidden');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
        }

        titleEl.textContent = title || 'ব্যাখ্যা';
        msgEl.innerHTML = content;
        if (cancelBtn) cancelBtn.style.display = 'none';
        modal.style.display = 'flex';

        // ✅ outside click block
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        }, true);

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.overflowY = 'auto';
            modalContent.style.webkitOverflowScrolling = 'touch';
            modalContent.style.maxHeight = '70vh';
            modalContent.style.overscrollBehavior = 'contain';
            modalContent.scrollTop = 0;
        }

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => this._renderKaTeXInModal(msgEl), { timeout: 300 });
        } else {
            setTimeout(() => this._renderKaTeXInModal(msgEl), 150);
        }

        const handleOk = () => {
            const modalContent = modal?.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
            if (window.quizApp?.setExplanationModalOpen) window.quizApp.setExplanationModalOpen(false);

            // ✅ modal বন্ধ করার আগে aria-hidden ফিরিয়ে আনুন
            modal.removeAttribute('role');
            modal.removeAttribute('aria-modal');

            modal.style.display = 'none';
            this._unlockBodyScroll();
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            okBtn.removeEventListener('click', handleOk);
            if (onClose) onClose();
        };

        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        newOkBtn.addEventListener('click', handleOk);

        // ✅ modal open হলে OK button-এ focus
        setTimeout(() => newOkBtn.focus(), 100);
    }

    _renderKaTeXInModal(container) {
        if (!container) return;
        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(container, {
                    delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
                    throwOnError: false
                });
                return;
            } catch (e) { /* ignore */ }
        }
        if (typeof katex !== 'undefined') {
            container.querySelectorAll('.math, script[type="math/tex"]').forEach(el => {
                try {
                    const tex = el.textContent?.trim();
                    if (tex) {
                        const display = el.tagName === 'SCRIPT' || el.classList.contains('katex-display');
                        katex.render(tex, el, { throwOnError: false, displayMode: display });
                    }
                } catch (e) { /* ignore */ }
            });
        }
    }

    // ============================================================
    // ✅ FIX: showExplanationAndAutoSubmit — this.checkGroupAndShowNextButton safe call
    // ============================================================
    showExplanationAndAutoSubmit(subQ, onAutoSubmit, getContentCallback) {
        const mode = this.quizEngine.getMode?.() || 'perQuestion';
        const shouldPause = mode !== 'full';
        if (shouldPause) this.quizEngine.pauseTimer();

        const content = getContentCallback ? getContentCallback() : this.getDefaultExplanationContent(subQ);

        this.showExplanationModalWithCallback(
            'ব্যাখ্যা (উত্তর স্বয়ংক্রিয়ভাবে জমা হবে)',
            content,
            () => {
                if (onAutoSubmit) onAutoSubmit();

                const item = this.quizEngine.getCurrentQuestion();
                const isGroup = item?.isGroup || false;
                const allAnswered = item?.questions?.every(q => q.status !== ANSWER_STATUS.UNANSWERED) || false;

                if (isGroup) {
                    const hasUnanswered = item?.questions?.some(q => q.status === ANSWER_STATUS.UNANSWERED) || false;
                    if (hasUnanswered && shouldPause) this.quizEngine.resumeTimer();

                    // ✅ safe call — Base-এ method আছে, তাই TypeError হবে না
                    if (typeof this.checkGroupAndShowNextButton === 'function') {
                        this.checkGroupAndShowNextButton();
                    }
                } else {
                    if (allAnswered) {
                        this.setSkipButtonDisabled(true);
                        this.showNextButton();
                    } else if (shouldPause) {
                        this.quizEngine.resumeTimer();
                    }
                }
            }
        );
    }

    getDefaultExplanationContent(subQ) { return '<p>ব্যাখ্যা উপলব্ধ নেই।</p>'; }

    generateUnifiedExplanation(subQ, options = {}) {
        const { showQuestion = true, showAnswers = true, showNotice = false, isGroup = false, inputs = null, customLayout = null } = options;
        let html = '';
        if (showNotice) {
            const skipNotice = isGroup
                ? 'এই প্রশ্নটি স্কিপ হবে। মডাল বন্ধ করার পর অন্য প্রশ্নের উত্তর দিতে পারবেন।'
                : 'এই প্রশ্নটি স্কিপ হবে এবং পরবর্তী প্রশ্নে চলে যাবেন।';
            html += `<div class="explanation-notice"><span class="notice-icon">ℹ️</span><span class="notice-text">${skipNotice}</span></div>`;
        }
        if (showQuestion) html += `<div class="explanation-question"><p><strong>প্রশ্ন:</strong> ${subQ.q}</p></div>`;
        if (showAnswers) {
            const layout = customLayout || this._determineLayout(subQ);
            if (layout === 'mcq') html += this._generateMCQExplanation(subQ);
            else if (Array.isArray(subQ.explain) && subQ.explain.length > 0) html += this._generateExplanationTable(subQ, inputs);
            else html += this._generateSimpleExplanation(subQ);
        }
        return `<div class="explanation-container">${html}</div>`;
    }

    // ============================================================
    // ✅ FIX: _lockBodyScroll — aria-hidden conflict এড়ানোর জন্য focus সরান
    // ============================================================
    _lockBodyScroll() {
        const scrollY = window.scrollY;

        // ✅ body-তে focus থাকা element blur করুন
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.pointerEvents = 'none';
        document.body.dataset.scrollY = scrollY;
        document.body.classList.add('modal-open');

        const modal = document.getElementById('confirmOverlay');
        if (modal) {
            modal.style.overflowY = 'auto';
            modal.style.webkitOverflowScrolling = 'touch';
            modal.style.overscrollBehavior = 'contain';
            modal.style.pointerEvents = 'auto';
            // ✅ aria-hidden সরান — focused element সহ modal-এ এটা থাকলে warning দেয়
            modal.removeAttribute('aria-hidden');
        }

        const modalContent = modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.overflowY = 'auto';
            modalContent.style.webkitOverflowScrolling = 'touch';
            modalContent.style.overscrollBehavior = 'contain';
            modalContent.style.touchAction = 'pan-y';
            modalContent.style.pointerEvents = 'auto';
            modalContent.scrollTop = 0;
        }
    }

    _unlockBodyScroll() {
        const scrollY = parseInt(document.body.dataset.scrollY || '0');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        delete document.body.dataset.scrollY;
        window.scrollTo(0, scrollY);
        document.body.classList.remove('modal-open');

        const modal = document.getElementById('confirmOverlay');
        if (modal) {
            modal.style.overflowY = '';
            modal.style.webkitOverflowScrolling = '';
            modal.style.overscrollBehavior = '';
            modal.style.pointerEvents = '';
        }
        const modalContent = modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.overflowY = '';
            modalContent.style.webkitOverflowScrolling = '';
            modalContent.style.overscrollBehavior = '';
            modalContent.style.touchAction = '';
            modalContent.style.pointerEvents = '';
            modalContent.scrollTop = 0;
        }
    }

    _determineLayout(subQ) {
        if (subQ.type === QUESTION_TYPES.MCQ) return 'mcq';
        if (Array.isArray(subQ.explain) && subQ.explain.length > 0) return 'table';
        return 'simple';
    }

    _generateMCQExplanation(subQ) {
        const correctIdx = subQ.answer[0];
        const correctAnswer = subQ.options[correctIdx];
        const explanation = subQ.explain || 'এই প্রশ্নের জন্য কোনো ব্যাখ্যা নেই।';
        let userHTML = '';
        if (subQ.userAnswer !== undefined && subQ.userAnswer !== null) {
            const userAnswer = subQ.options[subQ.userAnswer];
            const isCorrect = subQ.status === ANSWER_STATUS.CORRECT;
            userHTML = `<div class="explanation-user-answer ${isCorrect ? 'correct' : 'wrong'}">
                <p><strong>আপনার উত্তর:</strong> ${userAnswer}</p>
                <p><strong>স্থিতি:</strong> ${isCorrect ? 'সঠিক ✓' : 'ভুল ✗'}</p>
            </div>`;
        } else if (subQ.status === ANSWER_STATUS.SKIPPED) {
            userHTML = `<div class="explanation-user-answer skipped"><p><strong>স্থিতি:</strong> এই প্রশ্নটি স্কিপ করা হয়েছে</p></div>`;
        }
        return `<div class="explanation-answer"><p><strong>সঠিক উত্তর:</strong> ${correctAnswer}</p></div>
            ${userHTML}<div class="explanation-details"><p><strong>ব্যাখ্যা:</strong> ${explanation}</p></div>`;
    }

    _generateExplanationTable(subQ, inputs = null) {
        let html = '<table class="explanation-table"><thead><tr><th>#</th><th>সঠিক উত্তর</th><th>ব্যাখ্যা</th></tr></thead><tbody>';
        subQ.explain.forEach((item, idx) => {
            const label = this._getExplanationLabel(subQ.type, idx);
            let word = item.word || '';
            if (subQ.type === QUESTION_TYPES.BLANK_SUFFIX_PREFIX && inputs) {
                const root = inputs[idx]?.dataset?.rootWord || '';
                if (root) word = `<strong>${root}</strong> → ${word}`;
            }
            html += `<tr><td>${label}</td><td><strong>${word}</strong></td><td>${item.desc || 'কোনো ব্যাখ্যা নেই।'}</td></tr>`;
        });
        html += '</tbody></table>';
        return html;
    }

    _generateSimpleExplanation(subQ) {
        const answers = this._getCorrectAnswersList(subQ);
        let html = '';
        if (answers.length > 0) {
            html += '<div class="explanation-answers"><p><strong>সঠিক উত্তর:</strong></p><ul>';
            answers.forEach(ans => html += `<li><strong>${ans}</strong></li>`);
            html += '</ul></div>';
        }
        html += `<div class="explanation-details"><p><strong>ব্যাখ্যা:</strong> ${subQ.explain || 'এই প্রশ্নের জন্য কোনো ব্যাখ্যা নেই।'}</p></div>`;
        return html;
    }

    _getExplanationLabel(type, index) {
        return type === QUESTION_TYPES.BLANK_SUFFIX_PREFIX ? String.fromCharCode(97 + index) : index + 1;
    }

    _getCorrectAnswersList(subQ) {
        if (!subQ.answer) return [];
        if (subQ.type === QUESTION_TYPES.MCQ && subQ.options) return [subQ.options[subQ.answer[0]]];
        if (Array.isArray(subQ.answer)) {
            if (subQ.options) return subQ.answer.map(idx => subQ.options[idx]?.replace(/{|:\d+}/g, '') || '');
            return subQ.answer;
        }
        return [];
    }

    highlightCorrectAnswer(container, options, correctIndex, shuffledIndices = null) {
        container.querySelectorAll('.option').forEach((item, idx) => {
            const origIdx = shuffledIndices ? shuffledIndices[idx] : idx;
            if (origIdx === correctIndex) item.classList.add('correct');
        });
    }

    disableAllOptions(container) {
        container.querySelectorAll('.option, .blank-option, .rearrange-item').forEach(opt => {
            opt.classList.add('disabled');
            opt.style.pointerEvents = 'none';
        });
    }

    disableSubmitButtons() {
        this.container.querySelectorAll('.btn-primary, .btn.primary').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
    }
}