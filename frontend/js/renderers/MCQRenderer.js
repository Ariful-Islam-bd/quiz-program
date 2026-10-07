// frontend/js/renderers/MCQRenderer.js
// Version: 4.0.0 - Review Mode Support Added

import { BaseRenderer } from './BaseRenderer.js';
import { ANSWER_STATUS } from '../utils/constants.js';

export class MCQRenderer extends BaseRenderer {
    constructor(container, quizEngine, options = {}) {
        super(container, quizEngine);
        this.currentOptions = [];
        this.currentULs = [];
        this.pendingGroupData = null;
        
        // ✅ Review mode config
        this.mode = options.mode || 'quiz';           // 'quiz' | 'review'
        this.readOnly = options.readOnly || false;
        this.showCorrectAnswer = options.showCorrectAnswer !== false;
        this.showUserAnswer = options.showUserAnswer !== false;
        this.showExplanationBtn = options.showExplanationBtn !== false;
        this.showStatusBadge = options.showStatusBadge !== false;
        
        // ✅ Review mode-এ কোনো event binding হবে না
        this.isReviewMode = this.mode === 'review';
    }

    // ============================================================
    // ✅ Main render — Quiz ও Review উভয়ের জন্য
    // ============================================================
    render(question, onAnswered) {
        this.clear();
        this.currentOptions = [];
        this.currentULs = [];
        this.pendingGroupData = null;
        
        const wrapper = this.createElement('div', this.isReviewMode ? 'mcq-review-wrapper' : 'mcq-wrapper');
        
        // ✅ Stimulant (group question-এর ক্ষেত্রে)
        if (question.stimulant) {
            const el = this.renderStimulant(question.stimulant);
            if (el) wrapper.appendChild(el);
        }
        
        const questions = question.isGroup ? question.questions : [question.questions[0]];
        questions.forEach(subQ => {
            this.renderSubQuestion(subQ, onAnswered, wrapper, question.isGroup);
        });
        
        this.container.appendChild(wrapper);
    }

