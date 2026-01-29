const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.upoeabxehznzgqyslcfh',
    password: 'ZENDRUM2007@',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const schema = `
CREATE TABLE IF NOT EXISTS pending_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  purpose TEXT,
  otp_code TEXT NOT NULL,
  otp_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected for Pending Users table setup');
        await client.query(schema);
        console.log('pending_users table created successfully');
        await client.end();
    } catch (err) {
        console.error('Pending Users table setup error:', err.stack);
        process.exit(1);
    }
}

setup();
