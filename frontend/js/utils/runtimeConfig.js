// frontend/js/utils/runtimeConfig.js
// Version: 2.0.0 - Runtime configuration loader with environment detection
// Purpose: Load API URL from config.json and auto-detect local vs production
// Compatible with: Local dev (localhost:3000) + Cloudflare Pages (production)

/**
 * Runtime configuration object
 * Populated by `loadRuntimeConfig()` at app startup
 */
const runtimeConfig = {
    API_BASE_URL: null,
    PRODUCTION_API_BASE_URL: null,
    ENVIRONMENT: 'development',
    APP_NAME: 'Quiz Program',
    APP_VERSION: '2.0.0',
    _loaded: false,
    _loadedPromise: null
};

/**
 * ✅ Environment Detection
 * localhost / 127.0.0.1 / *.local → development
 * সব কিছু → production
 */
const detectEnvironment = () => {
    if (typeof window === 'undefined' || !window.location) {
        return 'development';
    }
    const host = window.location.hostname;
    const isLocal = (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host === ''
    );
    return isLocal ? 'development' : 'production';
};

/**
 * Fallback API URL (used if config.json fails to load)
 * Priority: window override → localhost
 */
const getFallbackURL = () => {
    // ✅ Allow test override via window (useful for debugging)
    if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
        return window.__API_BASE_URL__;
    }
    return 'http://localhost:5000/api/v1';
};

/**
 * ✅ Pick correct API URL based on environment
 * development → API_BASE_URL (localhost)
 * production  → PRODUCTION_API_BASE_URL (Render)
 */
const pickApiUrl = (data) => {
    const env = detectEnvironment();

    if (env === 'production') {
        // Production: prefer PRODUCTION_API_BASE_URL
        if (data.PRODUCTION_API_BASE_URL && typeof data.PRODUCTION_API_BASE_URL === 'string') {
            return data.PRODUCTION_API_BASE_URL;
        }
        // Fallback: if PRODUCTION missing but API_BASE_URL looks like a real URL (not localhost)
        if (data.API_BASE_URL && !data.API_BASE_URL.includes('localhost')) {
            return data.API_BASE_URL;
        }
        console.warn('⚠️  Production env but no PRODUCTION_API_BASE_URL found in config.json');
        return getFallbackURL();
    }

    // Development: use API_BASE_URL
    return data.API_BASE_URL || getFallbackURL();
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

            // ✅ Validate: must have at least one API URL
            const hasDevUrl = data.API_BASE_URL && typeof data.API_BASE_URL === 'string';
            const hasProdUrl = data.PRODUCTION_API_BASE_URL && typeof data.PRODUCTION_API_BASE_URL === 'string';

            if (!hasDevUrl && !hasProdUrl) {
                throw new Error('config.json missing both API_BASE_URL and PRODUCTION_API_BASE_URL');
            }

            // ✅ Determine environment and pick correct URL
            const detectedEnv = detectEnvironment();
            const chosenUrl = pickApiUrl(data).replace(/\/$/, ''); // strip trailing slash

            // ✅ Merge into runtimeConfig
            Object.assign(runtimeConfig, data, {
                _loaded: true,
                ENVIRONMENT: detectedEnv,
                API_BASE_URL: chosenUrl
            });

            console.log('✅ Runtime config loaded:', {
                host: window.location.hostname,
                ENVIRONMENT: runtimeConfig.ENVIRONMENT,
                API_BASE_URL: runtimeConfig.API_BASE_URL,
                APP_VERSION: runtimeConfig.APP_VERSION
            });

            return runtimeConfig;

        } catch (error) {
            // ✅ Fallback if config.json fails
            console.warn('⚠️  config.json load failed, using fallback:', error.message);

            runtimeConfig.API_BASE_URL = getFallbackURL();
            runtimeConfig.ENVIRONMENT = detectEnvironment();
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
    detectEnvironment,
    config: runtimeConfig
};

// ✅ Also export individual functions for convenience
export {
    loadRuntimeConfig,
    getApiBaseUrl,
    getEnvironment,
    isProduction,
    detectEnvironment
};

// ✅ Auto-load on module import (non-blocking)
loadRuntimeConfig().catch((err) => {
    console.error('❌ Auto-load runtime config failed:', err);
});