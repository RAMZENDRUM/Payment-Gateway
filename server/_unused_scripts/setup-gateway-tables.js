const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.upoeabxehznzgqyslcfh',
    password: 'ZENDRUM2007@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  environment TEXT DEFAULT 'sandbox', -- 'sandbox' or 'production'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL, -- zw_pay_...
  app_id UUID REFERENCES apps(id),
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'COIN',
  reference_id TEXT,
  customer_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, EXPIRED, CANCELLED
  callback_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT REFERENCES external_payments(payment_id),
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected for Gateway schema setup');
        await client.query(schema);
        console.log('Gateway tables created successfully');
        await client.end();
    } catch (err) {
        console.error('Schema setup error:', err);
        process.exit(1);
    }
}

setup();
