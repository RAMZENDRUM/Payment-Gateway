const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const MERCHANT_API_KEY = process.env.MERCHANT_API_KEY || 'default-merchant-key';

/**
 * DIRECT WALLET TRANSFER (NO QR)
 * This is the new real-time payment flow
 */
exports.directWalletTransfer = async (req, res) => {
    const apiKey = req.header('x-api-key');
    if (apiKey !== MERCHANT_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API Key'
        });
    }

    const { fromUserId, toWalletId, amount, referenceId, orderId } = req.body;

    // Validation
    if (!fromUserId || !toWalletId || !amount || !orderId) {
        return res.status(400).json({
            success: false,
            message: 'fromUserId, toWalletId, amount, and orderId are required'
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
        });
    }

    const { client, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // 1. Verify both users exist
        const sender = await client.query('SELECT id, full_name FROM users WHERE id = $1', [fromUserId]);
        const receiver = await client.query('SELECT id, full_name FROM users WHERE id = $1', [toWalletId]);

        if (sender.rows.length === 0) {
            throw new Error('SENDER_NOT_FOUND');
        }

        if (receiver.rows.length === 0) {
            throw new Error('RECEIVER_NOT_FOUND');
        }

        // 2. Check sender balance (with row lock)
        const senderWallet = await client.query(
            'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
            [fromUserId]
        );

        if (senderWallet.rows.length === 0) {
            throw new Error('SENDER_WALLET_NOT_FOUND');
        }

        const currentBalance = parseFloat(senderWallet.rows[0].balance);

        if (currentBalance < amount) {
            throw new Error('INSUFFICIENT_BALANCE');
        }

        // 3. Perform atomic transfer
        await client.query(
            'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
            [amount, fromUserId]
        );

        await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [amount, toWalletId]
        );

        // 4. Record transaction
        const transaction = await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, type, status, reference_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
             RETURNING id, created_at`,
            [fromUserId, toWalletId, amount, 'PAYMENT', 'SUCCESS', referenceId || orderId]
        );

        await client.query('COMMIT');

        const transactionId = transaction.rows[0].id;
        const transactionTime = transaction.rows[0].created_at;

        // 5. Get Socket.IO instance and emit real-time updates
        const io = req.app.get('io');

        // Notify the merchant website (Website A)
        io.to(orderId).emit('payment-success', {
            orderId,
            transactionId,
            amount,
            status: 'SUCCESS',
            timestamp: transactionTime
        });

        // Notify the wallet app user (if they're connected)
        io.emit('wallet-update', {
            userId: fromUserId,
            type: 'DEBIT',
            amount,
            newBalance: currentBalance - amount,
            transactionId
        });

        // Notify the receiver (merchant)
        io.emit('wallet-update', {
            userId: toWalletId,
            type: 'CREDIT',
            amount,
            transactionId
        });

        // 6. Return success response
        res.json({
            success: true,
            status: 'SUCCESS',
            transactionId,
            message: 'Transfer completed successfully',
            data: {
                amount,
                from: sender.rows[0].full_name,
                to: receiver.rows[0].full_name,
                timestamp: transactionTime
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');

        // Handle specific errors
        let errorMessage = 'Transfer failed';
        let statusCode = 400;

        switch (err.message) {
            case 'INSUFFICIENT_BALANCE':
                errorMessage = 'Insufficient balance in wallet';
                statusCode = 402; // Payment Required
                break;
            case 'SENDER_NOT_FOUND':
                errorMessage = 'Sender user not found';
                statusCode = 404;
                break;
            case 'RECEIVER_NOT_FOUND':
                errorMessage = 'Receiver user not found';
                statusCode = 404;
                break;
            case 'SENDER_WALLET_NOT_FOUND':
                errorMessage = 'Sender wallet not found';
                statusCode = 404;
                break;
            default:
                errorMessage = err.message;
                console.error('Transfer error:', err);
        }

        // Emit failure event
        const io = req.app.get('io');
        io.to(orderId).emit('payment-failed', {
            orderId,
            status: 'FAILED',
            reason: errorMessage,
            timestamp: new Date()
        });

        res.status(statusCode).json({
            success: false,
            status: 'FAILED',
            message: errorMessage
        });

    } finally {
        release();
    }
};

exports.createPaymentRequestExternal = async (req, res) => {
    const apiKey = req.header('x-api-key');
    if (apiKey !== MERCHANT_API_KEY) {
        return res.status(401).json({ message: 'Invalid API Key' });
    }

    const { amount, referenceId, merchantId, callbackUrl } = req.body;

    if (!amount || !merchantId) {
        return res.status(400).json({ message: 'Amount and merchantId are required' });
    }

    try {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes for external

        // Verify merchant exists
        const merchant = await db.query('SELECT id FROM users WHERE id = $1', [merchantId]);
        if (merchant.rows.length === 0) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        const request = await db.query(
            'INSERT INTO payment_requests (receiver_id, amount, reference_id, token, expires_at, callback_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [merchantId, amount, referenceId, token, expiresAt, callbackUrl]
        );

        res.json({
            success: true,
            data: {
                paymentUrl: `http://localhost:5173/scan?token=${token}`, // Link to the wallet app scan page with token
                token: token,
                qrData: JSON.stringify({
                    token,
                    amount,
                    receiverId: merchantId,
                    referenceId,
                    expiresAt
                }),
                expiresAt
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkPaymentStatus = async (req, res) => {
    const apiKey = req.header('x-api-key');
    if (apiKey !== MERCHANT_API_KEY) {
        return res.status(401).json({ message: 'Invalid API Key' });
    }

    const { token } = req.params;

    try {
        const request = await db.query('SELECT status, amount, reference_id, created_at FROM payment_requests WHERE token = $1', [token]);
        if (request.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(request.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.verifyPaymentByReference = async (req, res) => {
    const apiKey = req.header('x-api-key');
    if (apiKey !== MERCHANT_API_KEY) {
        return res.status(401).json({ message: 'Invalid API Key' });
    }

    const { merchantId, referenceId } = req.query;

    if (!merchantId || !referenceId) {
        return res.status(400).json({ message: 'merchantId and referenceId are required' });
    }

    try {
        // Source of truth: check the actual transactions table
        const transaction = await db.query(
            'SELECT * FROM transactions WHERE receiver_id = $1 AND reference_id = $2 AND status = $3',
            [merchantId, referenceId, 'SUCCESS']
        );

        if (transaction.rows.length > 0) {
            return res.json({
                received: true,
                message: 'YES: Payment is received',
                details: {
                    amount: transaction.rows[0].amount,
                    id: transaction.rows[0].id,
                    time: transaction.rows[0].created_at
                }
            });
        } else {
            return res.json({
                received: false,
                message: 'NOT RECEIVED: No matching transaction found'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
