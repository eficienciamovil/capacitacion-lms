const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { videoUpload, presentationUpload } = require('../middleware/upload');
const ctrl = require('../controllers/courseController');

// Public (authenticated)
router.get('/',    authenticate, ctrl.listCourses);
router.get('/:id', authenticate, ctrl.getCourse);

// Streaming / file serving
router.get('/:id/video',        authenticate, ctrl.streamVideo);
router.get('/:id/presentation', authenticate, ctrl.servePresentation);

// Mark material completed
router.post('/:id/complete', authenticate, ctrl.completeMaterial);

// Admin only
router.post('/',    authenticate, requireAdmin, videoUpload.single('video'), presentationUpload.single('presentation'), ctrl.createCourse);
router.post('/:id/upload-video',        authenticate, requireAdmin, videoUpload.single('video'), ctrl.uploadVideo);
router.post('/:id/upload-presentation', authenticate, requireAdmin, presentationUpload.single('presentation'), ctrl.uploadPresentation);
router.put('/:id',  authenticate, requireAdmin, ctrl.updateCourse);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteCourse);

module.exports = router;
