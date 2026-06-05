const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "Transaction"');
  const txs = res.rows;
  
  for (const t of txs) {
    const fav = (t.favorecido || '').toUpperCase();
    if (fav === 'DANIEL') {
      console.log(t);
    }
  }
  
  await client.end();
}
run().catch(console.error);
