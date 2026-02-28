const db = require('./utils/db');

async function deleteSpecificApp() {
    const appId = 'b6600667-e6bc-40dc-8974-856a9a07b3fc';
    console.log(`Starting forced cleanup for App ID: ${appId}`);

    try {
        console.log('1. Removing linked historical transactions...');
        await db.query('DELETE FROM transactions WHERE app_id = $1', [appId]);

        console.log('2. Removing linked payment requests...');
        await db.query('DELETE FROM payment_requests WHERE app_id = $1', [appId]);

        console.log('3. Removing linked webhook logs...');
        const webhookRes = await db.query(
            `DELETE FROM webhook_logs WHERE payment_id IN (
                SELECT payment_id FROM external_payments WHERE app_id = $1
            )`,
            [appId]
        );
        console.log(`   Deleted ${webhookRes.rowCount} webhook logs.`);

        console.log('3. Removing linked external payment records...');
        const payRes = await db.query('DELETE FROM external_payments WHERE app_id = $1', [appId]);
        console.log(`   Deleted ${payRes.rowCount} payment records.`);

        console.log('4. Removing the App record...');
        const appRes = await db.query('DELETE FROM apps WHERE id = $1', [appId]);

        if (appRes.rowCount > 0) {
            console.log('✅ SUCCESS: App deleted successfully.');
        } else {
            console.log('❌ ERROR: App ID not found in database.');
        }

    } catch (err) {
        console.error('❌ DATABASE ERROR:', err.message);
    } finally {
        process.exit();
    }
}

deleteSpecificApp();
