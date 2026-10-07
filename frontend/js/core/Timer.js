// frontend/js/core/Timer.js
// Version: 1.3.0
// Description: টাইমার শুরু হওয়ার সাথে সাথেই সময় দেখানোর জন্য ফিক্স

export class Timer {
    #duration;
    #timeLeft;
    #interval = null;
    #isPaused = false;
    #eventListeners = {};
    #onTimeout = null;

    constructor(duration = 60, onTimeout = null) {
        this.#duration = duration;
        this.#timeLeft = duration;
        this.#onTimeout = onTimeout;
    }

    /**
     * টাইমার শুরু করা - সাথে সাথেই সময় দেখানো
     */
    start() {
        if (this.#interval) this.stop();
        
        // টাইমার শুরু হওয়ার সাথে সাথেই বর্তমান সময় ইমিট করা
        this.emit('tick', this.#timeLeft);
        
        this.#interval = setInterval(() => {
            if (!this.#isPaused) {
                this.#timeLeft--;
                this.emit('tick', this.#timeLeft);
                
                if (this.#timeLeft <= 0) {
                    this.stop();
                    this.emit('end');
                    if (this.#onTimeout) {
                        this.#onTimeout();
                    }
                }
            }
        }, 1000);
        
        this.emit('start', this.#timeLeft);
    }

    pause() {
        this.#isPaused = true;
        this.emit('pause', this.#timeLeft);
    }

    resume() {
        this.#isPaused = false;
        this.emit('resume', this.#timeLeft);
    }

    stop() {
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = null;
        }
        this.#isPaused = false;
        this.emit('stop', this.#timeLeft);
    }

    reset(newDuration) {
        this.stop();
        this.#duration = newDuration || this.#duration;
        this.#timeLeft = this.#duration;
        this.#isPaused = false;
        this.emit('reset', this.#timeLeft);
    }

    getTimeLeft() {
        return this.#timeLeft;
    }

    isPaused() {
        return this.#isPaused;
    }

    isRunning() {
        return this.#interval !== null && !this.#isPaused;
    }

    formatTime() {
        const minutes = Math.floor(this.#timeLeft / 60);
        const seconds = this.#timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    static formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        if (isNaN(totalSeconds)) return "00:00";
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

    removeAllListeners() {
        this.#eventListeners = {};
    }
}