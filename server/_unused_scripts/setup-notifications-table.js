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
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Null for global
    type TEXT NOT NULL, -- 'TRANSACTION', 'BROADCAST', 'SYSTEM'
    title TEXT NOT NULL,
    short_message TEXT NOT NULL,
    full_message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected for notifications schema setup');
        await client.query(schema);
        console.log('Notifications table created successfully');
        await client.end();
    } catch (err) {
        console.error('Schema setup error:', err.stack);
        process.exit(1);
    }
}

setup();
