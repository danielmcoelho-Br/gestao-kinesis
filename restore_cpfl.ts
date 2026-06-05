import { config } from 'dotenv';
config({ path: '.env' });
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { clinicCat: 'OUTROS' },
        { category: 'OUTROS' }
      ]
    }
  });

  console.log(`Found ${txs.length} transactions with OUTROS`);

  for (const tx of txs) {
    console.log(`Restoring ${tx.description} (Original amount: ${tx.amount})`);
    
    // We can infer the correct category from the description.
    let newCat = 'GERAL'; // Default safe category for unmapped block
    let newClinicCat = null;
    let newClinicDesc = null;

    if (tx.description.toUpperCase().includes('CPFL')) {
      newCat = 'CPFL_SALA'; // So it shows up in unmapped CPFL dropdown
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        category: newCat,
        clinicCat: newClinicCat,
        clinicDesc: newClinicDesc
      }
    });
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
