const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.dlpxciimpvqugavnitne:RAMAZENDRUM@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getTransaction: async () => {
        const client = await pool.connect();
        const query = client.query.bind(client);
        const release = client.release.bind(client);
        return { client, query, release };
    }
};
