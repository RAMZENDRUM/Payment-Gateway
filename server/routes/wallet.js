const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');

router.get('/balance', auth, walletController.getBalance);
router.get('/transactions', auth, walletController.getTransactions);
router.get('/transaction/:id', auth, walletController.getTransactionById);
router.post('/send', auth, walletController.sendCoins);
router.post('/qr/create', auth, walletController.createPaymentRequest);
router.post('/qr/fulfill', auth, walletController.fulfillPayment);
router.get('/qr/details/:token', auth, walletController.getPaymentDetails);

// Admin route
router.post('/admin/add-coins', auth, walletController.addCoins);
router.post('/sandbox/fund', auth, walletController.sandboxFund);

module.exports = router;
