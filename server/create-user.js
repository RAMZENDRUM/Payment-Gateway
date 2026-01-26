const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

async function upsertUser() {
    // Clean up typo email if it exists
    await pool.query('DELETE FROM users WHERE email = $1', ['ramzendrum@gamil.com']);

    const email = 'ramzendrum@gmail.com';
    const password = 'RAM';
    const fullName = 'Ram Zendrum';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Upsert User
        const userResult = await pool.query(
            `INSERT INTO users (email, password, full_name) 
             VALUES ($1, $2, $3)
             ON CONFLICT (email) 
             DO UPDATE SET password = $2, full_name = $3
             RETURNING id`,
            [email, hashedPassword, fullName]
        );

        const userId = userResult.rows[0].id;
        console.log(`✅ User ${email} created/updated (ID: ${userId})`);

        // 2. Ensure Wallet exists with some balance
        const walletResult = await pool.query(
            `INSERT INTO wallets (user_id, balance)
             VALUES ($1, 5000)
             ON CONFLICT (user_id) DO NOTHING
             RETURNING id, balance`,
            [userId]
        );

        if (walletResult.rows.length > 0) {
            console.log(`✅ Wallet created with 5000 coins`);
        } else {
            console.log(`ℹ️ Wallet already exists for user`);
        }

    } catch (err) {
        console.error('❌ Error creating user:', err.message);
    } finally {
        await pool.end();
    }
}

upsertUser();
