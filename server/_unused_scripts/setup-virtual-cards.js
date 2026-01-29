const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: process.env.DB_USER || 'postgres.upoeabxehznzgqyslcfh',
    password: process.env.DB_PASSWORD || 'ZENDRUM2007@',
    database: process.env.DB_NAME || 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const schema = `
CREATE TABLE IF NOT EXISTS virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  cvv TEXT NOT NULL,
  expiry_month TEXT NOT NULL,
  expiry_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected for virtual_cards setup');
        await client.query(schema);
        console.log('Virtual Cards table created successfully');
        await client.end();
    } catch (err) {
        console.error('Schema setup error:', err.stack);
        process.exit(1);
    }
}

setup();
