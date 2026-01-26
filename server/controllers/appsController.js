const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generate a secure API key
const generateApiKey = (env = 'live') => {
    return `sk_${env}_${crypto.randomBytes(16).toString('hex')}`;
};

exports.getMyApps = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            'SELECT * FROM apps WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Apps Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createApp = async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'App name is required' });

    try {
        const apiKey = generateApiKey();

        const result = await db.query(
            `INSERT INTO apps (user_id, name, api_key, environment)
             VALUES ($1, $2, $3, 'production')
             RETURNING *`,
            [userId, name, apiKey]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create App Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteApp = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        await db.query(
            'DELETE FROM apps WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        res.json({ message: 'App deleted' });
    } catch (err) {
        console.error('Delete App Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getWebhookLogs = async (req, res) => {
    const userId = req.user.id;
    const { appId } = req.query;

    try {
        let query = `
            SELECT wl.*, ep.reference_id, a.name as app_name
            FROM webhook_logs wl
            JOIN external_payments ep ON wl.payment_id = ep.payment_id
            JOIN apps a ON ep.app_id = a.id
            WHERE a.user_id = $1
        `;
        const params = [userId];

        if (appId) {
            query += ` AND a.id = $2`;
            params.push(appId);
        }

        query += ` ORDER BY wl.created_at DESC LIMIT 100`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Webhook Logs Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
