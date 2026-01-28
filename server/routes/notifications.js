const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationsController.getNotifications);
router.put('/:id/read', auth, notificationsController.markAsRead);
router.post('/broadcast', auth, notificationsController.sendGlobalMessage);

module.exports = router;
