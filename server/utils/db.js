const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.upoeabxehznzgqyslcfh',
    password: 'ZENDRUM2007@',
    database: 'postgres',
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
