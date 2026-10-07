// frontend/js/renderers/BlankRenderer.js
// Version: 2.5.0 - Optimized

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

export class BlankRenderer extends BaseRenderer {
    constructor(container, quizEngine, options = {}) {
        super(container, quizEngine);
        this.draggedOption = null;
        this.selectedOption = null;
        this.optionState = new Map();
        this.currentBlankBoxes = [];
        this.currentSubmitBtn = null;
        this.dropRadius = 30;
        this.isDraggingCustom = false;
        this.dragGhost = null;
        this.ghostOffsetX = 0;
        this.ghostOffsetY = 0;
        this.currentHoverBox = null;
        this.dragThreshold = 8;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.potentialDrag = false;
        this.touchTimer = null;
        this.activeOptionsPanel = null;
        this.activeBlankBoxes = [];
        this.activeSubQ = null;
        this.activeOnAnswered = null;
        this.activeSubmitBtn = null;
        this.isMovingPlaced = false;
        this.sourceBox = null;
        this.sourceBlankIdx = null;
        this.resetButtons = [];
        this.currentResetBtn = null;

        // ✅ Review mode config
        this.mode = options.mode || 'quiz';           // 'quiz' | 'review'
        this.isReviewMode = this.mode === 'review';
        this.readOnly = this.isReviewMode || (options.readOnly || false);
        this._dragListeners = {
            blankAreaMouseDown: null,
            blankAreaTouchStart: null,
            optionsPanelMouseDown: null,
            optionsPanelTouchStart: null,
            windowMouseMove: null,
            windowMouseUp: null,
            windowTouchMove: null,
            windowTouchEnd: null
        };
    }

    render(question, onAnswered) {
        this.clear();
        const wrapper = this.createElement(
            'div',
            this.isReviewMode ? 'blank-review-wrapper' : 'blank-renderer-wrapper'
        );

        if (question.stimulant) {
            const el = this.renderStimulant(question.stimulant);
            if (el) wrapper.appendChild(el);
        }

        const questions = question.isGroup ? question.questions : [question.questions[0]];
        questions.forEach(subQ => {
            const t = normalizeType(subQ.type);
            if (t === TYPE_KEY.BLANK_TYPE_A) {
                if (this.isReviewMode) this.renderBlankTypeAReview(subQ, wrapper);
                else this.renderBlankTypeA(subQ, onAnswered, wrapper);
            } else if (t === TYPE_KEY.BLANK_TYPE_B) {
                if (this.isReviewMode) this.renderBlankTypeBReview(subQ, wrapper);
                else this.renderBlankTypeB(subQ, onAnswered, wrapper);
            } else if (t === TYPE_KEY.BLANK_SUFFIX_PREFIX) {
                if (this.isReviewMode) this.renderSuffixPrefixReview(subQ, wrapper);
                else this.renderBlankSuffixPrefix(subQ, onAnswered, wrapper);
            }
        });
        this.container.appendChild(wrapper);
    }

/*    render(question, onAnswered) {
        this.clear();
        const wrapper = this.createElement(
            'div',
            this.isReviewMode ? 'blank-review-wrapper' : 'blank-renderer-wrapper'
        );

        if (question.stimulant) {
            const el = this.renderStimulant(question.stimulant);
            if (el) wrapper.appendChild(el);
        }

        const questions = question.isGroup ? question.questions : [question.questions[0]];
        questions.forEach(subQ => {
            if (subQ.type === 'Blank-Type-A') {
                if (this.isReviewMode) {
                    this.renderBlankTypeAReview(subQ, wrapper);
                } else {
                    this.renderBlankTypeA(subQ, onAnswered, wrapper);
                }
            } else if (subQ.type === 'Blank-Type-B') {
                if (this.isReviewMode) {
                    this.renderBlankTypeBReview(subQ, wrapper);
                } else {
                    this.renderBlankTypeB(subQ, onAnswered, wrapper);
                }
            } else if (subQ.type === 'Blank-Suffix-Prefix') {
                if (this.isReviewMode) {
                    this.renderSuffixPrefixReview(subQ, wrapper);
                } else {
                    this.renderBlankSuffixPrefix(subQ, onAnswered, wrapper);
                }
            }
        });
        this.container.appendChild(wrapper);
    }*/

