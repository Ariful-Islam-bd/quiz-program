// frontend/js/core/ProgressTracker.js
// Version: 1.1.0
// Description: প্রগ্রেস ট্র্যাকিং - সঠিক প্রশ্ন নম্বর দেখানোর জন্য আপডেট করা হয়েছে

import { ANSWER_STATUS } from '../utils/constants.js';

export class ProgressTracker {
    #quizData;

    constructor(quizData) {
        this.#quizData = quizData;
    }

       // frontend/js/core/ProgressTracker.js
    getCurrentQuestionNumber(currentIndex) {
        let questionNumber = 0;
    
        // আগের সব আইটেমের প্রশ্ন যোগ করুন
        for (let i = 0; i < currentIndex; i++) {
            questionNumber += this.#quizData[i].questions.length;
        }
    
        // বর্তমান আইটেমের মোট প্রশ্ন যোগ করুন (সব সাব-প্রশ্ন একসাথে)
        const currentItem = this.#quizData[currentIndex];
        if (currentItem) {
            questionNumber += currentItem.questions.length;
        }
    
        return questionNumber;
    }

    getTotalQuestions() {
        return this.#quizData.reduce((sum, item) => sum + item.questions.length, 0);
    }

    getProgress(currentIndex) {
        const totalQuestions = this.getTotalQuestions();
        const currentQuestion = this.getCurrentQuestionNumber(currentIndex);
        
        return {
            currentQuestion: currentQuestion,
            totalQuestions: totalQuestions,
            percentage: ((currentQuestion - 1) / totalQuestions) * 100
        };
    }

    getStatistics() {
        let correct = 0, wrong = 0, skipped = 0, timedOut = 0, unanswered = 0;

        this.#quizData.forEach(item => {
            item.questions.forEach(q => {
                switch(q.status) {
                    case ANSWER_STATUS.CORRECT: correct++; break;
                    case ANSWER_STATUS.WRONG: wrong++; break;
                    case ANSWER_STATUS.SKIPPED: skipped++; break;
                    case ANSWER_STATUS.TIMED_OUT: timedOut++; break;
                    default: unanswered++; break;
                }
            });
        });

        const total = this.getTotalQuestions();
        const percentage = total > 0 ? ((correct / total) * 100) : 0;

        return { correct, wrong, skipped, timedOut, unanswered, total, percentage };
    }
}
