const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/questionController');

router.use(authenticate, requireAdmin);

// Questions
router.post('/course/:courseId', ctrl.addQuestion);
router.put('/:id',              ctrl.updateQuestion);
router.delete('/:id',           ctrl.deleteQuestion);

// Options
router.post('/:questionId/options',  ctrl.addOption);
router.put('/options/:id',           ctrl.updateOption);
router.delete('/options/:id',        ctrl.deleteOption);

module.exports = router;
