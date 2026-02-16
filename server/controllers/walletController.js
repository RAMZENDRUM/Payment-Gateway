const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const MAX_RECHARGE = 200000;
const MAX_BALANCE = 1000000;

exports.getBalance = async (req, res) => {
    try {
        const balance = await db.query('SELECT balance FROM public.wallets WHERE user_id::text = $1', [req.user.id]);
        if (balance.rows.length === 0) {
            return res.json({ balance: 0 });
        }
        res.json(balance.rows[0]);
    } catch (err) {
        console.error('❌ [getBalance] Error Details:', {
            message: err.message,
            code: err.code,
            userId: req.user.id
        });
        res.status(500).json({ message: 'Server error while fetching balance' });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await db.query(
            `SELECT t.*, 
                u_s.full_name as sender_name,
                u_s.upi_id as sender_upi_id,
                u_r.full_name as receiver_name,
                u_r.upi_id as receiver_upi_id,
                a.name as app_name,
                CASE 
                    WHEN t.sender_id::text = $1 THEN t.sender_balance_after
                    WHEN t.receiver_id::text = $1 THEN t.receiver_balance_after
                    ELSE NULL
                END as balance_after
             FROM public.transactions t
             LEFT JOIN public.users u_s ON t.sender_id::text = u_s.id::text
             LEFT JOIN public.users u_r ON t.receiver_id::text = u_r.id::text
             LEFT JOIN public.apps a ON t.app_id::text = a.id::text
             WHERE t.sender_id::text = $1 OR t.receiver_id::text = $1
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        res.json(transactions.rows);
    } catch (err) {
        console.error('❌ [getTransactions] Error Details:', {
            message: err.message,
            code: err.code,
            userId: req.user.id
        });
        res.status(500).json({ message: 'Server error while fetching transactions' });
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
             FROM public.transactions t
             LEFT JOIN public.users u_s ON t.sender_id::text = u_s.id::text
             LEFT JOIN public.users u_r ON t.receiver_id::text = u_r.id::text
             WHERE t.id::text = $1 AND (t.sender_id::text = $2 OR t.receiver_id::text = $2 OR t.sender_id IS NULL AND t.receiver_id::text = $2)`,
            [req.params.id, req.user.id]
        );

        if (transaction.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction.rows[0]);
    } catch (err) {
        console.error('❌ [getTransactionById] Error Details:', {
            message: err.message,
            code: err.code,
            transactionId: req.params.id,
            userId: req.user.id
        });
        res.status(500).json({ message: 'Server error while fetching transaction' });
    }
};

