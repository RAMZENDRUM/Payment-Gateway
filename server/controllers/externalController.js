const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const MERCHANT_API_KEY = process.env.MERCHANT_API_KEY || 'default-merchant-key';
const MAX_BALANCE = 500000;

/**
 * DIRECT WALLET TRANSFER (NO QR)
 * This is the new real-time payment flow
 */
exports.directWalletTransfer = async (req, res) => {
    let { fromUserId, toWalletId, amount, referenceId, orderId, cardNumber, cardCvv, cardExpiry, password } = req.body;

    const bcrypt = require('bcryptjs'); // Ensure bcrypt is available

    const { client, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Flow A: direct Auth via Card + Password
        if (!fromUserId && cardNumber && password) {
            console.log('Authenticating via Card + Password...');
            // 1. Resolve User ID from Card
            const rawCard = cardNumber.replace(/\s/g, "");
            // Split Expiry
            let expiryMonth, expiryYear;
            if (cardExpiry && cardExpiry.includes('/')) {
                [expiryMonth, expiryYear] = cardExpiry.split('/');
                expiryYear = `20${expiryYear}`;
            }

            const cardRes = await client.query(
                `SELECT user_id FROM virtual_cards 
                 WHERE card_number = $1 AND cvv = $2`, // And expiry if needed, but CVV is strong enough for lookup
                [rawCard, cardCvv]
            );

            if (cardRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Invalid Card Details' });
            }
            fromUserId = cardRes.rows[0].user_id;

            // 2. Verify Password
            const userRes = await client.query('SELECT password FROM users WHERE id = $1', [fromUserId]);
            if (userRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'User not found' });
            }

            const validPassword = await bcrypt.compare(password, userRes.rows[0].password);
            if (!validPassword) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Invalid Password' });
            }
            console.log(`User Authenticated: ${fromUserId}`);
        }

        // Validation
        if (!fromUserId || !toWalletId || !amount || !orderId) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'fromUserId (or card auth), toWalletId, amount, and orderId are required'
            });
        }

        // 1. Verify both users exist (Sender already found if using card auth, but good to double check or re-select details)
        const sender = await client.query('SELECT id, full_name FROM users WHERE id = $1', [fromUserId]);
        const receiver = await client.query('SELECT id, full_name FROM users WHERE id = $1', [toWalletId]);


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

        // 2.5 Check receiver capacity
        const receiverWallet = await client.query(
            'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
            [toWalletId]
        );
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error('RECEIVER_BALANCE_EXCEEDED');
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
        const senderBalAfter = currentBalance - amount;
        const receiverBalAfter = parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount);

        const transaction = await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, type, status, reference_id, created_at, sender_balance_after, receiver_balance_after, app_id) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9) 
             RETURNING id, created_at`,
            [fromUserId, toWalletId, amount, 'PAYMENT', 'SUCCESS', referenceId || orderId, senderBalAfter, receiverBalAfter, req.clientApp.id]
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
            case 'RECEIVER_BALANCE_EXCEEDED':
                errorMessage = `Receiver's wallet balance cannot exceed ${MAX_BALANCE} C.`;
                statusCode = 422;
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
    const { amount, referenceId, merchantId, callbackUrl, preferredMethod } = req.body;

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
            'INSERT INTO payment_requests (receiver_id, amount, reference_id, token, expires_at, callback_url, app_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [merchantId, amount, referenceId, token, expiresAt, callbackUrl, req.clientApp.id]
        );

        // Calculate deployment URL
        const BASE_URL = process.env.FRONTEND_URL || 'https://payment-gateway-beta-two.vercel.app';

        res.json({
            success: true,
            data: {
                paymentUrl: `${BASE_URL}/scan?token=${token}${preferredMethod ? `&method=${preferredMethod}` : ''}`,
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

exports.fulfillExternalPayment = async (req, res) => {
    const { token, paymentMethod, paymentDetails } = req.body;

    const { client, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // 1. Get and validate request
        const request = await client.query('SELECT * FROM payment_requests WHERE token = $1 FOR UPDATE', [token]);
        if (request.rows.length === 0) throw new Error('Invalid payment token');

        const reqData = request.rows[0];
        if (reqData.status !== 'PENDING') throw new Error('Payment already processed or expired');
        if (new Date(reqData.expires_at) < new Date()) {
            await client.query('UPDATE payment_requests SET status = $1 WHERE token = $2', ['EXPIRED', token]);
            throw new Error('Payment request expired');
        }

        const { amount, receiver_id, reference_id } = reqData;

        // 2. Simulate external payment processing (Card/UPI/etc)
        // In reality, you'd call Stripe/Razorpay here.
        console.log(`Processing ${paymentMethod} payment for ${amount}...`);

        // 2.5 Check receiver capacity
        const receiverWallet = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [receiver_id]);
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error(`Merchant's wallet is at capacity (Max ${MAX_BALANCE} C).`);
        }

        // 3. Credit merchant's ZenWallet
        await client.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [amount, receiver_id]);

        // 4. Record transaction (sender_id is null for external payments)
        const receiverBalAfter = parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount);
        const transaction = await client.query(
            `INSERT INTO transactions (receiver_id, amount, type, status, reference_id, created_at, receiver_balance_after, app_id) 
             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) 
             RETURNING id, created_at`,
            [receiver_id, amount, 'PAYMENT', 'SUCCESS', reference_id, receiverBalAfter, reqData.app_id]
        );

        // 5. Mark request as completed
        await client.query('UPDATE payment_requests SET status = $1 WHERE token = $2', ['COMPLETED', token]);

        await client.query('COMMIT');

        // 6. Notify merchant via WebSocket
        const io = req.app.get('io');
        io.to(reference_id).emit('payment-success', {
            referenceId: reference_id,
            amount,
            status: 'SUCCESS',
            timestamp: transaction.rows[0].created_at
        });

        res.json({
            success: true,
            message: 'External payment successful',
            transactionId: transaction.rows[0].id
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Fulfill external error:', err);
        res.status(400).json({ success: false, message: err.message });
    } finally {
        release();
    }
};

exports.checkPaymentStatus = async (req, res) => {
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
exports.verifyCard = async (req, res) => {
    const { cardNumber, cvv, expiryMonth, expiryYear, amount } = req.body;

    if (!cardNumber || !cvv || !expiryMonth || !expiryYear) {
        return res.status(400).json({ success: false, message: 'Missing card details' });
    }

    try {
        const rawCard = cardNumber.replace(/\s/g, "");
        // Join with wallets to check balance and users to get identity
        const result = await db.query(
            `SELECT vc.user_id, vc.*, w.balance, u.full_name, u.email 
             FROM virtual_cards vc
             JOIN wallets w ON vc.user_id = w.user_id
             JOIN users u ON vc.user_id = u.id
             WHERE vc.card_number = $1 AND vc.cvv = $2 AND vc.expiry_month = $3 AND vc.expiry_year = $4`,
            [rawCard, cvv, expiryMonth, expiryYear]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid card details. User not exists in ZenWallet system.' });
        }

        const card = result.rows[0];
        console.log('Verified Card Data:', card);

        if (amount && parseFloat(card.balance) < parseFloat(amount)) {
            return res.status(200).json({
                success: false,
                message: `Insufficient funds. Your balance is ${card.balance} C, but this purchase requires ${amount} C.`,
                user: {
                    fullName: card.full_name,
                    email: card.email
                }
            });
        }

        res.json({
            success: true,
            message: 'Card verified and balance sufficient',
            user: {
                id: card.user_id || card.userId || card.id, // Fallbacks
                fullName: card.full_name,
                email: card.email
            }
        });
    } catch (err) {
        console.error('Verify Card Error:', err);
        res.status(500).json({ success: false, message: 'Server error during card verification' });
    }
};
