const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const MAX_RECHARGE = 200000;
const MAX_BALANCE = 1000000;

exports.getBalance = async (req, res) => {
    try {
        const balance = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
        res.json(balance.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await db.query(
            `SELECT t.*, u_s.full_name as sender_name, u_r.full_name as receiver_name 
             FROM transactions t
             LEFT JOIN users u_s ON t.sender_id = u_s.id
             JOIN users u_r ON t.receiver_id = u_r.id
             WHERE t.sender_id = $1 OR t.receiver_id = $1
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        res.json(transactions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await db.query(
            `SELECT t.*, 
                COALESCE(u_s.full_name, 'ZenWallet System') as sender_name, 
                COALESCE(u_s.upi_id, 'system@zenwallet') as sender_upi_id,
                u_r.full_name as receiver_name, 
                u_r.upi_id as receiver_upi_id
             FROM transactions t
             LEFT JOIN users u_s ON t.sender_id = u_s.id
             LEFT JOIN users u_r ON t.receiver_id = u_r.id
             WHERE t.id = $1 AND (t.sender_id = $2 OR t.receiver_id = $2 OR t.sender_id IS NULL AND t.receiver_id = $2)`,
            [req.params.id, req.user.id]
        );

        if (transaction.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.sendCoins = async (req, res) => {
    const { receiverUpiId, amount, referenceId } = req.body;
    const senderId = req.user.id;

    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount > 200000) return res.status(400).json({ message: 'Maximum transfer limit is ₹2,00,000' });

    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Get receiver by UPI ID (upi_id column)
        const receiver = await client.query('SELECT id FROM users WHERE upi_id = $1', [receiverUpiId]);
        if (receiver.rows.length === 0) {
            throw new Error('Receiver ZenWallet ID not found');
        }
        const receiverId = receiver.rows[0].id;

        if (senderId === receiverId) {
            throw new Error('Cannot send to yourself');
        }

        // Check sender balance
        const senderWallet = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [senderId]);
        if (senderWallet.rows[0].balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct from sender
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, senderId]);

        // Check receiver balance capacity
        const receiverWallet = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [receiverId]);
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error(`Receiver's wallet cannot hold more than ${MAX_BALANCE} C.`);
        }

        // Credit receiver
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, receiverId]);

        // Record transaction
        const txResult = await client.query(
            'INSERT INTO transactions (sender_id, receiver_id, amount, type, reference_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [senderId, receiverId, amount, 'TRANSFER', referenceId]
        );

        const transaction = txResult.rows[0];

        // Fetch names for the receipt
        const sender = await client.query('SELECT full_name, upi_id FROM users WHERE id = $1', [senderId]);

        await client.query('COMMIT');
        res.json({
            message: 'Transfer successful',
            transaction: {
                ...transaction,
                sender_name: sender.rows[0].full_name,
                sender_upi_id: sender.rows[0].upi_id,
                receiver_name: receiver.rows[0].full_name,
                receiver_upi_id: receiver.rows[0].upi_id
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: err.message });
    } finally {
        release();
    }
};