exports.sendCoins = async (req, res) => {
    const { receiverUpiId, amount, referenceId, pin } = req.body;
    const senderId = req.user.id;

    if (!pin) return res.status(400).json({ message: 'Payment PIN is required' });
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (amount > 200000) return res.status(400).json({ message: 'Maximum transfer limit is ₹2,00,000' });

    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Verify PIN
        const user = await client.query('SELECT payment_pin FROM public.users WHERE id::text = $1', [senderId]);
        if (!user.rows[0].payment_pin) {
            throw new Error('Please set your Payment PIN in settings before making transactions');
        }
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(pin, user.rows[0].payment_pin);
        if (!isMatch) {
            throw new Error('Incorrect Payment PIN');
        }

        // Get receiver by UPI ID (upi_id column)
        const receiver = await client.query('SELECT id, full_name, upi_id FROM public.users WHERE upi_id = $1', [receiverUpiId]);
        if (receiver.rows.length === 0) {
            throw new Error('Receiver ZenWallet ID not found');
        }
        const receiverId = receiver.rows[0].id;

        if (senderId.toString() === receiverId.toString()) {
            throw new Error('Cannot send to yourself');
        }

        // Check sender balance
        const senderWallet = await client.query('SELECT balance FROM public.wallets WHERE user_id::text = $1 FOR UPDATE', [senderId]);
        if (parseFloat(senderWallet.rows[0].balance) < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct from sender
        await client.query('UPDATE public.wallets SET balance = balance - $1 WHERE user_id::text = $2', [amount, senderId]);

        // Check receiver balance capacity
        const receiverWallet = await client.query('SELECT balance FROM public.wallets WHERE user_id::text = $1 FOR UPDATE', [receiverId]);
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error(`Receiver's wallet cannot hold more than ${MAX_BALANCE} C.`);
        }

        // Credit receiver
        await client.query('UPDATE public.wallets SET balance = balance + $1 WHERE user_id::text = $2', [amount, receiverId]);

        // Record transaction
        const senderBalAfter = parseFloat(senderWallet.rows[0].balance) - parseFloat(amount);
        const receiverBalAfter = parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount);

        const txResult = await client.query(
            'INSERT INTO public.transactions (sender_id, receiver_id, amount, type, reference_id, sender_balance_after, receiver_balance_after, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [senderId, receiverId, amount, 'TRANSFER', referenceId, senderBalAfter, receiverBalAfter, 'SUCCESS']
        );

        const transaction = txResult.rows[0];

        // Fetch sender info for the receipt
        const sender = await client.query('SELECT full_name, upi_id FROM public.users WHERE id::text = $1', [senderId]);

        await client.query('COMMIT');
        // Emit Socket Events
        const io = req.app.get('io');
        if (io) {
            // Notify receiver
            io.to(`user_${receiverId}`).emit('payment-received', {
                amount,
                sender_name: sender.rows[0].full_name,
                reference_id: referenceId,
                newBalance: parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount)
            });
            // Notify sender
            io.to(`user_${senderId}`).emit('payment-sent', {
                amount,
                receiver_name: receiver.rows[0].full_name,
                reference_id: referenceId,
                newBalance: parseFloat(senderWallet.rows[0].balance) - parseFloat(amount)
            });
        }

        // Create notification for Receiver
        await client.query(
            'INSERT INTO public.notifications (user_id, type, title, short_message, full_message) VALUES ($1, $2, $3, $4, $5)',
            [receiverId, 'TRANSACTION', 'Payment Received', `Received ₹${amount} from ${sender.rows[0].full_name}`, `You have received a payment of ₹${amount} from ${sender.rows[0].full_name} (${sender.rows[0].upi_id}). Reference: ${referenceId}`]
        );

        // Create notification for Sender
        await client.query(
            'INSERT INTO public.notifications (user_id, type, title, short_message, full_message) VALUES ($1, $2, $3, $4, $5)',
            [senderId, 'TRANSACTION', 'Payment Sent', `Sent ₹${amount} to ${receiver.rows[0].full_name || 'User'}`, `You have successfully sent ₹${amount} to ${receiver.rows[0].full_name || 'User'}. Reference: ${referenceId}`]
        );

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
    const { amount, referenceId, taxName, taxPercentage, feesAmount } = req.body;
    if (amount > 200000) return res.status(400).json({ message: 'Maximum request limit is ₹2,00,000' });
    const receiverId = req.user.id;

    // Calculate tax and total
    let baseAmount = parseFloat(amount);
    let calcTaxAmount = 0;
    if (taxPercentage && baseAmount) {
        calcTaxAmount = (baseAmount * parseFloat(taxPercentage)) / 100;
    }

    const fees = parseFloat(feesAmount || 0);
    const totalPayable = baseAmount + calcTaxAmount + fees;

    try {
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes expiry

        const request = await db.query(
            `INSERT INTO public.payment_requests 
             (receiver_id, amount, reference_id, token, expires_at, tax_name, tax_percentage, tax_amount, fees_amount) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [receiverId, totalPayable, referenceId, token, expiresAt, taxName, taxPercentage, calcTaxAmount, fees]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const paymentUrl = `${frontendUrl}/scan?token=${token}`;

        res.json({
            qrData: paymentUrl,
            request: request.rows[0],
            total: totalPayable
        });
    } catch (err) {
        console.error('❌ [createPaymentRequest] Error Details:', {
            message: err.message,
            code: err.code,
            receiverId,
            userId: req.user.id
        });
        res.status(500).json({ message: 'Server error while creating payment request' });
    }
};

exports.fulfillPayment = async (req, res) => {
    const { token, pin } = req.body;
    const senderId = req.user.id;

    if (!pin) return res.status(400).json({ message: 'Payment PIN is required' });

    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Verify PIN
        const user = await client.query('SELECT payment_pin FROM public.users WHERE id::text = $1', [senderId]);
        if (user.rows.length === 0 || !user.rows[0].payment_pin) {
            throw new Error('Please set your Payment PIN in dashboard before paying');
        }
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(pin, user.rows[0].payment_pin);
        if (!isMatch) {
            throw new Error('Incorrect Payment PIN');
        }

        // Get and validate request
        const request = await client.query('SELECT * FROM public.payment_requests WHERE token = $1 FOR UPDATE', [token]);
        if (request.rows.length === 0) throw new Error('Invalid QR code');

        const reqData = request.rows[0];
        if (reqData.status !== 'PENDING') throw new Error('QR code already used or expired');
        if (new Date(reqData.expires_at) < new Date()) {
            await client.query('UPDATE public.payment_requests SET status = $1 WHERE token = $2', ['EXPIRED', token]);
            throw new Error('QR code expired');
        }

        const { amount, receiver_id, reference_id } = reqData;

        if (senderId.toString() === receiver_id.toString()) {
            throw new Error('You cannot pay yourself');
        }

        // Check sender balance
        const senderWallet = await client.query('SELECT balance FROM public.wallets WHERE user_id::text = $1 FOR UPDATE', [senderId]);
        if (parseFloat(senderWallet.rows[0].balance) < parseFloat(amount)) throw new Error('Insufficient balance');

        // Check receiver balance capacity
        const receiverWallet = await client.query('SELECT balance FROM public.wallets WHERE user_id::text = $1 FOR UPDATE', [receiver_id]);
        if (parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            throw new Error(`Merchant's wallet is at capacity (Max ${MAX_BALANCE} C).`);
        }

        // Atomic Transfer
        await client.query('UPDATE public.wallets SET balance = balance - $1 WHERE user_id::text = $2', [amount, senderId]);
        await client.query('UPDATE public.wallets SET balance = balance + $1 WHERE user_id::text = $2', [amount, receiver_id]);

        // Record transaction
        const senderBalAfter = parseFloat(senderWallet.rows[0].balance) - parseFloat(amount);
        const receiverBalAfter = parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount);

        await client.query(
            'INSERT INTO public.transactions (sender_id, receiver_id, amount, type, reference_id, sender_balance_after, receiver_balance_after, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [senderId, receiver_id, amount, 'PAYMENT', reference_id, senderBalAfter, receiverBalAfter, 'SUCCESS']
        );

        // Mark request as completed
        await client.query('UPDATE public.payment_requests SET status = $1 WHERE token = $2', ['COMPLETED', token]);

        // Get user names for nice notifications
        const sender = await client.query('SELECT full_name FROM public.users WHERE id::text = $1', [senderId]);
        const receiver = await client.query('SELECT full_name FROM public.users WHERE id::text = $1', [receiver_id]);

        // Emit Socket Events
        const io = req.app.get('io');
        if (io) {
            // Notify receiver
            io.to(`user_${receiver_id}`).emit('payment-received', {
                amount,
                sender_name: sender.rows[0].full_name,
                reference_id: reference_id,
                newBalance: parseFloat(receiverWallet.rows[0].balance) + parseFloat(amount)
            });
            // Notify sender
            io.to(`user_${senderId}`).emit('payment-sent', {
                amount,
                receiver_name: receiver.rows[0].full_name,
                reference_id: reference_id,
                newBalance: parseFloat(senderWallet.rows[0].balance) - parseFloat(amount)
            });
        }

        // Create notification for Receiver
        await client.query(
            'INSERT INTO public.notifications (user_id, type, title, short_message, full_message) VALUES ($1, $2, $3, $4, $5)',
            [receiver_id, 'TRANSACTION', 'Payment Received', `Received ₹${amount} from ${sender.rows[0].full_name}`, `You have received a payment of ₹${amount} via QR code from ${sender.rows[0].full_name}. Reference: ${reference_id}`]
        );

        // Create notification for Sender
        await client.query(
            'INSERT INTO public.notifications (user_id, type, title, short_message, full_message) VALUES ($1, $2, $3, $4, $5)',
            [senderId, 'TRANSACTION', 'Payment Successful', `Paid ₹${amount} to ${receiver.rows[0].full_name}`, `Your payment of ₹${amount} to ${receiver.rows[0].full_name} was successful. Reference: ${reference_id}`]
        );

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
            `SELECT pr.*, u.full_name as receiver_name, u.upi_id as receiver_upi_id, pr.callback_url 
       FROM public.payment_requests pr
       JOIN public.users u ON pr.receiver_id::text = u.id::text
       WHERE pr.token = $1`,
            [token]
        );
        if (request.rows.length === 0) return res.status(404).json({ message: 'Invalid QR' });
        res.json(request.rows[0]);
    } catch (err) {
        console.error('❌ [getPaymentDetails] Error Details:', {
            message: err.message,
            code: err.code,
            token
        });
        res.status(500).json({ message: 'Server error while fetching payment details' });
    }
};

