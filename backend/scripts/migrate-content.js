// backend/scripts/migrate-content.js
// Version: 2.0.0 - Auto-discovery with metadata JSON
// Purpose: Migrate HTML files from content/ to MongoDB
//
// Features:
// ✅ Auto-discovers files from metadata JSON
// ✅ Validates file existence BEFORE database operations
// ✅ Fuzzy filename matching (case-insensitive, normalized)
// ✅ Idempotent (safe to run multiple times)
// ✅ Detects content changes via MD5 hash
// ✅ Detailed reporting with statistics
//
// Usage:
//   node backend/scripts/migrate-content.js                # Live migration
//   node backend/scripts/migrate-content.js --dry-run      # Preview only
//   node backend/scripts/migrate-content.js --verbose      # Show details
//   node backend/scripts/migrate-content.js --validate     # Validate config only

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// ✅ Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Content = require('../models/Content');

// ============================================================
// ✅ Configuration
// ============================================================
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const METADATA_PATH = path.join(__dirname, 'content-metadata.json');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const VALIDATE_ONLY = process.argv.includes('--validate');

// ============================================================
// ✅ Console colors
// ============================================================
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    verbose: (msg) => { if (VERBOSE) console.log(`${colors.gray}   ${msg}${colors.reset}`); },
    title: (msg) => console.log(`${colors.bold}${colors.magenta}${msg}${colors.reset}`),
    divider: () => console.log('═'.repeat(64))
};

// ============================================================
// ✅ Statistics tracker
// ============================================================
const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    missingFiles: [],
    warnings: []
};

// ============================================================
// ✅ Load metadata JSON
// ============================================================
async function loadMetadata() {
    try {
        const raw = await fs.readFile(METADATA_PATH, 'utf-8');
        const metadata = JSON.parse(raw);

        if (!metadata.items || !Array.isArray(metadata.items)) {
            throw new Error('Metadata JSON must have an "items" array');
        }

        return metadata;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Metadata file not found: ${METADATA_PATH}`);
        }
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in metadata file: ${error.message}`);
        }
        throw error;
    }
}

// ============================================================
// ✅ Normalize filename for fuzzy matching
// Converts: "3A Q01-Q02 Solution Comp Num.html" → "3aq01-q02solutioncompnum"
// ============================================================
function normalizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/\s+/g, '')          // Remove whitespace
        .replace(/\.html?$/i, '')     // Remove .html extension
        .replace(/[^a-z0-9\u0980-\u09FF-]/g, ''); // Keep letters, numbers, Bengali, hyphens
}

