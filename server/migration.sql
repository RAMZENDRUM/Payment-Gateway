-- Migration Script for ZenWallet (Payment Gateway)
-- This script creates missing tables and aligns columns for the shared Supabase DB.

-- 1. Pending Users for OTP Registration
CREATE TABLE IF NOT EXISTS pending_users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    purpose TEXT,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Virtual Cards for Wallet users
CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_number VARCHAR(20) UNIQUE NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_card UNIQUE(user_id)
);

-- 3. Payment Requests (QR and External)
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL,
    reference_id VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, EXPIRED
    callback_url TEXT,
    app_id UUID, -- Optional: link to dev apps
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Developer Apps
CREATE TABLE IF NOT EXISTS apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    webhook_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    app_id UUID REFERENCES apps(id),
    payload JSONB,
    status_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. External Payments (Metadata for non-wallet flows)
CREATE TABLE IF NOT EXISTS external_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES apps(id),
    payment_id VARCHAR(255), -- ID from provider (Stripe, etc.)
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    short_message TEXT,
    full_message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Add common columns to transactions if they don't exist
-- Note: We use DO blocks for safe migrations if columns might already exist from EMS project
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='sender_id') THEN
        ALTER TABLE transactions ADD COLUMN sender_id UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='receiver_id') THEN
        ALTER TABLE transactions ADD COLUMN receiver_id UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='sender_balance_after') THEN
        ALTER TABLE transactions ADD COLUMN sender_balance_after DECIMAL(15, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='receiver_balance_after') THEN
        ALTER TABLE transactions ADD COLUMN receiver_balance_after DECIMAL(15, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='app_id') THEN
        ALTER TABLE transactions ADD COLUMN app_id UUID REFERENCES apps(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='reference_id') THEN
        ALTER TABLE transactions ADD COLUMN reference_id VARCHAR(255);
    END IF;
END $$;

-- 9. Ensure users table has upi_id and verification fields
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='upi_id') THEN
        ALTER TABLE users ADD COLUMN upi_id VARCHAR(100) UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pending_email') THEN
        ALTER TABLE users ADD COLUMN pending_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_otp') THEN
        ALTER TABLE users ADD COLUMN email_otp VARCHAR(10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='age') THEN
        ALTER TABLE users ADD COLUMN age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payment_pin') THEN
        ALTER TABLE users ADD COLUMN payment_pin VARCHAR(255);
    END IF;
END $$;
