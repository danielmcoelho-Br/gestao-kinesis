const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.transaction.findMany({ where: { favorecido: { equals: 'DANIEL', mode: 'insensitive' } } }).then(txs => {
  let sum = 0;
  txs.forEach(t => {
    if (t.bank === 'MANUAL_CLINICA' || t.category === 'PRO_EARNING' || t.bank === 'HIDDEN_ITEM' || t.category === 'PARTNER_ADJ') return;
    let amount = t.type === 'INCOME' ? t.amount : -t.amount;
    sum += amount;
    console.log(t.date.toISOString(), t.description, amount, "BANK:", t.bank);
  });
  console.log('Total Daniel:', sum);
  process.exit(0);
});
