// frontend/js/services/ContentService.js
// Version: 1.0.0 - Content API wrapper with in-memory caching
// Purpose: Fetch academia content from backend API

import { API_ENDPOINTS, buildApiUrl } from '../utils/constants.js';

class ContentService {
    // ✅ In-memory cache
    #cache = new Map();
    #CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // ✅ In-flight requests (prevent duplicate fetches)
    #inFlight = new Map();

    /**
     * ✅ Generic fetch with caching
     * @param {string} key - Cache key
     * @param {string} url - Full URL
     * @returns {Promise<Object>}
     */
    async #fetchWithCache(key, url) {
        // ✅ Check cache first
        const cached = this.#cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.#CACHE_TTL) {
            console.log(`📦 Cache hit: ${key}`);
            return cached.data;
        }

        // ✅ Deduplicate in-flight requests
        if (this.#inFlight.has(key)) {
            console.log(`⏳ In-flight: ${key}`);
            return this.#inFlight.get(key);
        }

        // ✅ Make request
        const promise = (async () => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                const data = await response.json();

                // ✅ Store in cache
                this.#cache.set(key, {
                    data,
                    timestamp: Date.now()
                });

                return data;
            } finally {
                this.#inFlight.delete(key);
            }
        })();

        this.#inFlight.set(key, promise);
        return promise;
    }

    /**
     * ✅ Fetch all categories (unique board/class/subject/chapter/topic)
     */
    async fetchCategories() {
        const url = buildApiUrl('/content/categories');
        const data = await this.#fetchWithCache('categories', url);
        return data.data || { boards: [], classes: [], subjects: [], chapters: [], topics: [] };
    }

    /**
     * ✅ Fetch topic list with filters
     * @param {Object} filters - { board, className, subject, chapter, search }
     */
    async fetchTopicList(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.append(key, value);
            }
        });

        const url = buildApiUrl(`/content?${params.toString()}`);
        const cacheKey = `list:${params.toString()}`;
        const data = await this.#fetchWithCache(cacheKey, url);
        return data.data || [];
    }

    /**
     * ✅ Fetch single topic content by topicId
     * @param {string} topicId - e.g., 'HSC-Math-3A-Q01-Q02'
     */
    async fetchTopicContent(topicId) {
        if (!topicId) throw new Error('topicId প্রয়োজন');

        const url = buildApiUrl(`/content/${encodeURIComponent(topicId)}`);
        const cacheKey = `topic:${topicId}`;
        const data = await this.#fetchWithCache(cacheKey, url);
        return data.data;
    }

    /**
     * ✅ Fetch statistics
     */
    async fetchStats() {
        const url = buildApiUrl('/content/stats/summary');
        const data = await this.#fetchWithCache('stats', url);
        return data.data;
    }

    /**
     * ✅ Clear all cache (useful after admin updates)
     */
    clearCache() {
        this.#cache.clear();
        console.log('🗑️ Content cache cleared');
    }

    /**
     * ✅ Clear specific topic from cache
     */
    clearTopicCache(topicId) {
        this.#cache.delete(`topic:${topicId}`);
        this.#cache.delete('stats');
    }
}

export const contentService = new ContentService();