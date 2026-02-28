const db = require('./utils/db');

async function clearAll() {
    try {
        console.log("Fetching tables...");
        const res = await db.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        const tables = res.rows.map(row => row.tablename);

        if (tables.length > 0) {
            const query = `TRUNCATE TABLE ${tables.map(t => '"' + t + '"').join(', ')} CASCADE;`;
            console.log("Executing:", query);
            await db.query(query);
            console.log("✅ All tables have been successfully truncated with CASCADE.");
        } else {
            console.log("No tables found in the public schema.");
        }
    } catch (err) {
        console.error("❌ Error truncating tables:", err);
    } finally {
        process.exit(0);
    }
}

clearAll();
