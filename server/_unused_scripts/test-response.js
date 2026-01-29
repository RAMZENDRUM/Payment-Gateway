const db = require('./utils/db');

async function testResponse() {
    try {
        const userResult = await db.query(
            'SELECT u.id, u.email, u.full_name, u.upi_id, w.balance FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.email = $1',
            ['ramanathanb86@gmail.com']
        );
        const userData = userResult.rows[0];
        console.log('Database Result:', JSON.stringify(userData, null, 2));

        const response = {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            upi_id: userData.upi_id,
            balance: userData.balance
        };
        console.log('Projected Response:', JSON.stringify(response, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testResponse();
