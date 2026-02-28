const db = require('./utils/db');

async function analyzeDb() {
    try {
        const tableCount = await db.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
        const dbSizeQuery = await db.query("SELECT pg_database_size(current_database()) as size_bytes");
        const dbSizeMB = (parseInt(dbSizeQuery.rows[0].size_bytes) / (1024 * 1024)).toFixed(2);

        const indexes = await db.query("SELECT count(*) as count FROM pg_indexes WHERE schemaname = 'public'");

        console.log("=== Database Analysis ===");
        console.log(`Number of Tables: ${tableCount.rows[0].count}`);
        console.log(`Total DB Size: ${dbSizeMB} MB`);
        console.log(`Number of Indexes: ${indexes.rows[0].count}`);

    } catch (err) {
        console.error("DB Query error:", err);
    } finally {
        process.exit(0);
    }
}

analyzeDb();
