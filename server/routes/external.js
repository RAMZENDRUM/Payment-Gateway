const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// New: Direct wallet transfer (Protected by API Key)
router.post('/transfer', apiKeyAuth, externalController.directWalletTransfer);

// Legacy: QR-based flow (Protected by API Key)
router.post('/create-request', apiKeyAuth, externalController.createPaymentRequestExternal);
router.get('/status/:token', externalController.checkPaymentStatus); // Public status check is usually fine, or secure it too? Public is better for polling.
router.get('/verify-reference', apiKeyAuth, externalController.verifyPaymentByReference);

module.exports = router;
