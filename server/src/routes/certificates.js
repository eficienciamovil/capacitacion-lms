const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/certificateController');

router.use(authenticate);

router.get('/',          ctrl.listCertificates);
router.get('/:id/download', ctrl.downloadCertificate);

module.exports = router;
