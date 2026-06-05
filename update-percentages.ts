import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { prisma } from './src/lib/prisma';

async function main() {
  const profs = await prisma.professional.findMany();
  console.log('Professionals:', profs.map(p => ({ id: p.id, name: p.name, defaultPercentage: p.defaultPercentage })));

  const joao = profs.find(p => p.name.includes('Joao') || p.name.includes('João'));
  if (joao) {
    await prisma.professional.update({
      where: { id: joao.id },
      data: { defaultPercentage: 0.55 }
    });
    console.log('Updated Joao to 55%');
    
    // Update existing sessions for current month
    const result = await prisma.session.updateMany({
      where: { professionalId: joao.id },
      data: { clinicPercentage: 0.55 }
    });
    console.log(`Updated ${result.count} existing sessions for Joao.`);
  }

  const newton = profs.find(p => p.name.includes('Newton'));
  if (newton) {
    await prisma.professional.update({
      where: { id: newton.id },
      data: { defaultPercentage: 0.45 }
    });
    console.log('Updated Newton to 45%');

    // Update existing sessions for current month
    const result = await prisma.session.updateMany({
      where: { professionalId: newton.id },
      data: { clinicPercentage: 0.45 }
    });
    console.log(`Updated ${result.count} existing sessions for Newton.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
