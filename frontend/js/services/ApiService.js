// frontend/js/services/ApiService.js
// Version: 2.2.0 - Runtime config integration

import { API_ENDPOINTS, getApiBase, buildApiUrl } from '../utils/constants.js';
import { storageService } from './StorageService.js';

class ApiService {
    #token = null;
    #defaultHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    #isRefreshing = false;
    #refreshSubscribers = [];

    constructor() {
        this.#token = storageService.getToken();
    }

    // ✅ Dynamic base URL getter (resolves from runtime config each time)
    get #baseURL() {
        return getApiBase();
    }

    setToken(token) {
        this.#token = token;
        storageService.setToken(token);
    }

    setRefreshToken(token) {
        storageService.setRefreshToken(token);
    }

    clearToken() {
        this.#token = null;
        storageService.clearToken();
        storageService.clearRefreshToken();
    }

    #getHeaders() {
        const headers = { ...this.#defaultHeaders };
        if (this.#token) {
            headers['Authorization'] = `Bearer ${this.#token}`;
        }
        return headers;
    }

    // ✅ Token Refresh Queue
    #subscribeToRefresh(callback) {
        this.#refreshSubscribers.push(callback);
    }

    #onTokenRefreshed(token) {
        this.#refreshSubscribers.forEach(callback => callback(token));
        this.#refreshSubscribers = [];
    }

    // ✅ Token Refresh
    async #refreshToken() {
        if (this.#isRefreshing) {
            return new Promise((resolve) => {
                this.#subscribeToRefresh((token) => resolve(token));
            });
        }

        this.#isRefreshing = true;
        try {
            const refreshToken = storageService.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            // ✅ Use buildApiUrl for consistent URL resolution
            const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();
            if (data.success && data.token) {
                this.setToken(data.token);
                this.#onTokenRefreshed(data.token);
                return data.token;
            }
            throw new Error('Refresh failed');
        } catch (error) {
            this.clearToken();
            this.#onTokenRefreshed(null);
            throw error;
        } finally {
            this.#isRefreshing = false;
        }
    }

    // ✅ Main Request Method
    async #request(endpoint, options = {}) {
        // ✅ Build full URL dynamically
        const url = endpoint.startsWith('http')
            ? endpoint
            : `${this.#baseURL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: this.#getHeaders(),
                //credentials: 'include'
            });

            const isAuthEndpoint = endpoint.includes('/auth/login') || 
                                endpoint.includes('/auth/register') ||
                                endpoint.includes('/auth/forgot-password') ||
                                endpoint.includes('/auth/reset-password') ||
                                endpoint.includes('/auth/verify-otp') ||
                                endpoint.includes('/auth/validate-reset-token');

            // ✅ Token Expired → Refresh
            if (response.status === 401 && !isAuthEndpoint) {
                try {
                    const newToken = await this.#refreshToken();
                    if (newToken) {
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers: this.#getHeaders(),
                            //credentials: 'include'
                        });
                        const retryData = await retryResponse.json();
                        if (!retryResponse.ok) {
                            throw new Error(retryData.message || 'Request failed after refresh');
                        }
                        return retryData;
                    }
                } catch (refreshError) {
                    if (window.app?.authPage) {
                        window.app.authPage.show('login');
                    }
                    if (window.app?.showToast) {
                        window.app.showToast('🔐 সেশন এক্সপায়ার্ড হয়েছে, আবার লগইন করুন', 'warning');
                    }
                    throw new Error('Session expired. Please login again.');
                }
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    // ✅ Public Methods (unchanged API surface)
    async get(endpoint, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.#request(qs ? `${endpoint}?${qs}` : endpoint, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.#request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.#request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, data = {}) {
        return this.#request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }

    // ✅ Categories & Quizzes
    async getCategories(filters = {}) {
        const clean = {};
        for (const [key, value] of Object.entries(filters)) {
            if (value && value !== 'all' && value !== '') clean[key] = value;
        }
        return this.get(API_ENDPOINTS.CATEGORIES, clean);
    }

    async getFilteredQuizzes(filters) {
        const clean = {};
        for (const [key, value] of Object.entries(filters)) {
            if (value && value !== 'all' && value !== '') clean[key] = value;
        }
        return this.get(API_ENDPOINTS.QUIZZES.FILTER, clean);
    }

    async submitQuiz(result) {
        return this.post(API_ENDPOINTS.QUIZZES.SUBMIT, result);
    }

    async getAllQuizzes() {
        return this.get(API_ENDPOINTS.QUIZZES.BASE);
    }

    async getQuizById(id) {
        return this.get(`${API_ENDPOINTS.QUIZZES.BASE}/${id}`);
    }

    // ✅ Auth Methods
    async register(name, email, password, profile = {}) {
        return this.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password, profile });
    }

    async login(email, password) {
        return this.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    }

    async logout(refreshToken) {
        return this.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    }

    async refreshToken(refreshToken) {
        return this.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    }

    async getProfile() {
        return this.get(API_ENDPOINTS.AUTH.ME);
    }

    async updateProfile(data) {
        return this.put(API_ENDPOINTS.AUTH.ME, data);
    }

    // ✅ Password Management
    async changePassword(currentPassword, newPassword) {
        return this.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    }

    async forgotPassword(email, method = 'link') {
        return this.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email, method });
    }

    async resetPassword(token, newPassword) {
        return this.put(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
    }

    async verifyOTP(email, otp, newPassword) {
        return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp, newPassword });
    }

    async sendResetOptions(email) {
        return this.post(API_ENDPOINTS.AUTH.SEND_RESET_OPTIONS, { email });
    }

    async deleteAccount(password) {
        return this.delete(API_ENDPOINTS.AUTH.ME, { password });
    }

    // ✅ Utility
    isAuthenticated() {
        return !!this.#token;
    }

    getToken() {
        return this.#token;
    }

    getBaseURL() {
        return this.#baseURL;
    }

    // ✅ Upload methods (added for R2 integration)
    async uploadAvatar(formData) {
        const url = buildApiUrl(API_ENDPOINTS.UPLOADS.AVATAR);
        const headers = {};
        if (this.#token) headers['Authorization'] = `Bearer ${this.#token}`;
        // ⚠️ Don't set Content-Type — browser sets multipart boundary automatically

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
            //credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data;
    }

    async uploadCover(formData) {
        const url = buildApiUrl(API_ENDPOINTS.UPLOADS.COVER);
        const headers = {};
        if (this.#token) headers['Authorization'] = `Bearer ${this.#token}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
            //credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data;
    }

    async deleteAvatar() {
        return this.delete(API_ENDPOINTS.UPLOADS.AVATAR);
    }

    async deleteCover() {
        return this.delete(API_ENDPOINTS.UPLOADS.COVER);
    }
}

export const apiService = new ApiService();