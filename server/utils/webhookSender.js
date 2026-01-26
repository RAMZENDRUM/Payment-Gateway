const axios = require('axios');
const crypto = require('crypto');
const db = require('./db');

// Calculate HMAC signature
const generateSignature = (payload, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
};

const sendWebhook = async (payment, eventType) => {
    if (!payment.callback_url) return;

    // TODO: Each app should have a webhook secret. For now using a hardcoded one or API key as secret substitute.
    const secret = process.env.WEBHOOK_SECRET || 'whsec_default_secret';

    const payload = {
        event: eventType,
        payment_id: payment.payment_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference_id,
        timestamp: new Date().toISOString()
    };

    const signature = generateSignature(payload, secret);

    try {
        console.log(`🚀 Sending Webhook [${eventType}] to ${payment.callback_url}`);

        const response = await axios.post(payment.callback_url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Zen-Signature': `sha256=${signature}`
            },
            timeout: 5000
        });

        // Log Success
        await logWebhook(payment.payment_id, eventType, payload, response.status, 'OK', true);

    } catch (err) {
        console.error(`❌ Webhook Failed: ${err.message}`);

        // Log Failure
        const errorMessage = err.response ? JSON.stringify(err.response.data) : err.message;
        const status = err.response ? err.response.status : 0;
        await logWebhook(payment.payment_id, eventType, payload, status, errorMessage, false);
    }
};

const logWebhook = async (paymentId, eventType, payload, status, responseBody, delivered) => {
    try {
        await db.query(
            `INSERT INTO webhook_logs 
            (payment_id, event_type, payload, response_status, response_body, attempt_count)
            VALUES ($1, $2, $3, $4, $5, 1)`,
            [paymentId, eventType, payload, status, responseBody]
        );
    } catch (err) {
        console.error('Error logging webhook:', err);
    }
};

module.exports = { sendWebhook };
