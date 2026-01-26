const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

// New: Direct wallet transfer (no QR)
router.post('/transfer', externalController.directWalletTransfer);

// Legacy: QR-based flow (keeping for backward compatibility)
router.post('/create-request', externalController.createPaymentRequestExternal);
router.get('/status/:token', externalController.checkPaymentStatus);
router.get('/verify-reference', externalController.verifyPaymentByReference);

module.exports = router;
