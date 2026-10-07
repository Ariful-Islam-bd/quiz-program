/* File: backend/routes/quizRoutes.js
   Version: 1.1.2 - Optimized
*/

const express = require('express');
const { createQuestion, getQuestions, getFilteredQuizzes } = require('../controllers/quizController');
const router = express.Router();

router.get('/filter', getFilteredQuizzes);
router.route('/').get(getQuestions).post(createQuestion);

module.exports = router;