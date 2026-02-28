const db = require('./utils/db');
const bcrypt = require('bcryptjs');

async function seedUserAndApp() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create a Merchant User
        const userRes = await db.query(
            `INSERT INTO users (full_name, email, password, role) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            ['Ram Zen', 'merchant@example.com', hashedPassword, 'MERCHANT']
        );
        const userId = userRes.rows[0].id;
        console.log('✅ Merchant User Created:', userId);

        // 2. Create Wallet for merchant
        await db.query(
            `INSERT INTO wallets (user_id, balance) VALUES ($1, $2)`,
            [userId, 100000]
        );
        console.log('✅ Merchant Wallet Created');

        // 3. Create the App with the user's provided API Key
        require('dotenv').config();
        const apiKey = process.env.DEMO_API_KEY || 'sk_live_MERCHANT_KEY_HERE';
        const appId = 'app_test_123';
        const apiKeyHash = await bcrypt.hash(apiKey, 10);
        const webhookSecret = 'whsec_demo_123';
        await db.query(
            `INSERT INTO apps (user_id, name, api_key, api_key_hash, app_id, webhook_secret, is_active, environment) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, 'Demo App', apiKey, apiKeyHash, appId, webhookSecret, true, 'production']
        );
        console.log('✅ Live App Created with key:', apiKey);

        // For local use, replace with your live api key if not already present
        const API_KEY = "sk_live_YOUR_ACTUAL_KEY_HERE";
        // 4. Create a Customer User for testing
        const custPass = await bcrypt.hash('customer123', 10);
        const custRes = await db.query(
            `INSERT INTO users (full_name, email, password, role) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            ['Test Customer', 'customer@example.com', custPass, 'USER']
        );
        const custId = custRes.rows[0].id;
        console.log('✅ Customer User Created:', custId);

        // 5. Create Wallet for customer
        await db.query(
            `INSERT INTO wallets (user_id, balance) VALUES ($1, $2)`,
            [custId, 50000]
        );
        console.log('✅ Customer Wallet Created');

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        process.exit();
    }
}

seedUserAndApp();
