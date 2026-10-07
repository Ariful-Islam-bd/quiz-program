// frontend/js/core/QuizEngine.js
// Version: 1.4.0
// Description: গ্রুপ MCQ প্রশ্নের জন্য সাব-প্রশ্ন ভিত্তিক স্কিপ এবং টাইমার ম্যানেজমেন্ট

import { ANSWER_STATUS } from '../utils/constants.js';
import { Timer } from './Timer.js';
import { ScoreManager } from './ScoreManager.js';
import { ProgressTracker } from './ProgressTracker.js';

export class QuizEngine {
    #quiz = [];
    #currentIndex = 0;
    #timer = null;
    #scoreManager = null;
    #progressTracker = null;
    #eventListeners = {};
    #config = {};
    #isGroupTimerPaused = false;  // গ্রুপ প্রশ্নের জন্য টাইমার পজ ট্র্যাকিং

    constructor(quizData, config = {}) {
        this.#config = config;
        this.#quiz = this.#prepareQuizData(quizData);
        this.#scoreManager = new ScoreManager();
        this.#progressTracker = new ProgressTracker(this.#quiz);
        this.soundManager = config.soundManager || null;

        const mode = config.mode || 'perQuestion';
        if (mode === 'full') {
            const totalDuration = config.totalDuration || 60;
            this.#timer = new Timer(totalDuration, () => this.#handleFullQuizTimeout());
        } else {
            const timePerQuestion = config.timePerQuestion || 60;
            this.#timer = new Timer(timePerQuestion, () => this.#handleTimeout());
        }

        this.#setupEventListeners();
    }

    getTotalItems() {
        return this.#quiz.length;
    }

