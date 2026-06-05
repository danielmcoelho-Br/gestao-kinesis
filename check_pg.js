const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "Transaction"');
  const txs = res.rows;
  
  const totals = { KINESIS: 0, DANIEL: 0, STUART: 0, PAULA: 0, PILATES: 0, FUNDO: 0 };
  const totals_bb = { KINESIS: 0, DANIEL: 0, STUART: 0, PAULA: 0, PILATES: 0, FUNDO: 0 };
  
  for (const t of txs) {
    if (t.bank === 'MANUAL_CLINICA' || t.category === 'PRO_EARNING' || t.bank === 'HIDDEN_ITEM' || t.category === 'PARTNER_ADJ') continue;
    
    const fav = (t.favorecido || '').toUpperCase();
    if (totals[fav] !== undefined) {
      const amount = t.type === 'INCOME' ? t.amount : -t.amount;
      
      totals[fav] += amount;
      
      const bankName = (t.bank || 'Banco do Brasil').toLowerCase();
      if (bankName === 'banco do brasil') {
        totals_bb[fav] += amount;
      }
    }
  }
  
  console.log('Totals Original:', totals);
  console.log('Totals BB:', totals_bb);
  await client.end();
}
run().catch(console.error);
