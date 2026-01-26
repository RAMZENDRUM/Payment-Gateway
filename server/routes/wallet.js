const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');

router.get('/balance', auth, walletController.getBalance);
router.get('/transactions', auth, walletController.getTransactions);
router.post('/send', auth, walletController.sendCoins);
router.post('/qr/create', auth, walletController.createPaymentRequest);
router.post('/qr/fulfill', auth, walletController.fulfillPayment);
router.get('/qr/details/:token', auth, walletController.getPaymentDetails);

// Admin route
router.post('/admin/add-coins', auth, walletController.addCoins);

module.exports = router;
