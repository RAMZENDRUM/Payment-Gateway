const db = require('./utils/db');

async function debugUsers() {
    try {
        const res = await db.query("SELECT id, email, full_name, upi_id FROM users");
        console.log('Current Users:');
        res.rows.forEach(u => {
            console.log(`- ${u.full_name} (${u.email}): ID=${u.id}, UPI=${u.upi_id}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugUsers();
