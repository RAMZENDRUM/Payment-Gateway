const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const authMiddleware = require('../middleware/auth');

// All routes protected by user login
router.get('/', authMiddleware, appsController.getMyApps);
router.get('/logs', authMiddleware, appsController.getWebhookLogs);
router.post('/', authMiddleware, appsController.createApp);
router.delete('/:id', authMiddleware, appsController.deleteApp);
router.get('/:id/transactions', authMiddleware, appsController.getAppTransactions);

module.exports = router;
