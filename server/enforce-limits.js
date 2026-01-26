const db = require('./utils/db');

async function enforceLimits() {
    const MAX_BALANCE = 500000;
    try {
        console.log(`Auditing all wallets... enforcing maximum balance of ${MAX_BALANCE} C.`);

        const result = await db.query(
            'UPDATE wallets SET balance = $1 WHERE balance > $1 RETURNING user_id, balance',
            [MAX_BALANCE]
        );

        if (result.rows.length > 0) {
            console.log(`Successfully trimmed ${result.rows.length} wallets that exceeded the limit.`);
            result.rows.forEach(row => {
                console.log(`- User ${row.user_id} capped at ${row.balance}`);
            });
        } else {
            console.log('No wallets exceeded the limit.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

enforceLimits();
