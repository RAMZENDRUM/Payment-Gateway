const db = require('./utils/db');

async function checkSchema() {
    try {
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Users table columns:');
        res.rows.forEach(col => console.log(`- ${col.column_name} (${col.data_type})`));

        const countRes = await db.query("SELECT COUNT(*) FROM users WHERE upi_id IS NULL");
        console.log(`Users with NULL upi_id: ${countRes.rows[0].count}`);

        const sampleRes = await db.query("SELECT upi_id FROM users LIMIT 1");
        console.log('Sample upi_id:', sampleRes.rows[0]?.upi_id);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
