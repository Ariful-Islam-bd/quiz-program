// frontend/js/renderers/RearrangingRenderer.js
// Version: 2.0.0 - Review Mode Support

import { BaseRenderer } from './BaseRenderer.js';
import { ANSWER_STATUS } from '../utils/constants.js';

const normalizeType = (t) => String(t || '').trim().toLowerCase().replace(/\s+/g, '-');

const TYPE_KEY = {
    MCQ: 'mcq',
    BLANK_TYPE_A: 'blank-type-a',
    BLANK_TYPE_B: 'blank-type-b',
    BLANK_SUFFIX_PREFIX: 'blank-suffix-prefix',
    SENTENCE_REARRANGING: 'sentence-rearranging'
};

export class RearrangingRenderer extends BaseRenderer {
    constructor(container, quizEngine, options = {}) {
        super(container, quizEngine);
        this.draggedItem = null;
        this.touchDraggedItem = null;
        this.mode = options.mode || 'quiz';           // 'quiz' | 'review'
        this.isReviewMode = this.mode === 'review';
        this.readOnly = this.isReviewMode || (options.readOnly || false);
    }

    // ============================================================
    // ✅ Main render — Quiz ও Review উভয়ের জন্য
    // ============================================================
    render(question, onAnswered) {
        this.clear();
        const wrapper = this.createElement(
            'div',
            this.isReviewMode ? 'rearranging-review-wrapper' : 'rearranging-wrapper'
        );

        if (question.stimulant) {
            const el = this.renderStimulant(question.stimulant);
            if (el) wrapper.appendChild(el);
        }

        const questions = question.isGroup ? question.questions : [question.questions[0]];
        questions.forEach(subQ => {
            const t = normalizeType(subQ.type);
            if (t === TYPE_KEY.SENTENCE_REARRANGING) {
                if (this.isReviewMode) {
                    this.renderSubQuestionReview(subQ, wrapper);
                } else {
                    this.renderSubQuestion(subQ, onAnswered, wrapper);
                }
            }
        });

        this.container.appendChild(wrapper);
    }

