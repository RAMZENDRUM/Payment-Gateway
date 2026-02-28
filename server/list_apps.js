const db = require('./utils/db');

async function listApps() {
    try {
        const result = await db.query('SELECT a.id, a.name, a.api_key, u.full_name as merchant FROM apps a JOIN users u ON a.user_id = u.id');
        console.log('--- ALL APPS ---');
        console.table(result.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

listApps();