// QR Payment Logic
exports.createPaymentRequest = async (req, res) => {
    const { amount, referenceId } = req.body;
    if (amount > 200000) return res.status(400).json({ message: 'Maximum request limit is ₹2,00,000' });
    const receiverId = req.user.id; // The one generating the QR is the receiver

    try {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes expiry

        const request = await db.query(
            'INSERT INTO payment_requests (receiver_id, amount, reference_id, token, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [receiverId, amount, referenceId, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const paymentUrl = `${frontendUrl}/scan?token=${token}`;

        res.json({
            qrData: paymentUrl,
            request: request.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.fulfillPayment = async (req, res) => {
    const { token } = req.body;
    const senderId = req.user.id;

    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Get and validate request
        const request = await client.query('SELECT * FROM payment_requests WHERE token = $1 FOR UPDATE', [token]);
        if (request.rows.length === 0) throw new Error('Invalid QR code');

        const reqData = request.rows[0];
        if (reqData.status !== 'PENDING') throw new Error('QR code already used or expired');
        if (new Date(reqData.expires_at) < new Date()) {
            await client.query('UPDATE payment_requests SET status = $1 WHERE token = $2', ['EXPIRED', token]);
            throw new Error('QR code expired');
        }

        const { amount, receiver_id, reference_id } = reqData;

        if (senderId === receiver_id) {
            throw new Error('You cannot pay yourself');
        }

        // Check sender balance
        const senderWallet = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [senderId]);
        if (parseFloat(senderWallet.rows[0].balance) < parseFloat(amount)) throw new Error('Insufficient balance');

        // Check receiver balance capacity
        const receiverWallet = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [receiver_id]);
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error(`Merchant's wallet is at capacity (Max ${MAX_BALANCE} C).`);
        }

        // Atomic Transfer
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, senderId]);
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, receiver_id]);

        // Record transaction
        await client.query(
            'INSERT INTO transactions (sender_id, receiver_id, amount, type, reference_id) VALUES ($1, $2, $3, $4, $5)',
            [senderId, receiver_id, amount, 'PAYMENT', reference_id]
        );

        // Mark request as completed
        await client.query('UPDATE payment_requests SET status = $1 WHERE token = $2', ['COMPLETED', token]);

        await client.query('COMMIT');
        res.json({ message: 'Payment successful', amount, receiver_id });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: err.message });
    } finally {
        release();
    }
};

exports.getPaymentDetails = async (req, res) => {
    const { token } = req.params;
    try {
        const request = await db.query(
            `SELECT pr.*, u.full_name as receiver_name, pr.callback_url 
       FROM payment_requests pr
       JOIN users u ON pr.receiver_id = u.id
       WHERE pr.token = $1`,
            [token]
        );
        if (request.rows.length === 0) return res.status(404).json({ message: 'Invalid QR' });
        res.json(request.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin/Manual add coins
exports.addCoins = async (req, res) => {
    const { userId, amount } = req.body;

    if (amount > MAX_RECHARGE) {
        return res.status(400).json({ message: `Maximum recharge amount is ${MAX_RECHARGE} C.` });
    }

    try {
        const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        if (parseFloat(wallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            return res.status(400).json({ message: `Wallet balance cannot exceed ${MAX_BALANCE} C.` });
        }

        await db.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, userId]);
        const txResult = await db.query(
            'INSERT INTO transactions (receiver_id, amount, type, reference_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, amount, 'RECHARGE', 'Asset Top-up']
        );

        const transaction = txResult.rows[0];
        const user = await db.query('SELECT full_name, upi_id FROM users WHERE id = $1', [userId]);

        res.json({
            success: true,
            message: 'Coins added successfully',
            transaction: {
                ...transaction,
                sender_name: 'ZenWallet Treasury',
                sender_upi_id: 'system@zenwallet',
                receiver_name: user.rows[0].full_name,
                receiver_upi_id: user.rows[0].upi_id
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Sandbox Self-Fund
exports.sandboxFund = async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Limit sandbox funding to avoid abuse even in dev? Nah, it's sandbox.
    // Limit recharge to 10k
    if (amount > MAX_RECHARGE) {
        return res.status(400).json({ message: `Maximum recharge amount is ${MAX_RECHARGE} C.` });
    }

    try {
        const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        if (parseFloat(wallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            return res.status(400).json({ message: `Wallet balance cannot exceed ${MAX_BALANCE} C.` });
        }

        await db.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2', [amount, userId]);
        await db.query(
            'INSERT INTO transactions (receiver_id, amount, type, reference_id) VALUES ($1, $2, $3, $4)',
            [userId, amount, 'RECHARGE', 'Sandbox Faucet']
        );
        res.json({ message: 'Sandbox funds added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
