const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.dlpxciimpvqugavnitne',
    password: 'RAMAZENDRUM',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const fs = require('fs');
const path = require('path');

async function testConnection() {
    console.log('Running migration script...');
    try {
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
        await pool.query(migrationSql);
        console.log('✅ Migration successful!');

        console.log('Verifying tables...');
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Current Tables:', res.rows.map(r => r.table_name).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:');
        console.error(err);
        process.exit(1);
    }
}

testConnection();
