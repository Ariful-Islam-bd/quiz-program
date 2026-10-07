// frontend/js/utils/runtimeConfig.js
// Version: 1.0.0 - Runtime configuration loader
// Purpose: Load API URL from config.json at runtime (Cloudflare Pages-compatible)

/**
 * Runtime configuration object
 * Populated by `loadRuntimeConfig()` at app startup
 */
const runtimeConfig = {
    API_BASE_URL: null,
    ENVIRONMENT: 'development',
    APP_NAME: 'Quiz Program',
    APP_VERSION: '2.0.0',
    _loaded: false,
    _loadedPromise: null
};

/**
 * Fallback API URL (used if config.json fails to load)
 * Priority: runtime config → window override → localhost
 */
const getFallbackURL = () => {
    // ✅ Allow test override via window (useful for debugging)
    if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
        return window.__API_BASE_URL__;
    }
    return 'http://localhost:5000/api/v1';
};

/**
 * Load config.json asynchronously
 * Caches the promise so multiple calls return same result
 * @returns {Promise<Object>} The loaded config
 */
const loadRuntimeConfig = () => {
    if (runtimeConfig._loadedPromise) {
        return runtimeConfig._loadedPromise;
    }

    runtimeConfig._loadedPromise = (async () => {
        try {
            // ✅ Cache-bust config.json to always get latest
            const url = `./config.json?v=${Date.now()}`;
            const response = await fetch(url, {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`config.json load failed: HTTP ${response.status}`);
            }

            const data = await response.json();

            // ✅ Validate required field
            if (!data.API_BASE_URL || typeof data.API_BASE_URL !== 'string') {
                throw new Error('config.json missing API_BASE_URL');
            }

            // ✅ Merge into runtimeConfig
            Object.assign(runtimeConfig, data, {
                _loaded: true,
                API_BASE_URL: data.API_BASE_URL.replace(/\/$/, '') // strip trailing slash
            });

            console.log('✅ Runtime config loaded:', {
                API_BASE_URL: runtimeConfig.API_BASE_URL,
                ENVIRONMENT: runtimeConfig.ENVIRONMENT,
                APP_VERSION: runtimeConfig.APP_VERSION
            });

            return runtimeConfig;

        } catch (error) {
            // ✅ Fallback if config.json fails
            console.warn('⚠️  config.json load failed, using fallback:', error.message);

            runtimeConfig.API_BASE_URL = getFallbackURL();
            runtimeConfig._loaded = true;

            return runtimeConfig;
        }
    })();

    return runtimeConfig._loadedPromise;
};

/**
 * Get current API base URL (sync)
 * MUST be called AFTER `loadRuntimeConfig()` resolves
 */
const getApiBaseUrl = () => {
    if (!runtimeConfig._loaded) {
        console.warn('⚠️  getApiBaseUrl called before config loaded. Using fallback.');
        return getFallbackURL();
    }
    return runtimeConfig.API_BASE_URL;
};

/**
 * Get current environment
 */
const getEnvironment = () => runtimeConfig.ENVIRONMENT || 'development';

/**
 * Check if in production
 */
const isProduction = () => getEnvironment() === 'production';

/**
 * Export
 */
export const runtimeConfigService = {
    loadRuntimeConfig,
    getApiBaseUrl,
    getEnvironment,
    isProduction,
    config: runtimeConfig
};

// ✅ Also export individual functions for convenience
export {
    loadRuntimeConfig,
    getApiBaseUrl,
    getEnvironment,
    isProduction
};

// ✅ Auto-load on module import (non-blocking)
// This ensures config is loaded ASAP when app.js imports it
loadRuntimeConfig().catch((err) => {
    console.error('❌ Auto-load runtime config failed:', err);
});