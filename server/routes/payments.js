const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Protected by API Key
router.post('/', apiKeyAuth, paymentsController.createPayment);
router.post('/:id/simulate', apiKeyAuth, paymentsController.simulateStatus);
router.get('/:id', apiKeyAuth, paymentsController.getPayment);

module.exports = router;
