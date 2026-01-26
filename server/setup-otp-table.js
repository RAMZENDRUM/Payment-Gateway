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
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected for OTP table setup');
        await client.query(schema);
        console.log('otp_verifications table created successfully');
        await client.end();
    } catch (err) {
        console.error('OTP table setup error:', err.stack);
        process.exit(1);
    }
}

setup();
