// frontend/js/core/ScoreManager.js
// Version: 1.0.0
// Description: স্কোর ম্যানেজমেন্ট

export class ScoreManager {
    #score = 0;

    addScore(points) {
        this.#score += points;
        this.#score = Math.round(this.#score * 100) / 100;
    }

    getScore() {
        return this.#score;
    }

    reset() {
        this.#score = 0;
    }

    getTotalMarks(quizData) {
        return quizData.reduce((sum, item) => {
            const itemMarks = item.questions.reduce((s, sq) => s + (sq.marks || 1), 0);
            return sum + itemMarks;
        }, 0);
    }
}