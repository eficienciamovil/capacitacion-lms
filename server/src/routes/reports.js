const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(authenticate);

// Admin: all grades and stats
router.get('/grades', requireAdmin, ctrl.allGrades);
router.get('/stats',  requireAdmin, ctrl.dashboardStats);

// Student + Admin: grades for a specific user
router.get('/my-grades', ctrl.myGrades);

// Quiz submit and attempts (accessible by students)
router.post('/courses/:courseId/quiz/submit', ctrl.submitQuiz);
router.get('/courses/:courseId/attempts',     ctrl.getCourseAttempts);

module.exports = router;
