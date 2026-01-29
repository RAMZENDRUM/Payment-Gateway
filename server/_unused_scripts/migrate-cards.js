const db = require('./utils/db');

async function migrateCards() {
    try {
        console.log('Starting card migration to 0605 xxxx xxxx 2212 format...');
        const cards = await db.query('SELECT user_id, id FROM virtual_cards');

        for (const card of cards.rows) {
            let middle = '';
            for (let i = 0; i < 8; i++) {
                middle += Math.floor(Math.random() * 10);
            }
            const newCardNumber = `0605${middle}2212`;

            await db.query(
                'UPDATE virtual_cards SET card_number = $1 WHERE id = $2',
                [newCardNumber, card.id]
            );
            console.log(`Updated card ${card.id} for user ${card.user_id}`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateCards();