    #prepareQuizData(quizData) {
        const clonedData = JSON.parse(JSON.stringify(quizData));
        const shuffled = this.#shuffleArray(clonedData);
        return this.#assignSerialNumbers(shuffled);
    }

    #assignSerialNumbers(quizData) {
        let counter = 1;
        quizData.forEach(item => {
            if (item.questions && Array.isArray(item.questions)) {
                item.questions.forEach(subQ => {
                    subQ.serialNumber = counter++;
                    subQ.numid = subQ.serialNumber;
                    if (subQ.status === undefined) {
                        subQ.status = ANSWER_STATUS.UNANSWERED;
                    }
                });
            }
        });
        return quizData;
    }

    #shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    #setupEventListeners() {
        this.#timer.on('tick', (timeLeft) => {
            this.emit('timerTick', timeLeft);
        });

        this.#timer.on('end', () => {});
    }


    #handleTimeout() {
        const currentItem = this.#quiz[this.#currentIndex];
        if (currentItem) {
            this.emit('timerExpired', {
                questionIndex: this.#currentIndex,
                question: currentItem
            });

            currentItem.questions.forEach(subQ => {
                if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                    subQ.status = ANSWER_STATUS.TIMED_OUT;
                    if (subQ.type === 'Blank-Type-B' || subQ.type === 'Blank-Suffix-Prefix') {
                        if (!subQ.userAnswer) {
                            subQ.userAnswer = new Array(subQ.answer?.length || 0).fill('');
                        }
                    }
                }
            });
        }
        // ✅ টাইমআউটে সাউন্ড + ভাইব্রেশন
        if (this.soundManager) {
            this.soundManager.play('timeout');
        }
        this.emit('timeout');
    }

    #handleFullQuizTimeout() {
        this.#quiz.forEach(item => {
            item.questions.forEach(subQ => {
                if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                    subQ.status = ANSWER_STATUS.TIMED_OUT;
                    if (subQ.type === 'Blank-Type-B' || subQ.type === 'Blank-Suffix-Prefix') {
                        if (!subQ.userAnswer) {
                            subQ.userAnswer = new Array(subQ.answer?.length || 0).fill('');
                        }
                    }
                }
            });
        });
        // ✅ টাইমআউটে সাউন্ড + ভাইব্রেশন
        if (this.soundManager) {
            this.soundManager.play('timeout');
        }
        this.emit('timeout');
        this.emit('fullQuizTimeout');
    }

    getCurrentQuestion() {
        return this.#quiz[this.#currentIndex];
    }

    #findSubQuestion(questionId) {
        for (const item of this.#quiz) {
            const found = item.questions.find(q => q.numid === questionId);
            if (found) return found;
        }
        return null;
    }

    answerQuestion(questionId, answer, isCorrect) {
        const subQ = this.#findSubQuestion(questionId);
        if (!subQ) return;

        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;

        subQ.status = isCorrect ? ANSWER_STATUS.CORRECT : ANSWER_STATUS.WRONG;
        subQ.userAnswer = answer;

        if (isCorrect) {
            this.#scoreManager.addScore(subQ.marks || 1);
            // ✅ সঠিক উত্তরে সাউন্ড + ভাইব্রেশন
            if (this.soundManager) {
                this.soundManager.play('correct');
            }
        } else {
            // ✅ ভুল উত্তরে সাউন্ড + ভাইব্রেশন
            if (this.soundManager) {
                this.soundManager.play('wrong');
            }
        }

        this.emit('questionAnswered', {
            questionId,
            isCorrect,
            score: this.#scoreManager.getScore(),
            status: subQ.status
        });
    }

    resumeGroupTimer() {
        if (this.#isGroupTimerPaused) {
            this.#isGroupTimerPaused = false;
        }
    }

    autoSubmitQuestion(questionId, answer, isCorrect) {
        const subQ = this.#findSubQuestion(questionId);
        if (!subQ) return;

        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;

        subQ.status = isCorrect ? ANSWER_STATUS.CORRECT : ANSWER_STATUS.WRONG;
        subQ.userAnswer = answer;

        if (isCorrect) {
            this.#scoreManager.addScore(subQ.marks || 1);
        }

        this.emit('autoSubmitted', {
            questionId,
            isCorrect,
            score: this.#scoreManager.getScore(),
            status: subQ.status
        });
    }

    skipSubQuestion(questionId) {
        const subQ = this.#findSubQuestion(questionId);
        if (!subQ) return false;

        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return false;

        subQ.status = ANSWER_STATUS.SKIPPED;
        subQ.userAnswer = null;

        this.emit('subQuestionSkipped', {
            questionId,
            status: subQ.status
        });
        return true;
    }

    isGroupComplete() {
    const currentItem = this.getCurrentQuestion();
    if (!currentItem || !currentItem.isGroup) return false;
    return currentItem.questions.every(q => q.status !== ANSWER_STATUS.UNANSWERED);
    }

    answerQuestionWithPartialMarks(questionId, answer, earnedMarks, totalMarks) {
        const subQ = this.#findSubQuestion(questionId);
        if (!subQ) return;
        
        if (subQ.status !== ANSWER_STATUS.UNANSWERED) return;
        if (earnedMarks >= totalMarks) {
            subQ.status = ANSWER_STATUS.CORRECT;
        } else if (earnedMarks > 0) {
            subQ.status = ANSWER_STATUS.PARTIAL;
        } else {
            subQ.status = ANSWER_STATUS.WRONG;
        }
        
        subQ.userAnswer = answer;
        subQ.earnedMarks = earnedMarks;
        this.#scoreManager.addScore(earnedMarks);
        this.emit('questionAnswered', {
            questionId,
            earnedMarks,
            totalMarks,
            score: this.#scoreManager.getScore(),
            status: subQ.status
        });
    }

    next() {
        if (this.#currentIndex < this.#quiz.length - 1) {
            this.resumeGroupTimer();
            this.#currentIndex++;
            this.emit('questionChanged', this.getCurrentQuestion());
            return true;
        }
        return false;
    }

    getMode() {
        return this.#config.mode || 'perQuestion';
    }

    skip() {
        const currentItem = this.#quiz[this.#currentIndex];
        if (currentItem) {
            currentItem.questions.forEach(subQ => {
                if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                    subQ.status = ANSWER_STATUS.SKIPPED;
                }
            });
        }
        return this.next();
    }

    isTimerExpired() {
        return this.#timer ? this.#timer.getTimeLeft() <= 0 : false;
    }

    setTimerDuration(duration) {
        if (this.#timer) {
            this.#timer.reset(duration);
        }
    }

    getProgress() {
        return this.#progressTracker.getProgress(this.#currentIndex);
    }

    getScore() {
        return this.#scoreManager.getScore();
    }

    getQuizData() {
        return this.#quiz;
    }

    getTotalMarks() {
        return this.#scoreManager.getTotalMarks(this.#quiz);
    }

    getResults() {
        let score = 0;
        let totalMarks = 0;
        let correct = 0;
        let wrong = 0;
        let partial = 0;
        let skipped = 0;
        let timedOut = 0;
        let unanswered = 0;

        this.#quiz.forEach(item => {
            const questions = item.isGroup ? item.questions : [item.questions[0]];
            questions.forEach(subQ => {
                const marks = subQ.marks || 1;
                totalMarks += marks;

                if (subQ.status === ANSWER_STATUS.CORRECT) {
                    correct++;
                    score += marks;
                } else if (subQ.status === ANSWER_STATUS.PARTIAL) {
                    partial++;
                    // earnedMarks ইতোমধ্যে জমা হয়েছে (answerQuestionWithPartialMarks-এ)
                    score += (subQ.earnedMarks || 0);
                } else if (subQ.status === ANSWER_STATUS.WRONG) {
                    wrong++;
                } else if (subQ.status === ANSWER_STATUS.SKIPPED) {
                    skipped++;
                } else if (subQ.status === ANSWER_STATUS.TIMED_OUT) {
                    timedOut++;
                } else if (subQ.status === ANSWER_STATUS.UNANSWERED) {
                    unanswered++;
                }
            });
        });

        const totalQuestions = this.#quiz.reduce((sum, item) =>
            sum + (item.isGroup ? item.questions.length : 1), 0);

        const stats = {
            total: totalQuestions,
            correct,
            wrong,
            partial,       // ← UI-তে দেখানোর জন্য
            skipped,
            timedOut,
            unanswered,
            percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 100) / 100 : 0
        };

        return {
            quiz: this.#quiz,
            score,
            totalMarks,
            stats
        };
    }

    on(event, callback) {
        if (!this.#eventListeners[event]) {
            this.#eventListeners[event] = [];
        }
        this.#eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.#eventListeners[event]) {
            this.#eventListeners[event].forEach(callback => callback(data));
        }
    }

    startTimer() {
        if (this.#timer) {
            this.#timer.start();
        }
    }

    pauseTimer() {
        if (this.#timer) {
            this.#timer.pause();
        }
    }

    resumeTimer() {
        if (this.#timer) {
            this.#timer.resume();
        }
    }

    stopTimer() {
        if (this.#timer) {
            this.#timer.stop();
        }
    }

    resetTimerForFullMode(newDuration) {
        if (this.#timer && this.#config.mode === 'full') {
            this.#timer.stop();
            this.#timer = new Timer(newDuration, () => this.#handleFullQuizTimeout());
            this.#setupEventListeners();
        }
    }

    isComplete() {
        return this.#currentIndex >= this.#quiz.length - 1;
    }

    getCurrentIndex() {
        return this.#currentIndex;
    }

    getTotalQuestions() {
        return this.#progressTracker.getTotalQuestions();
    }

    getCurrentQuestionNumber() {
        return this.#progressTracker.getCurrentQuestionNumber(this.#currentIndex);
    }
}