/* File: backend/routes/categoryRoutes.js
   Version: 2.1.0 - Strict base-ID aware
*/

const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { ASSORTED_QUIZ_INDEX } = require('../../assortedData');

const getBaseId = (rawId) => {
    if (typeof rawId !== 'string') return '';
    return rawId.replace(/(-sq\d+)+$/i, '');
};

function getFilteredItemsFromAssortedData(type, f = {}) {
    const items = [], data = ASSORTED_QUIZ_INDEX;
    if (!data) return items;
    const { board: fb, className: fc, subject: fs, chapter: fch } = f;

    for (const board in data) {
        if (fb && board !== fb) continue;
        for (const className in data[board]) {
            if (fc && className !== fc) continue;
            for (const subject in data[board][className]) {
                if (fs && subject !== fs) continue;
                for (const chapter in data[board][className][subject]) {
                    if (fch && chapter !== fch) continue;

                    if (type === 'board' && !items.includes(board)) items.push(board);
                    else if (type === 'class' && !items.includes(className)) items.push(className);
                    else if (type === 'subject' && !items.includes(subject)) items.push(subject);
                    else if (type === 'chapter' && !items.includes(chapter)) items.push(chapter);
                    else if (type === 'exercise') {
                        for (const exercise in data[board][className][subject][chapter]) {
                            if (!items.includes(exercise)) items.push(exercise);
                        }
                    }
                }
            }
        }
    }
    return items;
}

// ✅ Get all base IDs from assortedData matching filters
function getBaseIdsFromAssortedData(f = {}) {
    const data = ASSORTED_QUIZ_INDEX;
    const baseIds = new Set();
    if (!data) return baseIds;
    const { board: fb, className: fc, subject: fs, chapter: fch, exercise: fe } = f;

    for (const board in data) {
        if (fb && board !== fb) continue;
        for (const className in data[board]) {
            if (fc && className !== fc) continue;
            for (const subject in data[board][className]) {
                if (fs && subject !== fs) continue;
                for (const chapter in data[board][className][subject]) {
                    if (fch && chapter !== fch) continue;
                    for (const exercise in data[board][className][subject][chapter]) {
                        if (fe && exercise !== fe) continue;
                        const ids = data[board][className][subject][chapter][exercise];
                        if (Array.isArray(ids)) {
                            ids.forEach(rawId => {
                                const base = getBaseId(rawId);
                                if (base) baseIds.add(base);
                            });
                        }
                    }
                }
            }
        }
    }
    return baseIds;
}

router.get('/', async (req, res) => {
    try {
        const { board, className, subject, chapter } = req.query;
        const filters = { board, className, subject, chapter };

        // ✅ Get allowed base IDs from assortedData
        const allowedBaseIds = getBaseIdsFromAssortedData(filters);

        // ✅ Get DB distinct values ONLY for allowed questions
        const dbQuery = allowedBaseIds.size > 0
            ? { id: { $in: [...allowedBaseIds] } }
            : {};

        const [dbBoards, dbClasses, dbSubjects, dbChapters, dbExercises] = await Promise.all([
            Question.distinct('categoryInfo.board', dbQuery),
            Question.distinct('categoryInfo.class', dbQuery),
            Question.distinct('categoryInfo.subject', dbQuery),
            Question.distinct('categoryInfo.chapter', dbQuery),
            Question.distinct('categoryInfo.exercise', dbQuery)
        ]);

        const [aBoards, aClasses, aSubjects, aChapters, aExercises] = [
            getFilteredItemsFromAssortedData('board', filters),
            getFilteredItemsFromAssortedData('class', filters),
            getFilteredItemsFromAssortedData('subject', filters),
            getFilteredItemsFromAssortedData('chapter', filters),
            getFilteredItemsFromAssortedData('exercise', filters)
        ];

        const intersect = (aItems, dbItems) => {
            if (!aItems.length) return dbItems;
            const dbSet = new Set(dbItems);
            return aItems.filter(item => dbSet.has(item));
        };

        const finalBoards = intersect(aBoards, dbBoards);
        const finalClasses = intersect(aClasses, dbClasses);
        const finalSubjects = intersect(aSubjects, dbSubjects);
        const finalChapters = intersect(aChapters, dbChapters);
        const finalExercises = intersect(aExercises, dbExercises);

        res.status(200).json({
            success: true,
            data: {
                boards: finalBoards.length ? finalBoards : dbBoards,
                classes: finalClasses.length ? finalClasses : dbClasses,
                subjects: finalSubjects.length ? finalSubjects : dbSubjects,
                chapters: finalChapters.length ? finalChapters : dbChapters,
                exercises: finalExercises.length ? finalExercises : dbExercises
            }
        });
    } catch (err) {
        console.error('Category route error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
            data: { boards: [], classes: [], subjects: [], chapters: [], exercises: [] }
        });
    }
});

module.exports = router;