    renderBlankTypeAReview(subQ, parentWrapper) {
        const card = this.createElement('div', 'review-card blank-type-a-review-card');

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
        // ✅ Helper: Resolve display text from any value type
        // ============================================================
        const resolveDisplayText = (value) => {
            if (value === null || value === undefined || value === '') return '';
            if (typeof value === 'number' && subQ.options?.[value] !== undefined) {
                return String(subQ.options[value]).replace(/{|:\d+}/g, '');
            }
            // ✅ If value is a string that looks like an option index, resolve it
            if (typeof value === 'string' && /^\d+$/.test(value)) {
                const idx = parseInt(value, 10);
                if (subQ.options?.[idx] !== undefined) {
                    return String(subQ.options[idx]).replace(/{|:\d+}/g, '');
                }
            }
            return String(value);
        };

        // ============================================================
        // ✅ ২. Question Text with Blanks (blank-area — tooltip here)
        // ============================================================
        const blankArea = this.createElement('div', 'blank-area review-blank-area locked');
        blankArea.innerHTML = this.generateQuestionHTML(subQ);

        const reviewBlankBoxes = blankArea.querySelectorAll('.blank-box');
        const userAnswers = subQ.userAnswer || [];
        const correctAnswers = subQ.answer || [];

        reviewBlankBoxes.forEach((box, idx) => {
            const userValue = userAnswers[idx];
            const correctValue = correctAnswers[idx];

            if (userValue === null || userValue === undefined || userValue === '') {
                box.classList.add('review-empty');
                box.textContent = '—';
            } else {
                const isCorrect = this._isBlankTypeAAnswerCorrect(userValue, correctValue);
                const displayText = resolveDisplayText(userValue);

                box.textContent = displayText;
                box.classList.add('review-filled');
                box.classList.add(isCorrect ? 'correct' : 'wrong');
            }

            box.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(box.dataset.blankIndex);
                if (!isNaN(idx)) {
                    this.showBlankTooltip(box, subQ.explain, idx);
                }
            });
        });

        card.appendChild(blankArea);

        // ============================================================
        // ✅ ৩. Answer Comparison Box
        // ============================================================
        const comparisonBox = this.createElement('div', 'blank-comparison-box');

        // Marks display
        const marksDisplay = this.createElement('div', 'blank-marks-display');
        const earnedMarks = this._calculateEarnedMarks(subQ);
        const totalMarks = subQ.marks || 1;
        marksDisplay.innerHTML = `প্রাপ্ত: <strong>${earnedMarks.toFixed(2)}</strong> / ${totalMarks.toFixed(2)}`;
        comparisonBox.appendChild(marksDisplay);

        // ✅ User row
        const userRow = this.createElement('div', 'blank-row user-row');
        const userLabel = this.createElement('div', 'blank-row-label', '👤 আপনি উত্তর দিয়েছিলেন:');
        userRow.appendChild(userLabel);

        const userBoxesWrapper = this.createElement('div', 'blank-boxes-wrapper');
        const totalBlanks = correctAnswers.length;

        for (let i = 0; i < totalBlanks; i++) {
            const box = this.createElement('div', 'review-blank-box');
            const userValue = userAnswers[i];
            const correctValue = correctAnswers[i];

            if (userValue === null || userValue === undefined || userValue === '') {
                box.classList.add('empty');
                box.textContent = '—';
                box.setAttribute('title', 'আপনি এই ঘরটি খালি রেখেছিলেন');
            } else {
                const isCorrect = this._isBlankTypeAAnswerCorrect(userValue, correctValue);
                const displayText = resolveDisplayText(userValue);

                box.textContent = displayText;
                box.classList.add(isCorrect ? 'correct' : 'wrong');
                box.setAttribute('title', isCorrect ? 'সঠিক ✓' : 'ভুল ✗');
            }

            userBoxesWrapper.appendChild(box);
        }
        userRow.appendChild(userBoxesWrapper);
        comparisonBox.appendChild(userRow);

        // Separator
        const separator = this.createElement('div', 'blank-row-separator');
        comparisonBox.appendChild(separator);

        // ============================================================
        // ✅ ৪. Correct answer row — ✅ FIX: Resolve from options
        // ============================================================
        const correctRow = this.createElement('div', 'blank-row correct-row');
        const correctLabel = this.createElement('div', 'blank-row-label', '✅ সঠিক উত্তরের ক্রম:');
        correctRow.appendChild(correctLabel);

        const correctBoxesWrapper = this.createElement('div', 'blank-boxes-wrapper');

        for (let i = 0; i < totalBlanks; i++) {
            const box = this.createElement('div', 'review-blank-box correct-answer');
            const correctValue = correctAnswers[i];

            // ✅ FIX: Properly resolve the answer text (index → option text)
            const displayText = resolveDisplayText(correctValue);

            box.textContent = displayText;
            box.setAttribute('title', 'সঠিক উত্তর');

            correctBoxesWrapper.appendChild(box);
        }

        correctRow.appendChild(correctBoxesWrapper);
        comparisonBox.appendChild(correctRow);

        card.appendChild(comparisonBox);

        // ============================================================
        // ✅ ৫. Explanation Button
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

    renderBlankTypeBReview(subQ, parentWrapper) {
        const card = this.createElement('div', 'review-card blank-type-b-review-card');

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
        // ✅ ২. Question Text with Blanks (blank-area — ✅ tooltip here)
        // ============================================================
        const blankArea = this.createElement('div', 'blank-area review-blank-area blankb-review-area locked');
        blankArea.innerHTML = this.generateBlankBReviewHTML(subQ);

        const reviewBlankBoxes = blankArea.querySelectorAll('.blank-box');
        const userAnswers = subQ.userAnswer || [];
        const correctAnswers = subQ.answer || [];

        reviewBlankBoxes.forEach((box, idx) => {
            const userValue = userAnswers[idx];
            const correctValue = correctAnswers[idx];

            // ✅ 3-state classification
            if (userValue === null || userValue === undefined || userValue === '') {
                // ✅ State 1: খালি box
                box.classList.add('review-empty');
                box.textContent = '—';
            } else {
                // ✅ Answer correctness check — Blank-Type-B: string comparison (case-insensitive)
                const isCorrect = this._isBlankTypeBAnswerCorrect(userValue, correctValue);
                
                box.textContent = String(userValue);
                box.classList.add('review-filled');
                box.classList.add(isCorrect ? 'correct' : 'wrong');
            }

            // ✅ Tooltip binding — শুধু blank-area-তে
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(box.dataset.blankIndex);
                if (!isNaN(idx)) {
                    this.showBlankTooltip(box, subQ.explain, idx);
                }
            });
        });

        card.appendChild(blankArea);

        // ============================================================
        // ✅ ৩. Answer Comparison Box
        // ============================================================
        const comparisonBox = this.createElement('div', 'blank-comparison-box');

        // Marks display
        const marksDisplay = this.createElement('div', 'blank-marks-display');
        const earnedMarks = this._calculateEarnedMarksBlankB(subQ);
        const totalMarks = subQ.marks || 1;
        marksDisplay.innerHTML = `প্রাপ্ত: <strong>${earnedMarks.toFixed(2)}</strong> / ${totalMarks.toFixed(2)}`;
        comparisonBox.appendChild(marksDisplay);

        // ✅ User row
        const userRow = this.createElement('div', 'blank-row user-row');
        const userLabel = this.createElement('div', 'blank-row-label', '👤 আপনি উত্তর দিয়েছিলেন:');
        userRow.appendChild(userLabel);

        const userBoxesWrapper = this.createElement('div', 'blank-boxes-wrapper');
        const totalBlanks = correctAnswers.length;

        for (let i = 0; i < totalBlanks; i++) {
            const box = this.createElement('div', 'review-blank-box');
            const userValue = userAnswers[i];
            const correctValue = correctAnswers[i];

            if (userValue === null || userValue === undefined || userValue === '') {
                box.classList.add('empty');
                box.textContent = '—';
                box.setAttribute('title', 'আপনি এই ঘরটি খালি রেখেছেন');
            } else {
                const isCorrect = this._isBlankTypeBAnswerCorrect(userValue, correctValue);
                
                box.textContent = String(userValue);
                box.classList.add(isCorrect ? 'correct' : 'wrong');
                box.setAttribute('title', isCorrect ? 'সঠিক ✓' : 'ভুল ✗');
            }

            userBoxesWrapper.appendChild(box);
        }
        userRow.appendChild(userBoxesWrapper);
        comparisonBox.appendChild(userRow);

        // Separator
        const separator = this.createElement('div', 'blank-row-separator');
        comparisonBox.appendChild(separator);

        // ✅ Correct row
        const correctRow = this.createElement('div', 'blank-row correct-row');
        const correctLabel = this.createElement('div', 'blank-row-label', '✅ সঠিক উত্তরের ক্রম:');
        correctRow.appendChild(correctLabel);

        const correctBoxesWrapper = this.createElement('div', 'blank-boxes-wrapper');
        for (let i = 0; i < totalBlanks; i++) {
            const box = this.createElement('div', 'review-blank-box correct-answer');
            const correctValue = correctAnswers[i];

            box.textContent = String(correctValue || '');
            box.setAttribute('title', 'সঠিক উত্তর');

            correctBoxesWrapper.appendChild(box);
        }
        correctRow.appendChild(correctBoxesWrapper);
        comparisonBox.appendChild(correctRow);

        card.appendChild(comparisonBox);

        // ============================================================
        // ✅ ৪. Explanation Button
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
    // ✅ ✅ ✅ NEW: Blank-Suffix-Prefix Review Mode Render
    // ============================================================
    renderSuffixPrefixReview(subQ, parentWrapper) {
        const card = this.createElement('div', 'review-card blank-suffix-prefix-review-card');

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
        // ✅ Helper: Resolve display text from answer value
        // ============================================================
        const resolveDisplayText = (value) => {
            if (value === null || value === undefined || value === '') return '';
            return String(value).trim();
        };

        // ============================================================
        // ✅ ২. Question Text with Blanks (blank-area — tooltip here)
        // ============================================================
        const blankArea = this.createElement('div', 'blank-area review-blank-area suffix-prefix-review-area locked');
        blankArea.innerHTML = this.generateSuffixPrefixReviewHTML(subQ);

        const reviewBlankBoxes = blankArea.querySelectorAll('.blank-box');
        const userAnswers = subQ.userAnswer || [];
        const correctAnswers = subQ.answer || [];

        reviewBlankBoxes.forEach((box, idx) => {
            const userValue = userAnswers[idx];
            const correctValue = correctAnswers[idx];

            if (userValue === null || userValue === undefined || userValue === '') {
                box.classList.add('review-empty');
                box.textContent = '—';
            } else {
                const isCorrect = this._isSuffixPrefixAnswerCorrect(userValue, correctValue);
                const displayText = resolveDisplayText(userValue);

                box.textContent = displayText;
                box.classList.add('review-filled');
                box.classList.add(isCorrect ? 'correct' : 'wrong');
            }

            // ✅ Tooltip binding — quiz-এর মতোই
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(box.dataset.blankIndex);
                if (!isNaN(idx)) {
                    this.showBlankTooltip(box, subQ.explain, idx);
                }
            });
        });

        card.appendChild(blankArea);

        // ============================================================
        // ✅ ৩. Comparison Box — 3-column layout (User | Correct | Root)
        // ============================================================
        const comparisonBox = this.createElement('div', 'blank-comparison-box suffix-prefix-comparison-box');

        // Marks display
        const marksDisplay = this.createElement('div', 'blank-marks-display');
        const earnedMarks = this._calculateEarnedMarksSuffixPrefix(subQ);
        const totalMarks = subQ.marks || 1;
        marksDisplay.innerHTML = `প্রাপ্ত: <strong>${earnedMarks.toFixed(2)}</strong> / ${totalMarks.toFixed(2)}`;
        comparisonBox.appendChild(marksDisplay);

        const totalBlanks = correctAnswers.length;

        // ✅ Column headers
        const headerRow = this.createElement('div', 'suffix-prefix-header-row');
        headerRow.innerHTML = `
            <div class="sp-header-cell">🌱 Root Word</div>
            <div class="sp-header-cell">✅ সঠিক উত্তর</div>
            <div class="sp-header-cell">👤 আপনার উত্তর</div>
            
        `;
        comparisonBox.appendChild(headerRow);

        // ✅ Data rows
        const rowsContainer = this.createElement('div', 'suffix-prefix-rows-container');

        // ✅ Extract root words from subQ.q via regex matching
        const rootWords = [];
        if (subQ.q) {
            const regex = /\(([^)]+)\)/g;
            let match;
            while ((match = regex.exec(subQ.q)) !== null) {
                rootWords.push(match[1]);
            }
        }

        for (let i = 0; i < totalBlanks; i++) {
            const userValue = userAnswers[i];
            const correctValue = correctAnswers[i];
            const rootWord = rootWords[i] || '—';

            const row = this.createElement('div', 'suffix-prefix-row');

            // ✅ Root word cell
            const rootCell = this.createElement('div', 'sp-cell sp-root-cell');
            rootCell.textContent = `(${rootWord})`;
            row.appendChild(rootCell);

            // ✅ Correct cell
            const correctCell = this.createElement('div', 'sp-cell sp-correct-cell');
            correctCell.textContent = resolveDisplayText(correctValue);
            row.appendChild(correctCell);

            // ✅ User cell
            const userCell = this.createElement('div', 'sp-cell sp-user-cell');
            if (userValue === null || userValue === undefined || userValue === '') {
                userCell.classList.add('empty');
                userCell.textContent = '—';
            } else {
                const isCorrect = this._isSuffixPrefixAnswerCorrect(userValue, correctValue);
                userCell.textContent = resolveDisplayText(userValue);
                userCell.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            row.appendChild(userCell);
            rowsContainer.appendChild(row);
        }

        comparisonBox.appendChild(rowsContainer);
        card.appendChild(comparisonBox);

        // ============================================================
        // ✅ ৪. Explanation Button
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

    generateBlankBReviewHTML(subQ) {
        const questionText = subQ.q || '';
        let blankIndex = 0;
        return questionText.replace(/____/g, () => {
            const idx = blankIndex++;
            return `<span class="blank-wrapper">
                <span class="blank-box" data-blank-index="${idx}"></span>
                <sub class="blank-number">${idx + 1}</sub>
            </span>`;
        });
    }

    _isBlankTypeBAnswerCorrect(userAnswer, correctAnswer) {
        if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;
        const user = String(userAnswer).trim().toLowerCase();
        const correct = String(correctAnswer || '').trim().toLowerCase();
        return user === correct;
    }

    _calculateEarnedMarksBlankB(subQ) {
        // ✅ যদি engine-এ earned marks ইতোমধ্যে সেভ করা থাকে
        if (typeof subQ.earnedMarks === 'number') {
            return subQ.earnedMarks;
        }

        // ✅ Fallback: manual calculation
        const answers = subQ.answer || [];
        const userAnswers = subQ.userAnswer || [];
        const total = answers.length;
        if (total === 0) return 0;

        let correctCount = 0;
        for (let i = 0; i < total; i++) {
            if (this._isBlankTypeBAnswerCorrect(userAnswers[i], answers[i])) {
                correctCount++;
            }
        }
        const marksPerBlank = (subQ.marks || 1) / total;
        return correctCount * marksPerBlank;
    }

    _isSuffixPrefixAnswerCorrect(userAnswer, correctAnswer) {
        if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;
        const user = String(userAnswer).trim().toLowerCase();
        const correct = String(correctAnswer || '').trim().toLowerCase();
        return user === correct;
    }

    _calculateEarnedMarksSuffixPrefix(subQ) {
        if (typeof subQ.earnedMarks === 'number') {
            return subQ.earnedMarks;
        }

        const answers = subQ.answer || [];
        const userAnswers = subQ.userAnswer || [];
        const total = answers.length;
        if (total === 0) return 0;

        let correctCount = 0;
        for (let i = 0; i < total; i++) {
            if (this._isSuffixPrefixAnswerCorrect(userAnswers[i], answers[i])) {
                correctCount++;
            }
        }
        const marksPerBlank = (subQ.marks || 1) / total;
        return correctCount * marksPerBlank;
    }

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

    _calculateEarnedMarks(subQ) {
        // ✅ যদি engine-এ earned marks ইতোমধ্যে সেভ করা থাকে
        if (typeof subQ.earnedMarks === 'number') {
            return subQ.earnedMarks;
        }

        // ✅ Fallback: manual calculation
        const answers = subQ.answer || [];
        const userAnswers = subQ.userAnswer || [];
        const total = answers.length;
        if (total === 0) return 0;

        let correctCount = 0;
        for (let i = 0; i < total; i++) {
            if (this._isBlankTypeAAnswerCorrect(userAnswers[i], answers[i])) {
                correctCount++;
            }
        }
        const marksPerBlank = (subQ.marks || 1) / total;
        return correctCount * marksPerBlank;
    }

    _isBlankTypeAAnswerCorrect(userAnswer, correctAnswer) {
        if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;
        // Blank-Type-A-তে userAnswer হলো originalIndex (number)
        return parseInt(userAnswer) === parseInt(correctAnswer);
    }

    renderBlankTypeA(subQ, onAnswered, parentWrapper) {
        const card = this.createElement('div', 'question-card blank-type-a-card');
        
        // ============================================================
        // ✅ Header (serial + instruction + question text)
        // ============================================================
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid || subQ.serialNumber}.</b>`;
        header.appendChild(serial);

        if (subQ.instruction) {
            header.appendChild(this.createElement('div', 'instruction-text', subQ.instruction));
        } else {
            const qt = this.createElement('div', 'question-text-content');
            qt.innerHTML = subQ.q;
            header.appendChild(qt);
        }
        card.appendChild(header);

        // ============================================================
        // ✅ Blank area with question text
        // ============================================================
        const blankArea = this.createElement('div', 'blank-area active');
        blankArea.innerHTML = this.generateQuestionHTML(subQ);
        card.appendChild(blankArea);

        const blankBoxes = Array.from(blankArea.querySelectorAll('.blank-box'));
        this.currentBlankBoxes.push(...blankBoxes);

        // ✅ Reset userAnswer
        subQ.userAnswer = new Array(blankBoxes.length).fill(null);

        // ============================================================
        // ✅ Options panel
        // ============================================================
        const optionsPanel = this.createElement('div', 'blank-options-panel');
        this.optionState.clear();

        const options = this.processOptions(subQ.options || []);
        const shuffled = this.shuffleArray([...options]);

        shuffled.forEach(opt => {
            const el = this.createOptionElement(opt);
            optionsPanel.appendChild(el);
            this.optionState.set(opt.text, {
                text: opt.text,
                total: opt.count,
                available: opt.count,
                originalIndex: opt.originalIndex,
                isMultiple: opt.isMultiple
            });
        });
        card.appendChild(optionsPanel);

        // ============================================================
        // ✅ Button container (reset + submit + explain)
        // ============================================================
        const btnContainer = this.createElement('div', 'blank-button-container');

        // ✅ Reset button
        const resetBtn = this.createButton('রিসেট', 'btn-secondary', () =>
            this.resetBlankBoxes(blankBoxes, optionsPanel, subQ)
        );
        this.resetButtons.push(resetBtn);
        this.currentResetBtn = resetBtn;
        btnContainer.appendChild(resetBtn);

        // ✅ Submit button
        const submitBtn = this.createButton('সাবমিট', 'btn-primary', () => {
            if (submitBtn.disabled) return;
            this.handleSubmitBlankA(subQ, blankBoxes, onAnswered, submitBtn);
        });
        this.currentSubmitBtn = submitBtn;
        btnContainer.appendChild(submitBtn);

        resetBtn.disabled = submitBtn.disabled;

        // ✅ Explanation button
        const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
            const isGroup = this.quizEngine.getCurrentQuestion()?.isGroup || false;
            if (subQ.status !== ANSWER_STATUS.UNANSWERED) {
                this.showExplanationModal(
                    'ব্যাখ্যা',
                    this.generateUnifiedExplanation(subQ, { showNotice: false, isGroup: false })
                );
                return;
            }
            this.showExplanationAndAutoSubmit(
                subQ,
                () => this.handleSubmitBlankA(subQ, blankBoxes, onAnswered, submitBtn),
                () => this.generateUnifiedExplanation(subQ, { showNotice: true, isGroup })
            );
        });
        btnContainer.appendChild(explainBtn);

        card.appendChild(btnContainer);

        // ============================================================
        // ✅ Drag & Drop setup
        // ============================================================
        this.setupCustomDragAndDrop(blankArea, optionsPanel, blankBoxes, subQ, submitBtn);

        parentWrapper.appendChild(card);
    }

    renderBlankTypeB(subQ, onAnswered, parentWrapper) {
        const card = this.createElement('div', 'question-card blank-type-b-card');
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid}.</b>`;
        header.appendChild(serial);
        if (subQ.instruction) header.appendChild(this.createElement('div', 'instruction-text', subQ.instruction));
        else {
            const qt = this.createElement('div', 'question-text-content');
            qt.innerHTML = subQ.q;
            header.appendChild(qt);
        }
        card.appendChild(header);
        const blankArea = this.createElement('div', 'blank-area blankb-area');
        blankArea.innerHTML = this.generateBlankBHTML(subQ);
        card.appendChild(blankArea);
        const inputs = Array.from(blankArea.querySelectorAll('.blankb-input'));
        subQ.userAnswer = new Array(inputs.length).fill('');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                subQ.userAnswer[index] = e.target.value.trim();
                this.resizeBlankBInput(input);
            });
            this.resizeBlankBInput(input);
            input.addEventListener('click', (e) => {
                if (!input.readOnly) return;
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(input.dataset.blankIndex);
                if (!isNaN(idx)) this.showInputTooltip(input, subQ.explain, idx);
            });
        });
        const btnContainer = this.createElement('div', 'blank-button-container');
        const submitBtn = this.createButton('সাবমিট', 'btn-primary', () => {
            if (submitBtn.disabled) return;
            this.handleSubmitBlankB(subQ, inputs, onAnswered, submitBtn);
        });
        this.currentSubmitBtn = submitBtn;
        btnContainer.appendChild(submitBtn);
        const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
            const isGroup = this.quizEngine.getCurrentQuestion()?.isGroup || false;
            if (subQ.status !== ANSWER_STATUS.UNANSWERED) {
                this.showExplanationModal('ব্যাখ্যা', this.generateUnifiedExplanation(subQ, { showNotice: false, isGroup: false, inputs }));
                return;
            }
            this.showExplanationAndAutoSubmit(
                subQ,
                () => this.handleSubmitBlankB(subQ, inputs, onAnswered, submitBtn),
                () => this.generateUnifiedExplanation(subQ, { showNotice: true, isGroup, inputs })
            );
        });
        btnContainer.appendChild(explainBtn);
        card.appendChild(btnContainer);
        parentWrapper.appendChild(card);
    }

    renderBlankSuffixPrefix(subQ, onAnswered, parentWrapper) {
        const card = this.createElement('div', 'question-card blank-suffix-prefix-card');
        const header = this.createElement('div', 'question-header-wrapper');
        const serial = this.createElement('span', 'question-serial-number');
        serial.innerHTML = `<b>${subQ.numid}.</b>`;
        header.appendChild(serial);
        if (subQ.instruction) header.appendChild(this.createElement('div', 'instruction-text', subQ.instruction));
        else {
            const qt = this.createElement('div', 'question-text-content');
            qt.innerHTML = subQ.q;
            header.appendChild(qt);
        }
        card.appendChild(header);
        const blankArea = this.createElement('div', 'blank-area suffix-prefix-area');
        blankArea.innerHTML = this.generateSuffixPrefixHTML(subQ);
        card.appendChild(blankArea);
        const inputs = Array.from(blankArea.querySelectorAll('.suffix-prefix-input'));
        subQ.userAnswer = new Array(inputs.length).fill('');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                subQ.userAnswer[index] = e.target.value.trim();
                this.resizeSuffixPrefixInput(input);
            });
            this.resizeSuffixPrefixInput(input);
            input.addEventListener('click', (e) => {
                if (!input.readOnly) return;
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(input.dataset.blankIndex);
                if (!isNaN(idx)) this.showInputTooltip(input, subQ.explain, idx);
            });
        });
        const btnContainer = this.createElement('div', 'blank-button-container');
        const submitBtn = this.createButton('সাবমিট', 'btn-primary', () => {
            if (submitBtn.disabled) return;
            this.handleSubmitSuffixPrefix(subQ, inputs, onAnswered, submitBtn);
        });
        this.currentSubmitBtn = submitBtn;
        btnContainer.appendChild(submitBtn);
        const explainBtn = this.createButton('ব্যাখ্যা', 'explanation-btn', () => {
            const isGroup = this.quizEngine.getCurrentQuestion()?.isGroup || false;
            if (subQ.status !== ANSWER_STATUS.UNANSWERED) {
                this.showExplanationModal('ব্যাখ্যা', this.generateUnifiedExplanation(subQ, { showNotice: false, isGroup: false, inputs }));
                return;
            }
            this.showExplanationAndAutoSubmit(
                subQ,
                () => this.handleSubmitSuffixPrefix(subQ, inputs, onAnswered, submitBtn),
                () => this.generateUnifiedExplanation(subQ, { showNotice: true, isGroup, inputs })
            );
        });
        btnContainer.appendChild(explainBtn);
        card.appendChild(btnContainer);
        parentWrapper.appendChild(card);
    }

    autoSubmitBlankTypeA(subQ) {
        const answer = subQ.answer || [];
        const boxes = this.currentBlankBoxes.length ? this.currentBlankBoxes : this.container.querySelectorAll('.blank-box');
        let correctCount = 0;
        boxes.forEach((box, idx) => {
            const userOrigIdx = box.dataset.originalIndex ? parseInt(box.dataset.originalIndex) : null;
            const isCorrect = userOrigIdx === answer[idx];
            if (isCorrect) { correctCount++; box.classList.add('correct'); }
            else {
                box.classList.add('wrong');
                if (subQ.options?.[answer[idx]]) {
                    const correctText = subQ.options[answer[idx]].replace(/{|:\d+}/g, '');
                    box.setAttribute('data-correct-answer', correctText);
                }
            }
            subQ.userAnswer[idx] = userOrigIdx;
        });
        const isFullyCorrect = correctCount === answer.length;
        this.quizEngine.autoSubmitQuestion(subQ.numid, subQ.userAnswer, isFullyCorrect);
        // ✅ Lock করে দিন
        this.container.classList.add('submitted');
        this.removeAllDragListeners();        
            if (this.currentSubmitBtn) this.currentSubmitBtn.disabled = true;
            this.checkAndShowNextButton();
        }

    autoSubmitBlankTypeB(subQ) {
        const correctAnswers = subQ.answer || [];
        const inputs = this.container.querySelectorAll('.blankb-input');
        let correctCount = 0;
        inputs.forEach((input, index) => {
            const userAnswer = input.value.trim();
            const correctAnswer = String(correctAnswers[index] || '').trim();
            const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
            if (isCorrect) { correctCount++; input.classList.add('correct'); }
            else { input.classList.add('wrong'); input.setAttribute('data-correct-answer', correctAnswer); }
            input.readOnly = true;
            subQ.userAnswer[index] = userAnswer;
        });
        const isFullyCorrect = correctCount === correctAnswers.length;
        this.quizEngine.autoSubmitQuestion(subQ.numid, subQ.userAnswer, isFullyCorrect);
        if (this.currentSubmitBtn) this.currentSubmitBtn.disabled = true;
        this.checkAndShowNextButton();
    }

    autoSubmitSuffixPrefix(subQ) {
        const correctAnswers = subQ.answer || [];
        const inputs = this.container.querySelectorAll('.suffix-prefix-input');
        let correctCount = 0;
        inputs.forEach((input, index) => {
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = String(correctAnswers[index] || '').trim().toLowerCase();
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) { correctCount++; input.classList.add('correct'); }
            else { input.classList.add('wrong'); input.setAttribute('data-correct-answer', correctAnswers[index]); }
            input.readOnly = true;
            subQ.userAnswer[index] = input.value.trim();
        });
        const isFullyCorrect = correctCount === correctAnswers.length;
        this.quizEngine.autoSubmitQuestion(subQ.numid, subQ.userAnswer, isFullyCorrect);
        if (this.currentSubmitBtn) this.currentSubmitBtn.disabled = true;
        this.checkAndShowNextButton();
    }

    generateBlankBHTML(subQ) {
        const questionText = subQ.q || '';
        let blankIndex = 0;
        const MAX_LENGTH = 20;
        return questionText.replace(/____/g, () => {
            const idx = blankIndex++;
            return `<span class="blank-wrapper"><input type="text" class="blankb-input" data-blank-index="${idx}" placeholder="Type in" maxlength="${MAX_LENGTH}" autocomplete="off"><sub class="blank-number">${idx + 1}</sub></span>`;
        });
    }

    resizeBlankBInput(input) {
        if (!input) return;
        const text = input.value || input.placeholder || '';
        const tempSpan = this.createElement('span', 'temp-width-calc', text);
        tempSpan.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + window.getComputedStyle(input).font;
        document.body.appendChild(tempSpan);
        input.style.width = `${Math.max(60, tempSpan.offsetWidth + 20)}px`;
        document.body.removeChild(tempSpan);
    }

    handleSubmitBlankB(subQ, inputs, onAnswered, submitBtn) {
        const correctAnswers = subQ.answer || [];
        const totalBlanks = correctAnswers.length;
        const marksPerBlank = totalBlanks > 0 ? (subQ.marks || 1) / totalBlanks : 0;
        let correctCount = 0, earnedMarks = 0;
        inputs.forEach((input, index) => {
            const userAnswer = input.value.trim();
            const correctAnswer = String(correctAnswers[index] || '').trim();
            const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
            if (isCorrect) { correctCount++; earnedMarks += marksPerBlank; input.classList.add('correct'); this.quizEngine?.soundManager?.play('correct');}
            else { input.classList.add('wrong'); this.quizEngine?.soundManager?.play('wrong');}
            input.readOnly = true;
            subQ.userAnswer[index] = userAnswer;
        });
        const isFullyCorrect = correctCount === totalBlanks;
        this.quizEngine.answerQuestionWithPartialMarks(subQ.numid, subQ.userAnswer, earnedMarks, subQ.marks || 1);
        submitBtn.disabled = true;
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        } else this.checkGroupAndShowNextButton();
        if (onAnswered) onAnswered(isFullyCorrect);
    }

    generateSuffixPrefixHTML(subQ) {
        const questionText = subQ.q || '';
        let blankIndex = 0;
        const MAX_LENGTH = 20;
        return questionText.replace(/\(([^)]+)\)/g, (match, rootWord) => {
            const idx = blankIndex++;
            return `<span class="suffix-prefix-wrapper"><input type="text" class="suffix-prefix-input" data-blank-index="${idx}" data-root-word="${rootWord}" maxlength="${MAX_LENGTH}" autocomplete="off"><sub class="blank-number">${idx + 1}</sub><sub class="root-word-hint">(${rootWord})</sub></span>`;
        });
    }

    generateSuffixPrefixReviewHTML(subQ) {
        const questionText = subQ.q || '';
        let blankIndex = 0;
        return questionText.replace(/\(([^)]+)\)/g, (match, rootWord) => {
            const idx = blankIndex++;
            return `<span class="suffix-prefix-wrapper">
                <span class="blank-box" data-blank-index="${idx}" data-root-word="${rootWord}"></span>
                <sub class="blank-number">${idx + 1}</sub>
                <sub class="root-word-hint">(${rootWord})</sub>
            </span>`;
        });
    }

    resizeSuffixPrefixInput(input) {
        if (!input) return;
        const text = input.value || input.placeholder || '';
        const tempSpan = this.createElement('span', 'temp-width-calc', text);
        tempSpan.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + window.getComputedStyle(input).font;
        document.body.appendChild(tempSpan);
        input.style.width = `${Math.max(40, tempSpan.offsetWidth + 30)}px`;
        document.body.removeChild(tempSpan);
    }

    handleSubmitSuffixPrefix(subQ, inputs, onAnswered, submitBtn) {
        const correctAnswers = subQ.answer || [];
        const totalBlanks = correctAnswers.length;
        const marksPerBlank = totalBlanks > 0 ? (subQ.marks || 1) / totalBlanks : 0;
        let correctCount = 0, earnedMarks = 0;
        inputs.forEach((input, index) => {
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = String(correctAnswers[index] || '').trim().toLowerCase();
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) { correctCount++; earnedMarks += marksPerBlank; input.classList.add('correct'); this.quizEngine?.soundManager?.play('correct');}
            else { input.classList.add('wrong'); this.quizEngine?.soundManager?.play('wrong'); input.setAttribute('data-correct-answer', correctAnswers[index]); }
            input.readOnly = true;
            subQ.userAnswer[index] = input.value.trim();
        });
        const isFullyCorrect = correctCount === totalBlanks;
        this.quizEngine.answerQuestionWithPartialMarks(subQ.numid, subQ.userAnswer, earnedMarks, subQ.marks || 1);
        submitBtn.disabled = true;
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        } else this.checkGroupAndShowNextButton();
        if (onAnswered) onAnswered(isFullyCorrect);
    }

    processOptions(options) {
        return options.map((opt, idx) => {
            const match = opt.match(/^{(.+):(\d+)}$/);
            return match ? { text: match[1], count: parseInt(match[2]), originalIndex: idx, isMultiple: true } : { text: opt, count: 1, originalIndex: idx, isMultiple: false };
        });
    }

    createOptionElement(opt) {
        const el = this.createElement('div', 'blank-option', opt.text);
        el.setAttribute('draggable', 'true');
        el.dataset.optionText = opt.text;
        el.dataset.originalIndex = opt.originalIndex;
        el.dataset.count = opt.count;
        if (opt.count > 1) {
            const badge = this.createElement('sub', 'option-count', `×${opt.count}`);
            el.appendChild(badge);
        }
        return el;
    }

    generateQuestionHTML(subQ) {
        const questionText = subQ.q || '';
        let idx = 0;
        return questionText.replace(/(__Aa__|____)/g, () => {
            const currentIdx = idx++;
            return `<span class="blank-wrapper"><span class="blank-box" data-blank-index="${currentIdx}"></span><sub class="blank-number">${currentIdx + 1}</sub></span>`;
        });
    }

    setupCustomDragAndDrop(blankArea, optionsPanel, blankBoxes, subQ, submitBtn) {
        this.activeOptionsPanel = optionsPanel;
        this.activeBlankBoxes = blankBoxes;
        this.activeSubQ = subQ;
        this.activeSubmitBtn = submitBtn;

        // ✅ Lock state check function
        const isLocked = () => submitBtn.disabled === true;

        this.dropRadius = window.innerWidth < 768 ? 45 : 30;

        const setTA = el => el.style.touchAction = 'none';
        optionsPanel.querySelectorAll('.blank-option').forEach(setTA);
        blankBoxes.forEach(setTA);

        // ============================================================
        // ✅ ১. Option click handler (with lock guard)
        // ============================================================
        optionsPanel.querySelectorAll('.blank-option').forEach(opt => {
            opt.addEventListener('click', e => {
                e.stopPropagation();
                if (this.isDraggingCustom) return;
                if (isLocked()) return;
                this.handleOptionClickToggle(opt);
            });
        });

        // ============================================================
        // ✅ ২. Drag start handler (with lock guard)
        // ============================================================
        const dragStart = e => {
            // ✅ CRITICAL GUARD — submitted হলে drag start হবে না
            if (isLocked()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (e.type === 'mousedown') e.preventDefault();
            
            const target = e.target.closest('.blank-option') || e.target.closest('.blank-box.filled');
            if (!target) return;
            
            if (target.classList.contains('blank-option') && target.closest('.blank-options-panel')) {
                const state = this.optionState.get(target.dataset.optionText);
                if (state?.available <= 0) return;
            }
            
            if (e.type === 'mousedown' && e.button !== 0) return;
            
            this.draggedOption = target;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.potentialDrag = false;
            
            window.addEventListener('mousemove', this.onPotentialDragMove.bind(this));
            window.addEventListener('mouseup', this.onPotentialDragEnd.bind(this));
        };

        // ============================================================
        // ✅ ৩. ✅ ✅ ✅ NEW: Listener references তৈরি করুন
        // ============================================================
        const onMouseDown = (e) => dragStart(e);
        const onTouchStart = this.handleTouchStart.bind(this);

        // ============================================================
        // ✅ ৪. Event listeners bind করুন
        // ============================================================
        optionsPanel.addEventListener('mousedown', onMouseDown);
        blankArea.addEventListener('mousedown', onMouseDown);
        optionsPanel.addEventListener('touchstart', onTouchStart, { passive: false });
        blankArea.addEventListener('touchstart', onTouchStart, { passive: false });

        // ============================================================
        // ✅ ৫. ✅ ✅ ✅ NEW: Save references for cleanup
        // ============================================================
        this._dragListeners.blankAreaMouseDown = { el: blankArea, fn: onMouseDown };
        this._dragListeners.blankAreaTouchStart = { el: blankArea, fn: onTouchStart };
        this._dragListeners.optionsPanelMouseDown = { el: optionsPanel, fn: onMouseDown };
        this._dragListeners.optionsPanelTouchStart = { el: optionsPanel, fn: onTouchStart };

        // ============================================================
        // ✅ ৬. Blank box click handler (with tooltip-on-lock)
        // ============================================================
        blankBoxes.forEach(box => {
            box.addEventListener('click', e => {
                if (this.isDraggingCustom) return;
                e.stopPropagation();

                // ✅ Guard: submit হয়ে গেলে শুধু tooltip
                if (submitBtn.disabled) {
                    const idx = parseInt(box.dataset.blankIndex);
                    if (!isNaN(idx)) this.showBlankTooltip(box, subQ.explain, idx);
                    return;
                }

                // ✅ Normal flow: option click to fill
                if (!submitBtn.disabled) this.handleBlankBoxClick(box);
                else {
                    const idx = parseInt(box.dataset.blankIndex);
                    if (!isNaN(idx)) this.showBlankTooltip(box, subQ.explain, idx);
                }
            });
        });
    }

    // ============================================================
    // ✅ NEW: সব drag listener remove করার জন্য
    // ============================================================
    removeAllDragListeners() {
        const L = this._dragListeners;
        
        if (L.blankAreaMouseDown) {
            L.blankAreaMouseDown.el.removeEventListener('mousedown', L.blankAreaMouseDown.fn);
        }
        if (L.blankAreaTouchStart) {
            L.blankAreaTouchStart.el.removeEventListener('touchstart', L.blankAreaTouchStart.fn);
        }
        if (L.optionsPanelMouseDown) {
            L.optionsPanelMouseDown.el.removeEventListener('mousedown', L.optionsPanelMouseDown.fn);
        }
        if (L.optionsPanelTouchStart) {
            L.optionsPanelTouchStart.el.removeEventListener('touchstart', L.optionsPanelTouchStart.fn);
        }
        
        // ✅ Reset references
        this._dragListeners = {
            blankAreaMouseDown: null,
            blankAreaTouchStart: null,
            optionsPanelMouseDown: null,
            optionsPanelTouchStart: null,
            windowMouseMove: null,
            windowMouseUp: null,
            windowTouchMove: null,
            windowTouchEnd: null
        };
        
        console.log('🔒 All drag listeners removed');
    }

    handleOptionClickToggle(option) {
        const state = this.optionState.get(option.dataset.optionText);
        if (state?.available <= 0) return;
        if (this.selectedOption === option) {
            this.selectedOption.classList.remove('selected');
            this.selectedOption = null;
        } else {
            if (this.selectedOption) this.selectedOption.classList.remove('selected');
            this.selectedOption = option;
            option.classList.add('selected');
        }
    }

    handleBlankBoxClick(box) {
        if (!this.selectedOption) return;
        const optText = this.selectedOption.dataset.optionText;
        const optOrigIdx = parseInt(this.selectedOption.dataset.originalIndex);
        const state = this.optionState.get(optText);
        if (!state || state.available <= 0) return;
        if (box.classList.contains('filled')) this.returnBoxContentToPanel(box, this.activeOptionsPanel);
        this.fillBox(box, optText, optOrigIdx, this.activeOptionsPanel);
        state.available--;
        this.updateOptionAvailability(optText, this.activeOptionsPanel);
        const blankIdx = parseInt(box.dataset.blankIndex);
        this.activeSubQ.userAnswer[blankIdx] = optOrigIdx;
        this.selectedOption.classList.remove('selected');
        this.selectedOption = null;
        if (state.available === 0 && !state.isMultiple) {
            const panelOpt = Array.from(this.activeOptionsPanel.querySelectorAll('.blank-option'))
                .find(o => o.dataset.optionText === optText && o.style.display !== 'none');
            if (panelOpt) { panelOpt.style.display = 'none'; panelOpt.setAttribute('draggable', 'false'); }
        }
    }

    handleTouchStart(e) {
        if (this.container.classList.contains('submitted')) return;
        if (this.currentSubmitBtn?.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const target = e.target.closest('.blank-option') || e.target.closest('.blank-box.filled');
        if (!target || target.classList.contains('disabled')) return;
        this.draggedOption = target;
        const touch = e.touches[0];
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.potentialDrag = false;
        this.touchTimer = setTimeout(() => {
            this.potentialDrag = true;
            this.startCustomDrag(e, this.draggedOption);
        }, 100);
        window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onTouchMove(e) {
        if (!this.draggedOption) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - this.dragStartX);
        const dy = Math.abs(touch.clientY - this.dragStartY);
        if (!this.potentialDrag && Math.hypot(dx, dy) > this.dragThreshold) {
            clearTimeout(this.touchTimer);
            this.potentialDrag = true;
            this.startCustomDrag(e, this.draggedOption);
            e.preventDefault();
        }
        if (this.potentialDrag && this.isDraggingCustom) {
            e.preventDefault();
            this.updateDragGhostPosition(touch.clientX, touch.clientY);
            this.checkGhostCollision(touch.clientX, touch.clientY);
        }
    }

    onTouchEnd(e) {
        clearTimeout(this.touchTimer);
        if (this.isDraggingCustom) { e.preventDefault(); this.performDrop(); }
        this.cleanupDrag();
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    onPotentialDragMove(e) {
        if (!this.draggedOption) return;
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        if (!this.potentialDrag && Math.hypot(dx, dy) > this.dragThreshold) {
            this.potentialDrag = true;
            this.startCustomDrag(e, this.draggedOption);
        }
        if (this.potentialDrag && this.isDraggingCustom) {
            e.preventDefault();
            this.updateDragGhostPosition(e.clientX, e.clientY);
            this.checkGhostCollision(e.clientX, e.clientY);
        }
    }

    onPotentialDragEnd(e) {
        if (this.isDraggingCustom) { e.preventDefault(); this.performDrop(); }
        this.cleanupDrag();
        window.removeEventListener('mousemove', this.onPotentialDragMove);
        window.removeEventListener('mouseup', this.onPotentialDragEnd);
    }

    startCustomDrag(point, sourceEl) {
        this.draggedOption = sourceEl;
        if (sourceEl.classList.contains('blank-box')) {
            sourceEl.classList.add('dragging');
            this.isMovingPlaced = true;
            this.sourceBox = sourceEl;
            this.sourceBlankIdx = parseInt(sourceEl.dataset.blankIndex);
        } else {
            sourceEl.classList.add('dragging');
            this.isMovingPlaced = false;
            this.sourceBox = null;
            this.sourceBlankIdx = null;
        }
        this.dragGhost = document.createElement('div');
        this.dragGhost.className = 'blank-option' + (this.isMovingPlaced ? ' placed' : '');
        Object.assign(this.dragGhost.style, {
            position: 'fixed', zIndex: '10000', opacity: '0.95', pointerEvents: 'none',
            cursor: 'grabbing', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', borderRadius: '24px',
            padding: '4px 12px', fontSize: '0.95rem', backgroundColor: '#2196f3', color: '#fff',
            border: '2px solid white', willChange: 'transform'
        });
        this.dragGhost.textContent = this.isMovingPlaced ? sourceEl.dataset.optionText : sourceEl.textContent;
        this.dragGhost.dataset.optionText = sourceEl.dataset.optionText || sourceEl.textContent;
        this.dragGhost.dataset.originalIndex = sourceEl.dataset.originalIndex || '';
        document.body.appendChild(this.dragGhost);
        const rect = sourceEl.getBoundingClientRect();
        let clientX, clientY;
        if (point.touches) { clientX = point.touches[0].clientX; clientY = point.touches[0].clientY; }
        else { clientX = point.clientX; clientY = point.clientY; }
        this.ghostOffsetX = clientX - rect.left;
        this.ghostOffsetY = clientY - rect.top;
        if (point.touches || point.type === 'touchstart') this.ghostOffsetY = 30;
        this.isDraggingCustom = true;
        this.currentHoverBox = null;
    }

    onCustomDragMove(e) {
        if (!this.isDraggingCustom) return;
        e.preventDefault();
        this.updateDragGhostPosition(e.clientX, e.clientY);
        this.checkGhostCollision(e.clientX, e.clientY);
    }

    movePlacedOption(optionEl, targetBox) {
        const oldParent = optionEl.parentNode;
        if (oldParent) oldParent.innerHTML = '';
        targetBox.innerHTML = '';
        targetBox.appendChild(optionEl);
        optionEl.setAttribute('draggable', 'true');
    }

    onCustomTouchMove(e) {
        if (!this.isDraggingCustom) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDragGhostPosition(touch.clientX, touch.clientY);
        this.checkGhostCollision(touch.clientX, touch.clientY);
    }

    isRectCollidingWithCircle(rect, cx, cy, r) {
        const closestX = Math.max(rect.left, Math.min(cx, rect.right));
        const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
        return Math.hypot(closestX - cx, closestY - cy) <= r;
    }

    updateDragGhostPosition(clientX, clientY) {
        if (!this.dragGhost) return;
        const left = clientX - this.ghostOffsetX;
        const top = clientY - this.ghostOffsetY - 15;
        this.dragGhost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        this.dragGhost.style.left = '0';
        this.dragGhost.style.top = '0';
    }

    checkGhostCollision(clientX, clientY) {
        if (!this.dragGhost) return;
        const ghostRect = this.dragGhost.getBoundingClientRect();
        let closestBox = null, minDist = Infinity;
        this.activeBlankBoxes.forEach(box => {
            const boxRect = box.getBoundingClientRect();
            const cx = boxRect.left + boxRect.width/2;
            const cy = boxRect.top + boxRect.height/2;
            if (this.isRectCollidingWithCircle(ghostRect, cx, cy, this.dropRadius)) {
                const d = this.getClosestDistanceFromCircleToRect(ghostRect, cx, cy);
                if (d < minDist) { minDist = d; closestBox = box; }
            }
        });
        if (closestBox !== this.currentHoverBox) {
            if (this.currentHoverBox) this.currentHoverBox.classList.remove('over');
            if (closestBox) closestBox.classList.add('over');
            this.currentHoverBox = closestBox;
        }
    }

    getClosestDistanceFromCircleToRect(rect, cx, cy) {
        const closestX = Math.max(rect.left, Math.min(cx, rect.right));
        const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
        return Math.hypot(closestX - cx, closestY - cy);
    }

    onCustomDragEnd(e) { if (this.isDraggingCustom) { e.preventDefault(); this.performDrop(); } }
    onCustomTouchEnd(e) { if (this.isDraggingCustom) { e.preventDefault(); this.performDrop(); } }

    resetBlankBoxes(blankBoxes, optionsPanel, subQ) {
        blankBoxes.forEach((box, idx) => {
            if (box.classList.contains('filled')) this.returnBoxContentToPanel(box, optionsPanel);
            subQ.userAnswer[idx] = null;
        });
        if (this.selectedOption) { this.selectedOption.classList.remove('selected'); this.selectedOption = null; }
    }

    performDrop() {
        const ghostText = this.dragGhost?.dataset.optionText;
        const ghostOrigIdx = this.dragGhost ? parseInt(this.dragGhost.dataset.originalIndex) : null;
        if (this.isMovingPlaced && this.sourceBox && !this.currentHoverBox) {
            this.returnBoxContentToPanel(this.sourceBox, this.activeOptionsPanel);
            this.activeSubQ.userAnswer[this.sourceBlankIdx] = null;
            this.cleanupDrag();
            return;
        }
        if (!this.currentHoverBox) { this.cleanupDrag(); return; }
        const targetBox = this.currentHoverBox;
        if (this.isMovingPlaced && this.sourceBox && this.sourceBox !== targetBox) {
            const targetFilled = targetBox.classList.contains('filled');
            const targetText = targetBox.dataset.optionText || null;
            const targetOrigIdx = targetBox.dataset.originalIndex ? parseInt(targetBox.dataset.originalIndex) : null;
            this.fillBox(targetBox, ghostText, ghostOrigIdx, this.activeOptionsPanel);
            this.activeSubQ.userAnswer[parseInt(targetBox.dataset.blankIndex)] = ghostOrigIdx;
            if (targetFilled && targetText && targetOrigIdx !== null) {
                this.fillBox(this.sourceBox, targetText, targetOrigIdx, this.activeOptionsPanel);
                this.activeSubQ.userAnswer[this.sourceBlankIdx] = targetOrigIdx;
            } else {
                this.clearBox(this.sourceBox, this.activeOptionsPanel);
                this.activeSubQ.userAnswer[this.sourceBlankIdx] = null;
            }
        } else if (!this.isMovingPlaced) {
            const state = this.optionState.get(ghostText);
            if (!state || state.available <= 0) { this.cleanupDrag(); return; }
            if (targetBox.classList.contains('filled')) this.returnBoxContentToPanel(targetBox, this.activeOptionsPanel);
            this.fillBox(targetBox, ghostText, ghostOrigIdx, this.activeOptionsPanel);
            state.available--;
            this.updateOptionAvailability(ghostText, this.activeOptionsPanel);
            this.activeSubQ.userAnswer[parseInt(targetBox.dataset.blankIndex)] = ghostOrigIdx;
            if (state.available === 0 && !state.isMultiple) {
                const panelOpt = Array.from(this.activeOptionsPanel.querySelectorAll('.blank-option'))
                    .find(o => o.dataset.optionText === ghostText && o.style.display !== 'none');
                if (panelOpt) { panelOpt.style.display = 'none'; panelOpt.setAttribute('draggable', 'false'); }
            }
        }
        if (this.currentHoverBox) this.currentHoverBox.classList.remove('over');
        this.cleanupDrag();
    }

    fillBox(box, text, origIdx) {
        box.textContent = text;
        box.dataset.optionText = text;
        box.dataset.originalIndex = origIdx;
        box.classList.add('filled');
    }

    clearBox(box) {
        box.textContent = '';
        delete box.dataset.optionText;
        delete box.dataset.originalIndex;
        box.classList.remove('filled');
    }

    returnBoxContentToPanel(box, optionsPanel) {
        const optText = box.dataset.optionText;
        if (!optText) return;
        const state = this.optionState.get(optText);
        if (state) {
            state.available++;
            this.updateOptionAvailability(optText, optionsPanel);
            const panelOpt = Array.from(optionsPanel.querySelectorAll('.blank-option'))
                .find(o => o.dataset.optionText === optText && o.style.display === 'none');
            if (panelOpt) { panelOpt.style.display = ''; panelOpt.setAttribute('draggable', 'true'); panelOpt.classList.remove('disabled'); }
        }
        this.clearBox(box);
    }

    cleanupDrag() {
        if (this.touchTimer) { clearTimeout(this.touchTimer); this.touchTimer = null; }
        if (this.dragGhost?.parentNode) { this.dragGhost.parentNode.removeChild(this.dragGhost); this.dragGhost = null; }
        if (this.draggedOption) { this.draggedOption.classList.remove('dragging'); this.draggedOption = null; }
        this.isDraggingCustom = false;
        this.currentHoverBox = null;
        this.isMovingPlaced = false;
        this.sourceBox = null;
        this.sourceBlankIdx = null;
        this.potentialDrag = false;
    }

    handleOptionClick(e, option) {
        const state = this.optionState.get(option.dataset.optionText);
        if (state?.available <= 0) return;
        if (this.selectedOption === option) {
            this.selectedOption.classList.remove('selected');
            this.selectedOption = null;
        } else {
            if (this.selectedOption) this.selectedOption.classList.remove('selected');
            this.selectedOption = option;
            option.classList.add('selected');
        }
    }

    returnOptionToPanel(option, optionsPanel) {
        const optionText = option.dataset.optionText;
        const state = this.optionState.get(optionText);
        if (state) {
            state.available++;
            this.updateOptionAvailability(optionText, optionsPanel);
            const panelOpt = Array.from(optionsPanel.querySelectorAll('.blank-option'))
                .find(opt => opt.dataset.optionText === optionText && opt.style.display === 'none');
            if (panelOpt) { panelOpt.style.display = 'flex'; panelOpt.setAttribute('draggable', 'true'); panelOpt.classList.remove('disabled'); }
        }
        option.remove();
    }

    updateOptionAvailability(optionText, optionsPanel) {
        const state = this.optionState.get(optionText);
        if (!state) return;
        optionsPanel.querySelectorAll(`.blank-option[data-option-text="${optionText}"]`).forEach(opt => {
            if (state.available === 0) {
                opt.classList.add('disabled');
                opt.setAttribute('draggable', 'false');
                opt.style.display = 'none';
            } else {
                opt.classList.remove('disabled');
                opt.setAttribute('draggable', 'true');
                opt.style.display = '';
            }
            const badge = opt.querySelector('.option-count');
            if (badge && state.total > 1) badge.textContent = `×${state.available}`;
        });
    }

    handleBlankClick(e, box, optionsPanel, blankBoxes, subQ) {
        e.stopPropagation();
        if (!this.selectedOption) return;
        const optText = this.selectedOption.dataset.optionText;
        const optOrigIdx = parseInt(this.selectedOption.dataset.originalIndex);
        const state = this.optionState.get(optText);
        if (!state || state.available <= 0) return;
        if (box.classList.contains('filled')) this.returnBoxContentToPanel(box, optionsPanel);
        this.fillBox(box, optText, optOrigIdx, optionsPanel);
        state.available--;
        this.updateOptionAvailability(optText, optionsPanel);
        if (state.available === 0 && !state.isMultiple) {
            this.selectedOption.style.display = 'none';
            this.selectedOption.setAttribute('draggable', 'false');
        }
        this.selectedOption.classList.remove('selected');
        this.selectedOption = null;
        const idx = parseInt(box.dataset.blankIndex);
        subQ.userAnswer[idx] = optOrigIdx;
    }

    handleSubmitBlankA(subQ, blankBoxes, onAnswered, submitBtn) {
        const answer = subQ.answer || [];
        let correctCount = 0, earnedMarks = 0;
        const totalBlanks = answer.length;
        const marksPerBlank = totalBlanks > 0 ? (subQ.marks || 1) / totalBlanks : 0;
        
        blankBoxes.forEach((box, index) => {
            const userOrigIdx = box.dataset.originalIndex ? parseInt(box.dataset.originalIndex) : null;
            const isCorrect = userOrigIdx === answer[index];
            if (isCorrect) {
                correctCount++;
                earnedMarks += marksPerBlank;
                box.classList.add('correct');
                this.quizEngine?.soundManager?.play('correct');
            } else {
                box.classList.add('wrong');
                this.quizEngine?.soundManager?.play('wrong');
            }
        });
        
        const isFullyCorrect = correctCount === totalBlanks;
        this.quizEngine.answerQuestionWithPartialMarks(subQ.numid, subQ.userAnswer, earnedMarks, subQ.marks || 1);
        
        submitBtn.disabled = true;
        if (this.currentResetBtn) this.currentResetBtn.disabled = true;
        
        // ✅ ✅ ✅ CRITICAL: submitted class add করুন
        this.container.classList.add('submitted');
        
        // ✅ disableAllOptions() — এখন সম্পূর্ণ lock করবে
        this.disableAllOptions();
        
        // ✅ ✅ ✅ সব drag listener remove করুন
        this.removeAllDragListeners();
        
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) {
            if (this.quizEngine.getMode?.() !== 'full') this.quizEngine.pauseTimer();
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        } else this.checkGroupAndShowNextButton();
        
        if (this.selectedOption) { this.selectedOption.classList.remove('selected'); this.selectedOption = null; }
        if (onAnswered) onAnswered(isFullyCorrect);
    }

    markBlankAsSkipped(subQ, blankBoxes, optionsPanel, onAnswered, isGroup = false) {
        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;
        subQ.status = ANSWER_STATUS.SKIPPED;
        subQ.userAnswer = null;
        this.quizEngine.answerQuestion(subQ.numid, null, false);
        if (blankBoxes) {
            blankBoxes.forEach(box => {
                box.style.pointerEvents = 'none';
                const option = box.querySelector('.blank-option');
                if (option) { option.setAttribute('draggable', 'false'); option.classList.add('disabled'); }
            });
        }
        if (optionsPanel) {
            optionsPanel.querySelectorAll('.blank-option').forEach(opt => {
                opt.setAttribute('draggable', 'false');
                opt.classList.add('disabled');
            });
        }
        this.container.querySelectorAll('.blankb-input, .suffix-prefix-input').forEach(input => {
            input.readOnly = true;
        });
        if (this.currentSubmitBtn) this.currentSubmitBtn.disabled = true;
        if (onAnswered && this.quizEngine?.getCurrentQuestion()) onAnswered(false);
    }

    checkGroupAndShowNextButton() {
        const item = this.quizEngine.getCurrentQuestion();
        if (!item?.isGroup) return;
        if (item.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED)) {
            this.setSkipButtonDisabled(true);
            this.showNextButton();
        }
    }

    showBlankTooltip(targetBox, explainData, index) {
        const existing = document.querySelector('.blank-tooltip-popup');
        if (existing) existing.remove();
        let word = "N/A", desc = "কোনো ব্যাখ্যা নেই।";
        if (explainData?.[index]) { word = explainData[index].word || "N/A"; desc = explainData[index].desc || "কোনো ব্যাখ্যা নেই।"; }
        else desc = "এই অংশের জন্য ব্যাখ্যা পাওয়া যায়নি।";
        const tooltip = document.createElement('div');
        tooltip.className = 'blank-tooltip-popup';
        tooltip.innerHTML = `<strong>${word}</strong><span>${desc}</span>`;
        document.body.appendChild(tooltip);
        const rect = targetBox.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || 0;
        const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
        const vp = 10, ah = 6, margin = 4, totalVO = ah + margin;
        const center = rect.left + scrollX + (rect.width / 2);
        let left = center - (tw / 2);
        const rightEdge = window.innerWidth - vp;
        if (left + tw - scrollX > rightEdge) left = rightEdge + scrollX - tw;
        if (left - scrollX < vp) left = vp + scrollX;
        tooltip.style.left = `${left}px`;
        let top = (rect.top + scrollY) - th - totalVO;
        if (top < (scrollY + vp)) { top = (rect.bottom + scrollY) + totalVO; tooltip.classList.add('flip-bottom'); }
        else tooltip.classList.remove('flip-bottom');
        tooltip.style.top = `${top}px`;
        tooltip.style.setProperty('--arrow-shift', `${center - left}px`);
        const timer = setTimeout(() => { if (tooltip?.parentNode) tooltip.remove(); }, 10000);
        tooltip.addEventListener('click', e => e.stopPropagation());
        const close = (e) => {
            if (!targetBox.contains(e.target) && !tooltip.contains(e.target)) {
                if (tooltip?.parentNode) tooltip.remove();
                clearTimeout(timer);
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 100);
    }

    showInputTooltip(inputEl, explainData, index) {
        const existing = document.querySelector('.blank-tooltip-popup');
        if (existing) existing.remove();
        let word = "N/A", desc = "কোনো ব্যাখ্যা নেই।";
        if (explainData?.[index]) { word = explainData[index].word || "N/A"; desc = explainData[index].desc || "কোনো ব্যাখ্যা নেই।"; }
        else desc = "এই অংশের জন্য ব্যাখ্যা পাওয়া যায়নি।";
        const tooltip = document.createElement('div');
        tooltip.className = 'blank-tooltip-popup';
        tooltip.innerHTML = `<strong>${word}</strong><span>${desc}</span>`;
        document.body.appendChild(tooltip);
        const rect = inputEl.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || 0;
        const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
        const vp = 10, ah = 6, margin = 4, totalVO = ah + margin;
        const center = rect.left + scrollX + (rect.width / 2);
        let left = center - (tw / 2);
        const rightEdge = window.innerWidth - vp;
        if (left + tw - scrollX > rightEdge) left = rightEdge + scrollX - tw;
        if (left - scrollX < vp) left = vp + scrollX;
        tooltip.style.left = `${left}px`;
        let top = (rect.top + scrollY) - th - totalVO;
        if (top < (scrollY + vp)) { top = (rect.bottom + scrollY) + totalVO; tooltip.classList.add('flip-bottom'); }
        else tooltip.classList.remove('flip-bottom');
        tooltip.style.top = `${top}px`;
        tooltip.style.setProperty('--arrow-shift', `${center - left}px`);
        const timer = setTimeout(() => { if (tooltip?.parentNode) tooltip.remove(); }, 10000);
        tooltip.addEventListener('click', e => e.stopPropagation());
        const close = (e) => {
            if (!inputEl.contains(e.target) && !tooltip.contains(e.target)) {
                if (tooltip?.parentNode) tooltip.remove();
                clearTimeout(timer);
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 100);
    }

    disableAllOptions() {
        // ✅ ১. Option panel-এর সব option disable
        this.container.querySelectorAll('.blank-option').forEach(opt => {
            opt.setAttribute('draggable', 'false');
            opt.classList.add('disabled');
            opt.style.pointerEvents = 'none';
        });
        
        // ✅ ✅ ✅ ২. NEW: Blank box-গুলোতে drag disable
        this.container.querySelectorAll('.blank-box').forEach(box => {
            box.setAttribute('draggable', 'false');
            box.style.cursor = 'pointer';       // tooltip-এর জন্য cursor pointer থাকবে
            box.style.pointerEvents = 'auto';   // click-এর জন্য enable
            // ✅ কিন্তু drag disable — নিচের ৩য় layer-এ handle করা হবে
            
            // ✅ ৩. Box থেকে option text সরানোর ক্ষমতা বন্ধ
            box.classList.remove('filled');     // ✅ 'filled' class remove — drag target হিসেবে আর match করবে না
            // ✅ নতুন class দিয়ে শুধু visual state বজায় রাখা হবে
            box.classList.add('locked');
        });
        
        // ✅ ৪. Option panel-এর parent-এ pointer-events disable
        const optionsPanel = this.container.querySelector('.blank-options-panel');
        if (optionsPanel) {
            optionsPanel.style.pointerEvents = 'none';
            optionsPanel.setAttribute('aria-disabled', 'true');
        }
        
        // ✅ ৫. Global drag state cleanup
        this.cleanupDrag();
        
        // ✅ ৬. Selection disable (double-click / text select prevent)
        this.container.style.userSelect = 'none';
        this.container.style.webkitUserSelect = 'none';
        this.container.style.webkitTouchCallout = 'none';
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
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
                if (subQ.type === 'Blank-Type-A') this.autoSubmitBlankTypeA(subQ);
                else if (subQ.type === 'Blank-Type-B') this.autoSubmitBlankTypeB(subQ);
                else if (subQ.type === 'Blank-Suffix-Prefix') this.autoSubmitSuffixPrefix(subQ);
            }
        });
        if (this.resetButtons) this.resetButtons.forEach(btn => btn.disabled = true);
        this.container.querySelectorAll('.blankb-input, .suffix-prefix-input').forEach(input => input.readOnly = true);
        this.disableAllOptions();
        // ✅ Lock
        this.container.classList.add('submitted');
        this.removeAllDragListeners();
        if (this.currentSubmitBtn) { this.currentSubmitBtn.disabled = true; this.currentSubmitBtn.classList.add('disabled'); }
        this.showNextButton();
        this.disableSubmitButtons();
    }

    disableSubmitButtons() {
        this.container.querySelectorAll('.btn-primary, .btn.primary').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
    }
}