    // ============================================================
    // ✅ Sub-question render — Quiz এবং Review মোডে কাজ করে
    // ============================================================
    renderSubQuestion(subQ, onAnswered, parentWrapper, isGroup = false) {
        const card = this.createElement('div', this.isReviewMode ? 'review-card' : 'question-card');
        card.dataset.subId = subQ.subId || subQ.numid;

        // ============================================================
        // ✅ Header (serial + question text)
        // ============================================================
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid || subQ.serialNumber}.</b>`;
        header.appendChild(serial);
        
        const text = this.createElement('div', 'question-text-content');
        text.innerHTML = subQ.q;
        header.appendChild(text);
        
        // ✅ Review mode-এ status badge header-এ
        if (this.isReviewMode && this.showStatusBadge) {
            const badge = this.createStatusBadge(subQ.status);
            if (badge) header.appendChild(badge);
        }
        
        card.appendChild(header);

        // ============================================================
        // ✅ Options Container
        // ============================================================
        const optDiv = this.createElement('div', 'options-container');
        const ul = this.createElement('ul', 'options');
        ul.dataset.numid = subQ.numid;
        this.currentULs.push(ul);

        const options = subQ.options || [];
        const correctIdx = (subQ.answer || [])[0];

        // ✅ Quiz mode-এ option shuffle করুন (এবং shuffledIndices সেভ করুন)
        //    Review mode-এ shuffledIndices reuse করুন (consistency)
        let indices;
        if (this.isReviewMode && subQ.shuffledIndices && Array.isArray(subQ.shuffledIndices)) {
            indices = subQ.shuffledIndices;
        } else {
            indices = options.map((_, i) => i);
            if (!this.isReviewMode) {
                this.shuffleArray(indices);
            }
            subQ.shuffledIndices = indices;
        }

        let answered = false;

        indices.forEach(origIdx => {
            const li = this.createElement('li', 'option', options[origIdx]);
            li.dataset.originalIndex = origIdx;

            // ✅ Review mode-এ highlight apply করুন
            if (this.isReviewMode) {
                this.applyReviewHighlight(li, origIdx, correctIdx, subQ);
            } else {
                // ✅ Quiz mode-এ interactive
                li.tabIndex = 0;
                li.setAttribute('role', 'button');

                li.addEventListener('click', () => {
                    if (answered || this.isQuestionLocked(subQ) || this.isTimerExpired()) return;
                    answered = true;

                    const isCorrect = origIdx === correctIdx;
                    if (isCorrect) {
                        this.quizEngine?.soundManager?.play('correct');
                    } else {
                        this.quizEngine?.soundManager?.play('wrong');
                    }

                    li.classList.add(isCorrect ? 'correct' : 'wrong');
                    this.quizEngine.answerQuestion(subQ.numid, origIdx, isCorrect);
                    if (!isCorrect) this.highlightCorrectAnswer(ul, options, correctIdx, indices);
                    this.disableAllOptions(ul);
                    if (onAnswered) onAnswered(isCorrect);
                    isGroup ? this.checkGroupCompletion(onAnswered) : this.checkAndShowNextButton();
                });

                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        li.click();
                    }
                });
            }

            this.currentOptions.push(li);
            ul.appendChild(li);
        });

        optDiv.appendChild(ul);
        card.appendChild(optDiv);

        // ============================================================
        // ✅ Explanation Button Container
        // ============================================================
        const btnContainer = this.createElement('div', 'mcq-button-container');
        
        if (this.showExplanationBtn) {
            const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
                // ✅ ব্যাখ্যা সবসময় clickable — quiz এবং review উভয় mode-এ
                if (this.isReviewMode) {
                    // ✅ Review mode: সরাসরি modal দেখান (কোনো auto-submit নেই)
                    this.showExplanationModal(
                        'ব্যাখ্যা',
                        this.generateUnifiedExplanation(subQ, { showNotice: false, isGroup: false })
                    );
                    return;
                }
                
                // ✅ Quiz mode: existing logic
                if (subQ.status !== ANSWER_STATUS.UNANSWERED) {
                    this.showExplanationModal(
                        'ব্যাখ্যা',
                        this.generateUnifiedExplanation(subQ, { showNotice: false })
                    );
                    return;
                }
                
                this.showExplanationAndAutoSubmit(
                    subQ,
                    () => this.markAsSkipped(subQ, ul, onAnswered, isGroup),
                    () => this.generateUnifiedExplanation(subQ, { showNotice: true, isGroup })
                );
            });
            
            // ✅ Review mode-এ explanation button-এর জন্য data attribute
            if (this.isReviewMode) {
                explainBtn.dataset.reviewAction = 'explain';
                explainBtn.dataset.subId = subQ.subId || subQ.numid;
            }
            
            btnContainer.appendChild(explainBtn);
        }
        
        card.appendChild(btnContainer);
        parentWrapper.appendChild(card);
    }

    // ============================================================
    // ✅ Review Mode: Option Highlight Apply
    // ============================================================
    applyReviewHighlight(li, origIdx, correctIdx, subQ) {
        const isCorrectOption = origIdx === correctIdx;
        const userAnswer = subQ.userAnswer;
        const isUserSelected = userAnswer === origIdx;

        // ✅ Case 1: সঠিক উত্তর (সবসময় সবুজ দেখাবে)
        if (isCorrectOption) {
            li.classList.add('correct');
            // ✅ যদি user এটাই সিলেক্ট করে থাকে — special marker
            if (isUserSelected) {
                li.classList.add('user-correct');
                li.setAttribute('data-label', '✓ আপনার সঠিক উত্তর');
            } else {
                li.setAttribute('data-label', '✓ সঠিক উত্তর');
            }
            return;
        }

        // ✅ Case 2: User-এর ভুল উত্তর
        if (this.showUserAnswer && isUserSelected && !isCorrectOption) {
            li.classList.add('wrong');
            li.setAttribute('data-label', '✗ আপনার উত্তর (ভুল)');
            return;
        }

        // ✅ Case 3: untouched option
        li.classList.add('disabled');
    }

    // ============================================================
    // ✅ Review Mode: Status Badge তৈরি
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
    // ✅ বাকি সব মেথড অপরিবর্তিত (Quiz mode-এর জন্য)
    // ============================================================
    handleGroupExplanationClose() {
        if (!this.pendingGroupData) return;
        const { subQ, ul, onAnswered } = this.pendingGroupData;
        if (subQ?.status === ANSWER_STATUS.UNANSWERED) {
            subQ.status = ANSWER_STATUS.SKIPPED;
            subQ.userAnswer = null;
            this.quizEngine.answerQuestion(subQ.numid, null, false);
            this.disableAllOptions(ul);
            if (onAnswered && this.quizEngine?.getCurrentQuestion()) onAnswered(false);
        }
        setTimeout(() => {
            if (!this.quizEngine?.getCurrentQuestion()) { this.pendingGroupData = null; return; }
            const item = this.quizEngine.getCurrentQuestion();
            if (!item?.isGroup) { this.pendingGroupData = null; return; }
            const hasUnanswered = item.questions.some(q => q.status === ANSWER_STATUS.UNANSWERED);
            const skipBtn = document.getElementById('skipBtn');
            const nextBtn = document.getElementById('nextBtn');
            if (hasUnanswered) {
                if (this.quizEngine.resumeTimer) this.quizEngine.resumeTimer();
                if (this.quizEngine._timer?.resume) this.quizEngine._timer.resume();
                if (skipBtn) skipBtn.disabled = false;
                if (nextBtn) nextBtn.style.display = 'none';
            } else {
                if (skipBtn) skipBtn.disabled = true;
                if (nextBtn) nextBtn.style.display = 'block';
            }
            this.pendingGroupData = null;
        }, 50);
    }

    markAsSkipped(subQ, ul, onAnswered, isGroup = false) {
        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;
        subQ.status = ANSWER_STATUS.SKIPPED;
        subQ.userAnswer = null;
        this.quizEngine.answerQuestion(subQ.numid, null, false);
        this.disableAllOptions(ul);
        if (onAnswered && this.quizEngine?.getCurrentQuestion()) onAnswered(false);
    }

    checkGroupCompletion(onAnswered) {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) return;
        if (this.quizEngine.isGroupComplete()) {
            this.showNextButton();
            this.setSkipButtonDisabled(true);
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            if (onAnswered) onAnswered(true);
        }
    }

    isTimerExpired() {
        return this.quizEngine.isTimerExpired ? this.quizEngine.isTimerExpired() : false;
    }

    handleTimeout() {
        this.disableAllOptions(this.container);
        const question = this.quizEngine.getCurrentQuestion();
        if (question) {
            const questions = question.isGroup ? question.questions : [question.questions[0]];
            questions.forEach(subQ => {
                if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                    const ul = this.container.querySelector(`ul.options[data-numid="${subQ.numid}"]`);
                    if (ul) {
                        const correctIdx = subQ.answer[0];
                        const indices = subQ.shuffledIndices || subQ.options.map((_, i) => i);
                        this.highlightCorrectAnswer(ul, subQ.options, correctIdx, indices);
                    }
                }
            });
        }
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

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    isQuestionLocked(subQ) {
        return [ANSWER_STATUS.TIMED_OUT, ANSWER_STATUS.CORRECT, ANSWER_STATUS.WRONG, ANSWER_STATUS.SKIPPED].includes(subQ.status);
    }

    highlightCorrectAnswer(container, options, correctIdx, shuffledIndices) {
        const items = container.children;
        for (let i = 0; i < items.length; i++) {
            const origIdx = shuffledIndices ? shuffledIndices[i] : i;
            if (origIdx === correctIdx) {
                items[i].classList.add('correct');
                break;
            }
        }
    }

    disableAllOptions(container) {
        container.querySelectorAll('.option').forEach(li => {
            li.classList.add('disabled');
            li.style.pointerEvents = 'none';
        });
    }

    checkAndShowNextButton() {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item) return;
        if (item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED)) {
            this.showNextButton();
            this.setSkipButtonDisabled(true);
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
        }
    }
}