const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Helper to generate Zw IDs
const generateId = (prefix = 'zw_pay') => {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`; // zw_pay_a812...
};

exports.createPayment = async (req, res) => {
    // 1. Validate Request
    const { amount, currency = 'COIN', reference, customer_id, callback_url, description } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    const app = req.clientApp;

    try {
        const payment_id = generateId('zw_pay');
        const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // 2. Store in DB
        const result = await db.query(
            `INSERT INTO external_payments 
            (payment_id, app_id, amount, currency, reference_id, customer_id, description, callback_url, expires_at, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
            RETURNING *`,
            [payment_id, app.id, amount, currency, reference, customer_id, description, callback_url, expires_at]
        );

        const payment = result.rows[0];

        // 3. Return Contract
        res.status(201).json({
            payment_id: payment.payment_id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            reference: payment.reference_id,
            payment_url: `http://localhost:5173/pay/${payment.payment_id}`, // Frontend payment page
            expires_at: payment.expires_at
        });

    } catch (err) {
        console.error('Create Payment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getPayment = async (req, res) => {
    const { id } = req.params;
    const app = req.clientApp;

    try {
        const result = await db.query(
            'SELECT * FROM external_payments WHERE payment_id = $1 AND app_id = $2',
            [id, app.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = result.rows[0];
        res.json({
            payment_id: payment.payment_id,
            status: payment.status,
            amount: payment.amount,
            reference: payment.reference_id,
            created_at: payment.created_at
        });

    } catch (err) {
        console.error('Get Payment Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const { sendWebhook } = require('../utils/webhookSender');

exports.simulateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // SUCCESS or FAILED
    const app = req.clientApp;

    if (!['SUCCESS', 'FAILED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use SUCCESS or FAILED' });
    }

    try {
        // 1. Update DB
        const result = await db.query(
            `UPDATE external_payments 
             SET status = $1, completed_at = NOW()
             WHERE payment_id = $2 AND app_id = $3
             RETURNING *`,
            [status, id, app.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = result.rows[0];

        // 2. Trigger Webhook
        const eventType = status === 'SUCCESS' ? 'payment.success' : 'payment.failed';
        sendWebhook(payment, eventType); // Async, don't wait

        res.json({
            message: `Payment status updated to ${status}`,
            payment_id: payment.payment_id,
            status: payment.status
        });

    } catch (err) {
        console.error('Simulate Status Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