// Admin/Manual add coins
exports.addCoins = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount > MAX_RECHARGE) {
        return res.status(400).json({ message: `Maximum recharge amount is ${MAX_RECHARGE} C.` });
    }

    try {
        let wallet = await db.query('SELECT balance FROM public.wallets WHERE user_id::text = $1', [userId]);

        // Auto-create wallet if missing (recovery)
        if (wallet.rows.length === 0) {
            await db.query(
                'INSERT INTO public.wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
                [userId, 0]
            );
            wallet = await db.query('SELECT balance FROM public.wallets WHERE user_id::text = $1', [userId]);

            if (wallet.rows.length === 0) {
                return res.status(500).json({ message: 'Failed to find or create wallet' });
            }
        }

        const currentBalance = parseFloat(wallet.rows[0].balance);
        const addAmount = parseFloat(amount);

        if (currentBalance + addAmount > MAX_BALANCE) {
            return res.status(400).json({ message: `Wallet balance cannot exceed ${MAX_BALANCE} C.` });
        }

        // Atomic update
        const newBalance = currentBalance + addAmount;
        await db.query('UPDATE public.wallets SET balance = balance + $1 WHERE user_id::text = $2', [addAmount, userId]);

        // Record Transaction
        // Using explicit null for sender_id to indicate system credit
        const txResult = await db.query(
            'INSERT INTO public.transactions (sender_id, receiver_id, amount, type, reference_id, receiver_balance_after, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [null, userId, addAmount, 'RECHARGE', 'Asset Top-up', newBalance, 'SUCCESS']
        );

        const transaction = txResult.rows[0];
        const user = await db.query('SELECT full_name, upi_id FROM public.users WHERE id::text = $1', [userId]);

        res.json({
            success: true,
            message: 'Coins added successfully',
            transaction: {
                ...transaction,
                sender_name: 'ZenWallet Treasury',
                sender_upi_id: 'system@zenwallet',
                receiver_name: user.rows[0]?.full_name || 'User',
                receiver_upi_id: user.rows[0]?.upi_id || 'unknown'
            }
        });

    } catch (err) {
        console.error("Add Coins Error:", err);
        res.status(500).json({ message: 'Server error: ' + err.message });
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
        const wallet = await db.query('SELECT balance FROM public.wallets WHERE user_id::text = $1', [userId]);
        if (parseFloat(wallet.rows[0].balance) + parseFloat(amount) > MAX_BALANCE) {
            return res.status(400).json({ message: `Wallet balance cannot exceed ${MAX_BALANCE} C.` });
        }

        const newBalance = parseFloat(wallet.rows[0].balance) + parseFloat(amount);
        await db.query('UPDATE public.wallets SET balance = balance + $1 WHERE user_id::text = $2', [amount, userId]);
        await db.query(
            'INSERT INTO public.transactions (receiver_id, amount, type, reference_id, receiver_balance_after, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, amount, 'RECHARGE', 'Sandbox Faucet', newBalance, 'SUCCESS']
        );
        res.json({ message: 'Sandbox funds added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
