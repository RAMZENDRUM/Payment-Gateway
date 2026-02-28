const db = require('./utils/db');

async function checkApiKey() {
    require('dotenv').config();
    const key = process.env.DEMO_API_KEY || 'sk_live_PLACEHOLDER';
    try {
        const result = await db.query('SELECT * FROM apps WHERE api_key = $1 OR api_key = $2', [key, key.trim()]);
        if (result.rows.length > 0) {
            console.log('✅ API Key exists:', result.rows[0]);
        } else {
            console.log('❌ API Key NOT found');
            const allApps = await db.query('SELECT name, api_key, is_active FROM apps LIMIT 10');
            console.log('Last 10 apps in DB:', allApps.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkApiKey();
