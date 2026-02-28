const db = require('./utils/db');

async function schema() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'apps'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit();
}

schema();
