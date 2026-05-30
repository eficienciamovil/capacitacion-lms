const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.use(authenticate, requireAdmin);

router.get('/',      ctrl.listUsers);
router.post('/',     ctrl.createUser);
router.put('/:id',   ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;
