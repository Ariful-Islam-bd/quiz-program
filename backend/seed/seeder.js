/* File: D:QUIZ_PROGRAM/backend/seed/seeder.js
   Version: 2.1.0
   Description: Multi-category support with strict ID matching.
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const { MAIN_QUIZ_DATA_MAP } = require('../../mainQuizData');
const { ASSORTED_QUIZ_INDEX } = require('../../assortedData');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding...'))
    .catch(err => console.error('DB Connection Error:', err));

const ADMIN_ID = '698c7a9bfb94718bcaa4377a';

// ============================================================
// ✅ FIX: Strict base ID extraction (strip -sqX suffixes)
// ============================================================
const getBaseId = (rawId) => {
    if (typeof rawId !== 'string') return '';
    // Strip any "-sqN" suffix chain: "q001-sq1-sq2" → "q001"
    return rawId.replace(/(-sq\d+)+$/i, '');
};

// ============================================================
// ✅ FIX: Find ALL category matches using EXACT base ID comparison
// ============================================================
const findAllCategoryInfo = (qid) => {
    const matches = [];
    const seen = new Set();
    const targetBaseId = getBaseId(qid);

    if (!ASSORTED_QUIZ_INDEX) {
        return [{
            board: 'সাধারণ',
            class: 'সাধারণ',
            subject: 'সাধারণ',
            chapter: 'সাধারণ',
            exercise: 'সাধারণ',
            examTags: []
        }];
    }

    for (const board in ASSORTED_QUIZ_INDEX) {
        for (const className in ASSORTED_QUIZ_INDEX[board]) {
            for (const subject in ASSORTED_QUIZ_INDEX[board][className]) {
                for (const chapter in ASSORTED_QUIZ_INDEX[board][className][subject]) {
                    for (const exercise in ASSORTED_QUIZ_INDEX[board][className][subject][chapter]) {
                        const ids = ASSORTED_QUIZ_INDEX[board][className][subject][chapter][exercise];
                        if (!Array.isArray(ids)) continue;

                        // ✅ STRICT match: base ID must match exactly (case-sensitive)
                        const isMatched = ids.some(entryId => getBaseId(entryId) === targetBaseId);

                        if (isMatched) {
                            const key = `${board}|${className}|${subject}|${chapter}|${exercise}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                matches.push({
                                    board,
                                    class: className,
                                    subject,
                                    chapter,
                                    exercise,
                                    examTags: []
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    if (matches.length === 0) {
        return [{
            board: 'অন্যান্য',
            class: 'অন্যান্য',
            subject: 'অন্যান্য',
            chapter: 'অন্যান্য',
            exercise: 'অন্যান্য',
            examTags: []
        }];
    }

    return matches;
};

// ============================================================
// ✅ Import Data
// ============================================================
const importData = async () => {
    try {
        if (!MAIN_QUIZ_DATA_MAP) {
            console.error('Error: MAIN_QUIZ_DATA_MAP is undefined.');
            process.exit(1);
        }

        await Question.deleteMany();
        console.log('🗑️  Cleared existing questions.');

        let multiCategoryCount = 0;

        const formattedData = MAIN_QUIZ_DATA_MAP.map(item => {
            const allCategories = findAllCategoryInfo(item.id);
            if (allCategories.length > 1) multiCategoryCount++;

            let questionsArray = [];
            if (item.group) {
                questionsArray = (item.questions || []).map(q => ({
                    subId: q.subId,
                    q: q.q,
                    instruction: q.instruction || '',
                    type: q.type || 'MCQ',
                    options: q.options || [],
                    answer: q.answer,
                    explain: q.explain || '',
                    marks: q.marks || 1
                }));
            } else {
                questionsArray = [{
                    subId: item.id + '-sq1',
                    q: item.q || '',
                    instruction: item.instruction || '',
                    type: item.type || 'MCQ',
                    options: item.options || [],
                    answer: item.answer || [],
                    explain: item.explain || '',
                    marks: item.marks || 1
                }];
            }

            return {
                id: item.id,
                isGroup: item.group || false,
                stimulant: item.stimulant || '',
                questions: questionsArray,
                categoryInfo: allCategories,
                level: 'easy',
                createdBy: ADMIN_ID
            };
        });

        await Question.insertMany(formattedData);

        console.log('--- Success: Data successfully imported to MongoDB! ---');
        console.log(`📊 Total questions: ${formattedData.length}`);
        console.log(`📊 Questions with multiple categories: ${multiCategoryCount}`);
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
};

if (process.argv[2] === '-i') {
    importData();
}