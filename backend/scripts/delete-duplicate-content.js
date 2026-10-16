// backend/scripts/delete-duplicate-content.js
// Version: 1.0.0
// Purpose: Delete HSC-Math-3A-* and HSC-Math-3B-* content from MongoDB
// Usage: node backend/scripts/delete-duplicate-content.js
//        node backend/scripts/delete-duplicate-content.js --dry-run
//        node backend/scripts/delete-duplicate-content.js --confirm

require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('../models/Content');

// ============================================================
// Configuration
// ============================================================
const DELETE_TOPIC_IDS = [
    // 3A (8 topics)
    'HSC-Math-3A-All-Q',
    'HSC-Math-3A-Q01-Q02',
    'HSC-Math-3A-Q03-Q05',
    'HSC-Math-3A-Q06-Q08',
    'HSC-Math-3A-Q09',
    'HSC-Math-3A-Q10',
    'HSC-Math-3A-Q11',
    'HSC-Math-3A-Q12-Q15',
    // 3B (7 topics)
    'HSC-Math-3B-All-Q',
    'HSC-Math-3B-Q01-Q02',
    'HSC-Math-3B-Q03-Q04',
    'HSC-Math-3B-Q05-Q09',
    'HSC-Math-3B-Q10-Q11',
    'HSC-Math-3B-Q12',
    'HSC-Math-3B-Q13-Q17',
];

// ============================================================
// Parse arguments
// ============================================================
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isConfirmed = args.includes('--confirm');

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log('🗑️  MongoDB Content Deletion');
    console.log('═══════════════════════════════════════════════');
    console.log(`Mode:        ${isDryRun ? '🔍 DRY RUN (no changes)' : isConfirmed ? '💥 LIVE DELETE' : '⚠️  SAFETY CHECK'}`);
    console.log(`Topic count: ${DELETE_TOPIC_IDS.length}`);
    console.log('');

    // Safety: require --confirm for live delete
    if (!isDryRun && !isConfirmed) {
        console.log('⚠️  SAFETY CHECK FAILED');
        console.log('');
        console.log('To run a dry run:  node backend/scripts/delete-duplicate-content.js --dry-run');
        console.log('To run live delete: node backend/scripts/delete-duplicate-content.js --confirm');
        console.log('');
        console.log('⚠️  LIVE DELETE requires --confirm flag for safety!');
        process.exit(1);
    }

    // Connect MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }

    // ============================================================
    // Step 1: Verify content exists
    // ============================================================
    console.log('📋 Step 1: Checking content existence...');
    const existing = await Content.find({ topicId: { $in: DELETE_TOPIC_IDS } }).select('topicId name').lean();
    const existingIds = existing.map(c => c.topicId);
    const missing = DELETE_TOPIC_IDS.filter(id => !existingIds.includes(id));

    console.log(`   Found:   ${existing.length}/${DELETE_TOPIC_IDS.length}`);
    if (missing.length > 0) {
        console.log(`   Missing: ${missing.length}`);
        missing.forEach(id => console.log(`     - ${id}`));
    }
    console.log('');

    if (existing.length === 0) {
        console.log('⚠️  No matching content found. Nothing to delete.');
        await mongoose.disconnect();
        return;
    }

    // ============================================================
    // Step 2: Dry run — show what would be deleted
    // ============================================================
    if (isDryRun) {
        console.log('🔍 DRY RUN — Would delete these contents:');
        existing.forEach((c, i) => {
            console.log(`   ${(i + 1).toString().padStart(2)}. ${c.topicId} — ${c.name}`);
        });
        console.log('');
        console.log('✅ Dry run complete. No changes made.');
        console.log('   To execute: add --confirm flag.');
        await mongoose.disconnect();
        return;
    }

    // ============================================================
    // Step 3: Live delete
    // ============================================================
    console.log('💥 Step 2: DELETING content...');
    const result = await Content.deleteMany({ topicId: { $in: DELETE_TOPIC_IDS } });
    console.log(`   ✅ Deleted: ${result.deletedCount} content documents`);
    console.log('');

    // ============================================================
    // Step 4: Verify deletion
    // ============================================================
    console.log('📊 Step 3: Verifying deletion...');
    const remaining = await Content.countDocuments({ topicId: { $in: DELETE_TOPIC_IDS } });
    console.log(`   Remaining with target IDs: ${remaining}`);
    console.log('');

    // ============================================================
    // Step 5: Stats
    // ============================================================
    const totalContent = await Content.countDocuments();
    console.log('═══════════════════════════════════════════════');
    console.log('📊 Final Stats');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Deleted:        ${result.deletedCount} documents`);
    console.log(`   Remaining DB:   ${totalContent} documents`);
    console.log('═══════════════════════════════════════════════');

    // Disconnect
    await mongoose.disconnect();
    console.log('');
    console.log('✅ Complete!');
}

// Run
main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});