// scripts/minify.js
// Version: 1.0.0
// Purpose: Build-time minification for Cloudflare Pages deployment
// Strategy: Copy frontend/ → frontend-dist/ then minify JS + CSS in-place
// Uses: esbuild (zero dependencies, extremely fast)

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// ============================================================
// Configuration
// ============================================================
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'frontend');
const DIST = path.join(ROOT, 'frontend-dist');

const JS_EXT = new Set(['.js', '.mjs']);
const CSS_EXT = new Set(['.css']);

const SKIP_MINIFY = new Set([
    'katex',
    'node_modules',
    '.git',
]);

const SKIP_COPY = new Set([
    '.DS_Store',
    'Thumbs.db',
]);

// ============================================================
// Utility Functions
// ============================================================
function log(msg) {
    console.log(`[minify] ${msg}`);
}

function logError(msg) {
    console.error(`[minify] ❌ ${msg}`);
}

function logSuccess(msg) {
    console.log(`[minify] ✅ ${msg}`);
}

// ============================================================
// Recursive Copy + Minify
// ============================================================
function processDirectory(srcDir, distDir, stats = { js: 0, css: 0, copied: 0, jsSaved: 0, cssSaved: 0 }) {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const distPath = path.join(distDir, entry.name);

        if (SKIP_COPY.has(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            if (SKIP_MINIFY.has(entry.name)) {
                log(`  Skip folder: ${entry.name}/`);
                continue;
            }
            processDirectory(srcPath, distPath, stats);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();

            if (JS_EXT.has(ext)) {
                processJSFile(srcPath, distPath, stats);
            } else if (CSS_EXT.has(ext)) {
                processCSSFile(srcPath, distPath, stats);
            } else {
                fs.copyFileSync(srcPath, distPath);
                stats.copied++;
            }
        }
    }

    return stats;
}

// ============================================================
// JS Minification
// ============================================================
function processJSFile(srcPath, distPath, stats) {
    try {
        const srcContent = fs.readFileSync(srcPath, 'utf8');

        const parentDir = path.dirname(distPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        const result = esbuild.transformSync(srcContent, {
            loader: 'js',
            minify: true,
            format: 'esm',
            target: 'es2020',
            legalComments: 'none',
            sourcemap: false,
            treeShaking: false,
        });

        fs.writeFileSync(distPath, result.code, 'utf8');
        stats.js++;
        stats.jsSaved += (srcContent.length - result.code.length);
    } catch (err) {
        logError(`JS minify failed for ${srcPath}: ${err.message}`);
        fs.copyFileSync(srcPath, distPath);
    }
}

// ============================================================
// CSS Minification
// ============================================================
function processCSSFile(srcPath, distPath, stats) {
    try {
        const srcContent = fs.readFileSync(srcPath, 'utf8');

        const parentDir = path.dirname(distPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        const result = esbuild.transformSync(srcContent, {
            loader: 'css',
            minify: true,
            legalComments: 'none',
            sourcemap: false,
        });

        fs.writeFileSync(distPath, result.code, 'utf8');
        stats.css++;
        stats.cssSaved += (srcContent.length - result.code.length);
    } catch (err) {
        logError(`CSS minify failed for ${srcPath}: ${err.message}`);
        fs.copyFileSync(srcPath, distPath);
    }
}

// ============================================================
// Clean dist
// ============================================================
function cleanDist() {
    if (fs.existsSync(DIST)) {
        log(`Cleaning existing ${path.basename(DIST)}/...`);
        fs.rmSync(DIST, { recursive: true, force: true });
    }
}

// ============================================================
// Main
// ============================================================
function main() {
    const startTime = Date.now();

    log('═══════════════════════════════════════');
    log('🚀 Minify Build Starting');
    log('═══════════════════════════════════════');
    log(`Source:      ${SRC}`);
    log(`Destination: ${DIST}`);
    log('');

    if (!fs.existsSync(SRC)) {
        logError(`Source directory not found: ${SRC}`);
        process.exit(1);
    }

    cleanDist();

    log('📦 Processing files...');
    const stats = processDirectory(SRC, DIST);

    log('');
    log('═══════════════════════════════════════');
    log('📊 Build Summary');
    log('═══════════════════════════════════════');
    log(`  JS files minified:   ${stats.js}`);
    log(`  CSS files minified:  ${stats.css}`);
    log(`  Other files copied:  ${stats.copied}`);
    log('');
    log(`  JS bytes saved:      ${(stats.jsSaved / 1024).toFixed(2)} KB`);
    log(`  CSS bytes saved:     ${(stats.cssSaved / 1024).toFixed(2)} KB`);
    log(`  Total bytes saved:   ${((stats.jsSaved + stats.cssSaved) / 1024).toFixed(2)} KB`);
    log('');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`Build completed in ${elapsed}s`);
    log(`Output: ${DIST}`);
    log('═══════════════════════════════════════');
}

main();