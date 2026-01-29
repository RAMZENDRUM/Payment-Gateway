const db = require('./utils/db');

function generateUpiId() {
    return Math.floor(10000000 + Math.random() * 90000000).toString() + '@zenwallet';
}

async function fixUpiIds() {
    try {
        console.log('Auditing users for missing Zen handles...');

        const users = await db.query('SELECT id FROM users WHERE upi_id IS NULL OR upi_id = $1', ['']);

        if (users.rows.length > 0) {
            console.log(`Found ${users.rows.length} users with missing IDs. Generating now...`);

            for (const user of users.rows) {
                const newId = generateUpiId();
                await db.query('UPDATE users SET upi_id = $1 WHERE id = $2', [newId, user.id]);
                console.log(`- Assigned ${newId} to user ${user.id}`);
            }
            console.log('Audit complete. All users now have Zen Global Handles.');
        } else {
            console.log('No users missing IDs found.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

fixUpiIds();