    // ============================================================
    // ✅ ✅ ✅ NEW: Review mode render
    // ============================================================
    renderSubQuestionReview(subQ, parentWrapper) {
        const card = this.createElement('div', 'review-card sentence-rearranging-review-card');

        // ============================================================
        // ✅ ১. Header (serial + instruction + badge)
        // ============================================================
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid || subQ.serialNumber}.</b>`;
        header.appendChild(serial);

        if (subQ.instruction) {
            header.appendChild(this.createElement('div', 'instruction-text', subQ.instruction));
        }

        const badge = this.createStatusBadge(subQ.status);
        if (badge) header.appendChild(badge);

        card.appendChild(header);

        // ============================================================
        // ✅ ২. Question text (main prompt)
        // ============================================================
        if (subQ.q) {
            const qText = this.createElement('div', 'question-text-content review-rearrange-question');
            qText.innerHTML = subQ.q;
            card.appendChild(qText);
        }

        // ============================================================
        // ✅ ৩. Comparison Box
        // ============================================================
        const comparisonBox = this.createElement('div', 'blank-comparison-box rearranging-comparison-box');

        // Marks display
        const marksDisplay = this.createElement('div', 'blank-marks-display');
        const earnedMarks = this._calculateEarnedMarksRearranging(subQ);
        const totalMarks = subQ.marks || 1;
        marksDisplay.innerHTML = `প্রাপ্ত: <strong>${earnedMarks.toFixed(2)}</strong> / ${totalMarks.toFixed(2)}`;
        comparisonBox.appendChild(marksDisplay);

        const options = subQ.options || [];
        const correctOrder = subQ.answer || [];

        // ============================================================
        // ✅ FIX: Determine effective user order — userAnswer → fallback → shuffledOrder → default
        // ============================================================
        let effectiveUserOrder = null;
        if (Array.isArray(subQ.userAnswer) && subQ.userAnswer.length > 0
            && subQ.userAnswer.some(v => v !== null && v !== undefined)) {
            // ✅ Case 1: User actually submitted (or auto-submitted on timeout)
            effectiveUserOrder = subQ.userAnswer;
        } else if (Array.isArray(subQ.shuffledOrder) && subQ.shuffledOrder.length > 0) {
            // ✅ Case 2: Skipped — show the shuffled order the user saw before skipping
            effectiveUserOrder = subQ.shuffledOrder;
        } else {
            // ✅ Case 3: Fallback — assume default order (in case shuffledOrder is missing)
            effectiveUserOrder = correctOrder.map((_, i) => i);
        }

        // ============================================================
        // ✅ ৪. User order row
        // ============================================================
        const userRow = this.createElement('div', 'blank-row user-row');
        const userLabel = this.createElement('div', 'blank-row-label', '👤 আপনার ক্রম:');
        userRow.appendChild(userLabel);

        const userListWrapper = this.createElement('div', 'rearrange-review-list');
        const userTotal = effectiveUserOrder.length;

        for (let i = 0; i < userTotal; i++) {
            const origIdx = effectiveUserOrder[i];
            const correctIdx = correctOrder[i];
            const isCorrect = (origIdx !== undefined && origIdx !== null && origIdx === correctIdx);

            const item = this.createElement('div', 'rearrange-review-item');
            item.classList.add(isCorrect ? 'correct' : 'wrong');

            const numSpan = this.createElement('span', 'rearrange-review-number', `${i + 1}.`);
            item.appendChild(numSpan);

            const displayText = (origIdx !== undefined && origIdx !== null && options[origIdx] !== undefined)
                ? String(options[origIdx])
                : '—';
            const textSpan = this.createElement('span', 'rearrange-review-text', displayText);
            item.appendChild(textSpan);

            userListWrapper.appendChild(item);
        }

        userRow.appendChild(userListWrapper);
        comparisonBox.appendChild(userRow);

        // ✅ Separator
        const separator = this.createElement('div', 'blank-row-separator');
        comparisonBox.appendChild(separator);

        // ============================================================
        // ✅ ৫. Correct order row
        // ============================================================
        const correctRow = this.createElement('div', 'blank-row correct-row');
        const correctLabel = this.createElement('div', 'blank-row-label', '✅ সঠিক ক্রম:');
        correctRow.appendChild(correctLabel);

        const correctListWrapper = this.createElement('div', 'rearrange-review-list');

        correctOrder.forEach((origIdx, i) => {
            const item = this.createElement('div', 'rearrange-review-item correct');

            const numSpan = this.createElement('span', 'rearrange-review-number', `${i + 1}.`);
            item.appendChild(numSpan);

            const displayText = options[origIdx] !== undefined ? String(options[origIdx]) : '—';
            const textSpan = this.createElement('span', 'rearrange-review-text', displayText);
            item.appendChild(textSpan);

            correctListWrapper.appendChild(item);
        });

        correctRow.appendChild(correctListWrapper);
        comparisonBox.appendChild(correctRow);

        card.appendChild(comparisonBox);

        // ============================================================
        // ✅ ৬. Explanation Button
        // ============================================================
        const btnContainer = this.createElement('div', 'mcq-button-container');
        const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
            this.showExplanationModal(
                'ব্যাখ্যা',
                this.generateUnifiedExplanation(subQ, { showNotice: false, isGroup: false })
            );
        });
        btnContainer.appendChild(explainBtn);
        card.appendChild(btnContainer);

        parentWrapper.appendChild(card);
    }

    // ============================================================
    // ✅ Helper: Earned marks for Rearranging
    // ============================================================
    _calculateEarnedMarksRearranging(subQ) {
        if (typeof subQ.earnedMarks === 'number') {
            return subQ.earnedMarks;
        }

        const correctOrder = subQ.answer || [];
        const userOrder = subQ.userAnswer || [];
        const total = correctOrder.length;
        if (total === 0) return 0;

        let correctCount = 0;
        for (let i = 0; i < total; i++) {
            if (userOrder[i] === correctOrder[i]) correctCount++;
        }
        const marksPerItem = (subQ.marks || 1) / total;
        return correctCount * marksPerItem;
    }

    // ============================================================
    // ✅ Helper: Status badge
    // ============================================================
    createStatusBadge(status) {
        const badgeMap = {
            [ANSWER_STATUS.WRONG]: { text: '❌ ভুল', cls: 'badge-wrong' },
            [ANSWER_STATUS.SKIPPED]: { text: '⏭️ স্কিপ', cls: 'badge-skipped' },
            [ANSWER_STATUS.TIMED_OUT]: { text: '⏰ সময় শেষ', cls: 'badge-timedout' },
            [ANSWER_STATUS.PARTIAL]: { text: '🔶 আংশিক', cls: 'badge-partial' },
            [ANSWER_STATUS.CORRECT]: { text: '✅ সঠিক', cls: 'badge-correct' }
        };
        const config = badgeMap[status];
        if (!config) return null;

        const badge = this.createElement('span', `review-status-badge ${config.cls}`);
        badge.textContent = config.text;
        return badge;
    }

    // ============================================================
    // ✅ Quiz mode (unchanged)
    // ============================================================
    markRearrangingAsSkipped(subQ, ul, onAnswered) {
        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;
        subQ.status = ANSWER_STATUS.SKIPPED;
        subQ.userAnswer = null;
        this.quizEngine.answerQuestion(subQ.numid, null, false);
        Array.from(ul.children).forEach(li => { li.draggable = false; li.classList.add('disabled'); });
        if (onAnswered && this.quizEngine?.getCurrentQuestion()) onAnswered(false);
    }

    autoSubmitRearranging(subQ, ul, submitBtn, onAnswered) {
        const userOrder = Array.from(ul.children).map(li => parseInt(li.dataset.originalIndex));
        const answer = subQ.answer || [];
        const totalItems = answer.length;
        const marksPerItem = totalItems > 0 ? (subQ.marks || 1) / totalItems : 0;
        let correctCount = 0, earnedMarks = 0;
        userOrder.forEach((origIdx, pos) => {
            if (origIdx === answer[pos]) { correctCount++; earnedMarks += marksPerItem; }
        });
        this.markAnswers(ul, answer);
        this.quizEngine.answerQuestionWithPartialMarks(subQ.numid, userOrder, earnedMarks, subQ.marks || 1);
        Array.from(ul.children).forEach(li => { li.draggable = false; li.classList.add('disabled'); });
        if (submitBtn) submitBtn.disabled = true;
        if (onAnswered) onAnswered(correctCount === totalItems);
    }

    checkGroupAndShowNextButton() {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) return;
        if (item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED)) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        }
    }

    renderSubQuestion(subQ, onAnswered, parentWrapper) {
        if (subQ.status === undefined) subQ.status = ANSWER_STATUS.UNANSWERED;
        const card = this.createElement('div', 'question-card');
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid || subQ.serialNumber}.</b>`;
        header.appendChild(serial);
        const text = this.createElement('div', 'question-text-content');
        text.innerHTML = subQ.q;
        header.appendChild(text);
        card.appendChild(header);
        if (subQ.instruction) card.appendChild(this.createElement('div', 'instruction-text', subQ.instruction));
        const optDiv = this.createElement('div', 'rearrange-container');
        const ul = this.createElement('ul', 'rearrange-list sortable-list');
        ul.dataset.numid = subQ.numid;
        const options = subQ.options || [];
        const answer = subQ.answer || [];
        const items = options.map((text, index) => ({ text, originalIndex: index }));
        this.shuffleArray(items);
        subQ.shuffledOrder = items.map(item => item.originalIndex);
        let submitBtn = null;
        items.forEach((item, idx) => {
            const li = this.createElement('li', 'rearrange-item', item.text);
            li.draggable = true;
            li.dataset.originalIndex = item.originalIndex;
            li.dataset.currentIndex = idx;
            li.addEventListener('dragstart', (e) => this.handleDragStart(e, li));
            li.addEventListener('dragend', (e) => this.handleDragEnd(e));
            li.addEventListener('dragover', (e) => e.preventDefault());
            li.addEventListener('drop', (e) => this.handleDrop(e, ul, li));
            li.addEventListener('touchstart', (e) => this.handleTouchStart(e, li), { passive: false });
            li.addEventListener('touchmove', (e) => this.handleTouchMove(e, ul), { passive: false });
            li.addEventListener('touchend', (e) => this.handleTouchEnd(e, ul));
            ul.appendChild(li);
        });
        optDiv.appendChild(ul);
        card.appendChild(optDiv);
        const btnContainer = this.createElement('div', 'rearrange-button-container');
        submitBtn = this.createButton('সাবমিট', 'btn-primary', () => {
            if (submitBtn.disabled || this.isQuestionLocked(subQ)) return;
            submitBtn.disabled = true;
            const userOrder = Array.from(ul.children).map(li => parseInt(li.dataset.originalIndex));
            const totalItems = answer.length;
            const marksPerItem = totalItems > 0 ? (subQ.marks || 1) / totalItems : 0;
            let correctCount = 0, earnedMarks = 0;
            userOrder.forEach((origIdx, pos) => {
                if (origIdx === answer[pos]) { correctCount++; earnedMarks += marksPerItem; }
            });
            if (correctCount === totalItems) {
                this.quizEngine?.soundManager?.play('correct');
            } else {
                this.quizEngine?.soundManager?.play('wrong');
            }
            this.markAnswers(ul, answer);
            this.quizEngine.answerQuestionWithPartialMarks(subQ.numid, userOrder, earnedMarks, subQ.marks || 1);
            Array.from(ul.children).forEach(li => { li.draggable = false; li.classList.add('disabled'); });
            const item = this.quizEngine.getCurrentQuestion();
            if (!item?.isGroup) {
                if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
                this.setSkipButtonDisabled(true);
                this.showNextButton();
            } else this.checkGroupAndShowNextButton();
            if (onAnswered) onAnswered(correctCount === totalItems);
        });
        btnContainer.appendChild(submitBtn);
        const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
            if (subQ.status !== ANSWER_STATUS.UNANSWERED) {
                this.showExplanationModal('ব্যাখ্যা', this.generateUnifiedExplanation(subQ, { showNotice: false }));
                return;
            }
            this.showExplanationAndAutoSubmit(
                subQ,
                () => this.autoSubmitRearranging(subQ, ul, submitBtn, onAnswered),
                () => this.generateUnifiedExplanation(subQ, { showNotice: true, isGroup: this.quizEngine.getCurrentQuestion()?.isGroup || false })
            );
        });
        btnContainer.appendChild(explainBtn);
        card.appendChild(btnContainer);
        parentWrapper.appendChild(card);
    }

    handleDragStart(e, item) {
        this.draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.originalIndex);
    }

    handleDragEnd(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }
    }

    handleDrop(e, container, targetItem) {
        e.preventDefault();
        if (!this.draggedItem || this.draggedItem === targetItem) return;
        const allItems = Array.from(container.children);
        const draggedIdx = allItems.indexOf(this.draggedItem);
        const targetIdx = allItems.indexOf(targetItem);
        if (draggedIdx < targetIdx) container.insertBefore(this.draggedItem, targetItem.nextSibling);
        else container.insertBefore(this.draggedItem, targetItem);
        this.updateIndices(container);
    }

    handleTouchStart(e, item) {
        e.preventDefault();
        this.touchDraggedItem = item;
        item.classList.add('dragging');
        const touch = e.touches[0];
        this.touchStartY = touch.clientY;
        this.touchStartX = touch.clientX;
    }

    handleTouchMove(e, container) {
        e.preventDefault();
        if (!this.touchDraggedItem) return;
        const touch = e.touches[0];
        const elementsAtPoint = document.elementsFromPoint(touch.clientX, touch.clientY);
        const targetItem = elementsAtPoint.find(el => el.classList.contains('rearrange-item') && el !== this.touchDraggedItem);
        if (targetItem && container.contains(targetItem)) {
            const allItems = Array.from(container.children);
            const draggedIdx = allItems.indexOf(this.touchDraggedItem);
            const targetIdx = allItems.indexOf(targetItem);
            if (draggedIdx < targetIdx) container.insertBefore(this.touchDraggedItem, targetItem.nextSibling);
            else container.insertBefore(this.touchDraggedItem, targetItem);
            this.updateIndices(container);
        }
    }

    handleTouchEnd(e, container) {
        if (this.touchDraggedItem) {
            this.touchDraggedItem.classList.remove('dragging');
            this.touchDraggedItem = null;
        }
    }

    updateIndices(container) {
        Array.from(container.children).forEach((li, idx) => { li.dataset.currentIndex = idx; });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    markAnswers(container, correctOrder) {
        Array.from(container.children).forEach((li, pos) => {
            const origIdx = parseInt(li.dataset.originalIndex);
            li.classList.add(origIdx === correctOrder[pos] ? 'correct' : 'wrong');
        });
    }

    isQuestionLocked(subQ) {
        return [ANSWER_STATUS.TIMED_OUT, ANSWER_STATUS.CORRECT, ANSWER_STATUS.WRONG, ANSWER_STATUS.SKIPPED].includes(subQ.status);
    }

    showExplanation(subQ, correctOrder) {
        const options = subQ.options || [];
        const correctOrderText = correctOrder.map(idx => options[idx]).join(' → ');
        const explanationHTML = subQ.explain ? `<p>${subQ.explain}</p>` : '<p>এই প্রশ্নের জন্য কোনো ব্যাখ্যা নেই।</p>';
        const content = `<div class="explanation-question"><p><strong>প্রশ্ন:</strong> ${subQ.q}</p></div>
            <div class="explanation-answer"><p><strong>সঠিক ক্রম:</strong> ${correctOrderText}</p></div>
            <div class="explanation-details"><p><strong>ব্যাখ্যা:</strong> ${explanationHTML}</p></div>`;
        this.showExplanationModalWithCallback('ব্যাখ্যা', content, null);
    }

    checkAndShowNextButton() {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item) return;
        if (item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED)) {
            this.showNextButton();
            this.setSkipButtonDisabled(true);
        }
    }

    handleTimeout() {
        const question = this.quizEngine.getCurrentQuestion();
        if (!question) return;
        const questions = question.isGroup ? question.questions : [question.questions[0]];
        questions.forEach(subQ => {
            if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                const container = this.container.querySelector(`.rearrange-list[data-numid="${subQ.numid}"]`);
                if (container) {
                    const userOrder = Array.from(container.children).map(li => parseInt(li.dataset.originalIndex));
                    const answer = subQ.answer || [];
                    let correctCount = 0;
                    userOrder.forEach((origIdx, pos) => { if (origIdx === answer[pos]) correctCount++; });
                    this.markAnswers(container, answer);
                    const isFullyCorrect = correctCount === answer.length;
                    this.quizEngine.autoSubmitQuestion(subQ.numid, userOrder, isFullyCorrect);
                    Array.from(container.children).forEach(li => { li.draggable = false; li.classList.add('disabled'); });
                }
            }
        });
        this.showNextButton();
        this.setSkipButtonDisabled(true);
        this.disableSubmitButtons();
    }

    disableSubmitButtons() {
        this.container.querySelectorAll('.btn-primary, .btn.primary').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
    }
}