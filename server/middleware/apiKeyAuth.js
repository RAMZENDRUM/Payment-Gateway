const db = require('../utils/db');

const apiKeyAuth = async (req, res, next) => {
    try {
        // 1. Get API Key from Header (Authorization: Bearer sk_... or X-API-Key)
        const authHeader = req.headers['authorization'];
        const xApiKey = req.headers['x-api-key'];

        let apiKey = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
        } else if (xApiKey) {
            apiKey = xApiKey;
        }

        if (!apiKey) {
            return res.status(401).json({ error: 'Missing API Key' });
        }

        // Trim whitespace just in case
        apiKey = apiKey.trim();

        // 2. Validate Key in DB
        const result = await db.query(
            'SELECT * FROM apps WHERE api_key = $1 AND is_active = true',
            [apiKey]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid or inactive API Key' });
        }

        // 3. Attach App Context
        req.clientApp = result.rows[0];
        next();
    } catch (err) {
        console.error('API Key Auth Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = apiKeyAuth;
