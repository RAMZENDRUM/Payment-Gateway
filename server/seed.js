const db = require('./utils/db');
const bcrypt = require('bcryptjs');

async function seedUser() {
    const email = 'ramzendrum@gmail.com';
    const fullName = 'RAM';
    const password = 'password123';

    try {
        const { client, query, release } = await db.getTransaction();
        await client.query('BEGIN');

        // Check if user exists
        const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            console.log('User already exists');
            await client.query('ROLLBACK');
            release();
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await client.query(
            'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id',
            [email, hashedPassword, fullName]
        );

        const userId = newUser.rows[0].id;
        await client.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [userId, 1000]); // Giving 1000 coins for testing

        await client.query('COMMIT');
        console.log(`User ${fullName} created successfully with 1000 coins!`);
        console.log(`Login Email: ${email}`);
        console.log(`Login Password: ${password}`);
        release();
    } catch (err) {
        console.error('Error seeding user:', err);
    }
}

seedUser();
