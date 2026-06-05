import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profs = await prisma.professional.findMany();
    let logs = [];
    
    const joao = profs.find(p => p.name.includes('Joao') || p.name.includes('João'));
    if (joao) {
      await prisma.professional.update({
        where: { id: joao.id },
        data: { defaultPercentage: 0.55 }
      });
      logs.push('Updated Joao to 55%');
      
      const result = await prisma.session.updateMany({
        where: { professionalId: joao.id },
        data: { clinicPercentage: 0.55 }
      });
      logs.push(`Updated ${result.count} existing sessions for Joao.`);
    }

    const newton = profs.find(p => p.name.includes('Newton'));
    if (newton) {
      await prisma.professional.update({
        where: { id: newton.id },
        data: { defaultPercentage: 0.45 }
      });
      logs.push('Updated Newton to 45%');

      const result = await prisma.session.updateMany({
        where: { professionalId: newton.id },
        data: { clinicPercentage: 0.45 }
      });
      logs.push(`Updated ${result.count} existing sessions for Newton.`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