// ============================================================
// ✅ Find actual file on disk (with fuzzy matching)
// Returns: { found: boolean, actualPath: string, matchType: string }
// ============================================================
async function findActualFile(basePath, relativePath) {
    const expectedPath = path.join(basePath, relativePath);

    // ✅ Attempt 1: Exact match
    try {
        await fs.access(expectedPath);
        return {
            found: true,
            actualPath: expectedPath,
            matchType: 'exact'
        };
    } catch {
        // Continue to fuzzy matching
    }

    // ✅ Attempt 2: Case-insensitive exact match
    const dir = path.dirname(expectedPath);
    const targetName = path.basename(expectedPath);

    try {
        const files = await fs.readdir(dir);
        const targetNormalized = normalizeFilename(targetName);

        for (const file of files) {
            if (normalizeFilename(file) === targetNormalized) {
                return {
                    found: true,
                    actualPath: path.join(dir, file),
                    matchType: 'normalized'
                };
            }
        }

        // ✅ Attempt 3: Very fuzzy match (Levenshtein-like)
        // Find closest match by character overlap
        let bestMatch = null;
        let bestScore = 0;

        for (const file of files) {
            if (!file.toLowerCase().endsWith('.html')) continue;

            const fileNormalized = normalizeFilename(file);
            const score = similarityScore(targetNormalized, fileNormalized);

            if (score > bestScore && score > 0.85) { // 85% similarity threshold
                bestScore = score;
                bestMatch = file;
            }
        }

        if (bestMatch) {
            return {
                found: true,
                actualPath: path.join(dir, bestMatch),
                matchType: 'fuzzy',
                similarity: bestScore
            };
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    return {
        found: false,
        actualPath: expectedPath,
        matchType: 'none'
    };
}

// ============================================================
// ✅ Simple similarity score (0-1) using longest common subsequence
// ============================================================
function similarityScore(a, b) {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    let matches = 0;
    let shortIdx = 0;

    for (let i = 0; i < longer.length && shortIdx < shorter.length; i++) {
        if (longer[i] === shorter[shortIdx]) {
            matches++;
            shortIdx++;
        }
    }

    return matches / longer.length;
}

// ============================================================
// ✅ Validate metadata structure
// ============================================================
function validateMetadata(metadata) {
    const errors = [];
    const seenTopicIds = new Set();

    if (!metadata.items || metadata.items.length === 0) {
        errors.push('Metadata has no items');
        return errors;
    }

    metadata.items.forEach((item, index) => {
        const prefix = `Item #${index + 1} (${item.topicId || 'no-topicId'})`;

        // Required fields
        if (!item.topicId) errors.push(`${prefix}: missing topicId`);
        if (!item.name) errors.push(`${prefix}: missing name`);
        if (!item.filePath) errors.push(`${prefix}: missing filePath`);
        if (!item.category) errors.push(`${prefix}: missing category`);

        // Duplicate check
        if (item.topicId && seenTopicIds.has(item.topicId)) {
            errors.push(`${prefix}: duplicate topicId`);
        }
        if (item.topicId) seenTopicIds.add(item.topicId);

        // Category structure
        if (item.category) {
            const required = ['board', 'className', 'subject', 'chapter', 'topic'];
            required.forEach(field => {
                if (!item.category[field]) {
                    errors.push(`${prefix}: category missing "${field}"`);
                }
            });
        }

        // topicId format
        if (item.topicId && !/^[A-Za-z0-9-]+$/.test(item.topicId)) {
            errors.push(`${prefix}: topicId must contain only letters, numbers, and hyphens`);
        }
    });

    return errors;
}

// ============================================================
// ✅ Generate MD5 hash of content
// ============================================================
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// ============================================================
// ✅ Read HTML file safely
// ============================================================
async function readFileSafe(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${filePath}`);
        }
        if (error.code === 'EACCES') {
            throw new Error(`Permission denied: ${filePath}`);
        }
        throw error;
    }
}

// ============================================================
// ✅ Validate mode: check all files exist
// ============================================================
async function validateMode(metadata) {
    log.title('\n📋 VALIDATION MODE — Checking metadata & files...\n');

    const contentRoot = path.join(PROJECT_ROOT, metadata.contentRoot || 'content');
    log.info(`Content root: ${contentRoot}`);

    try {
        await fs.access(contentRoot);
    } catch {
        log.error(`Content root directory not found: ${contentRoot}`);
        process.exit(1);
    }

    let valid = 0;
    let invalid = 0;

    for (const item of metadata.items) {
        const result = await findActualFile(contentRoot, item.filePath);

        if (result.found) {
            const status = result.matchType === 'exact'
                ? `${colors.green}✅ EXACT${colors.reset}`
                : `${colors.yellow}⚠️  ${result.matchType.toUpperCase()}${colors.reset}`;

            console.log(`   ${status}  ${item.topicId}`);

            if (result.matchType !== 'exact') {
                log.verbose(`Expected: ${item.filePath}`);
                log.verbose(`Found:    ${path.relative(contentRoot, result.actualPath)}`);
            }
            valid++;
        } else {
            console.log(`   ${colors.red}❌ MISSING${colors.reset}  ${item.topicId}`);
            log.verbose(`Expected: ${item.filePath}`);
            invalid++;
        }
    }

    log.divider();
    console.log(`   ${colors.green}Valid:${colors.reset}   ${valid}`);
    console.log(`   ${colors.red}Invalid:${colors.reset} ${invalid}`);
    log.divider();

    if (invalid === 0) {
        log.success('All files validated successfully! ✅');
    } else {
        log.error(`${invalid} file(s) missing. Fix metadata or add files.`);
    }

    process.exit(invalid > 0 ? 1 : 0);
}

// ============================================================
// ✅ Main migration function
// ============================================================
async function migrateContent(metadata) {
    log.divider();
    log.title('🚀 Content Migration Script v2.0.0');
    log.divider();
    console.log(`📁 Project root: ${PROJECT_ROOT}`);
    console.log(`📄 Metadata:     ${METADATA_PATH}`);
    console.log(`🔧 Mode:         ${DRY_RUN ? `${colors.yellow}DRY RUN${colors.reset}` : `${colors.green}LIVE${colors.reset}`}`);
    console.log(`📋 Total items:  ${metadata.items.length}`);
    log.divider();
    console.log();

    const contentRoot = path.join(PROJECT_ROOT, metadata.contentRoot || 'content');

    // ✅ Verify content root exists
    try {
        await fs.access(contentRoot);
    } catch {
        log.error(`Content root not found: ${contentRoot}`);
        process.exit(1);
    }

    // ✅ Process each item
    for (const item of metadata.items) {
        const { topicId, name, category, filePath, tags = [] } = item;

        try {
            log.info(`Processing: ${topicId}`);

            // ✅ Find actual file (with fuzzy matching)
            const fileResult = await findActualFile(contentRoot, filePath);

            if (!fileResult.found) {
                log.error(`  File missing: ${filePath}`);
                stats.failed++;
                stats.missingFiles.push({ topicId, filePath });
                continue;
            }

            if (fileResult.matchType !== 'exact') {
                log.warn(`  ${fileResult.matchType} match: ${path.relative(contentRoot, fileResult.actualPath)}`);
                stats.warnings.push({
                    topicId,
                    expected: filePath,
                    actual: path.relative(contentRoot, fileResult.actualPath),
                    matchType: fileResult.matchType
                });
            }

            // ✅ Read file content
            const html = await readFileSafe(fileResult.actualPath);
            const contentHash = generateHash(html);

            log.verbose(`Size: ${(html.length / 1024).toFixed(2)} KB`);
            log.verbose(`Hash: ${contentHash.substring(0, 12)}...`);

            // ✅ Check existing content
            const existing = await Content.findOne({ topicId });

            if (existing) {
                // ✅ Content unchanged? Skip
                if (existing.contentHash === contentHash) {
                    log.warn(`  Skipped (unchanged): ${topicId}`);
                    stats.skipped++;
                    continue;
                }

                // ✅ Update existing
                if (!DRY_RUN) {
                    existing.html = html;
                    existing.name = name;
                    existing.category = category;
                    existing.sourcePath = path.relative(contentRoot, fileResult.actualPath);
                    existing.contentHash = contentHash;
                    existing.version = (existing.version || 1) + 1;
                    existing.metadata = existing.metadata || {};
                    await existing.save();
                }

                log.success(`  Updated: ${topicId} → v${(existing.version || 1) + (DRY_RUN ? 1 : 0)}`);
                stats.updated++;
            } else {
                // ✅ Create new
                if (!DRY_RUN) {
                    await Content.create({
                        topicId,
                        name,
                        category,
                        contentType: 'html',
                        html,
                        sourcePath: path.relative(contentRoot, fileResult.actualPath),
                        contentHash
                    });
                }

                log.success(`  Created: ${topicId}`);
                stats.created++;
            }

        } catch (error) {
            log.error(`  Failed: ${topicId} — ${error.message}`);
            stats.failed++;
            stats.errors.push({ topicId, error: error.message });
        }
    }

    // ✅ Print summary
    console.log();
    log.divider();
    log.title('📊 Migration Summary');
    log.divider();
    console.log(`   ${colors.green}Created:${colors.reset}  ${stats.created}`);
    console.log(`   ${colors.blue}Updated:${colors.reset}  ${stats.updated}`);
    console.log(`   ${colors.yellow}Skipped:${colors.reset}  ${stats.skipped}`);
    console.log(`   ${colors.red}Failed:${colors.reset}   ${stats.failed}`);
    log.divider();

    // ✅ Warnings (fuzzy matches)
    if (stats.warnings.length > 0) {
        console.log();
        log.warn(`${stats.warnings.length} fuzzy match(es) used:`);
        stats.warnings.forEach(w => {
            console.log(`   • ${w.topicId}`);
            console.log(`     Expected: ${w.expected}`);
            console.log(`     Actual:   ${w.actual}`);
        });
    }

    // ✅ Errors
    if (stats.errors.length > 0) {
        console.log();
        log.error(`${stats.errors.length} error(s):`);
        stats.errors.forEach(({ topicId, error }) => {
            console.log(`   • ${topicId}: ${error}`);
        });
    }

    // ✅ Missing files
    if (stats.missingFiles.length > 0) {
        console.log();
        log.error(`${stats.missingFiles.length} missing file(s):`);
        stats.missingFiles.forEach(({ topicId, filePath }) => {
            console.log(`   • ${topicId}`);
            console.log(`     Path: ${filePath}`);
        });
    }

    if (DRY_RUN) {
        console.log();
        log.warn('DRY RUN — No changes were made to the database.');
        console.log(`   Run ${colors.cyan}npm run migrate:content${colors.reset} to apply changes.\n`);
    }

    return stats;
}

// ============================================================
// ✅ Main entry point
// ============================================================
async function main() {
    try {
        console.log();
        log.title('📖 Loading metadata...');

        // ✅ Load & validate metadata
        const metadata = await loadMetadata();
        log.success(`Loaded ${metadata.items.length} item(s) from metadata`);

        const validationErrors = validateMetadata(metadata);
        if (validationErrors.length > 0) {
            log.error('Metadata validation failed:');
            validationErrors.forEach(err => console.log(`   • ${err}`));
            process.exit(1);
        }
        log.success('Metadata structure valid ✅');

        // ✅ Validate-only mode (no DB connection needed)
        if (VALIDATE_ONLY) {
            await validateMode(metadata);
            return;
        }

        // ✅ Validate env
        if (!process.env.MONGO_URI) {
            log.error('MONGO_URI not set in .env');
            process.exit(1);
        }

        // ✅ Connect to MongoDB
        console.log();
        log.info('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });
        log.success(`Connected: ${mongoose.connection.host}`);
        log.info(`Database: ${mongoose.connection.name}`);

        // ✅ Run migration
        await migrateContent(metadata);

        // ✅ Disconnect
        await mongoose.disconnect();
        log.success('Disconnected from MongoDB');

        process.exit(stats.failed > 0 ? 1 : 0);

    } catch (error) {
        console.log();
        log.error(`Fatal error: ${error.message}`);
        if (VERBOSE) console.error(error.stack);
        process.exit(1);
    }
}

// ✅ Run
main();