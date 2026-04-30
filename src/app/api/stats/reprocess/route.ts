import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { month, year, professionalId } = await request.json();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const filter: any = { date: { gte: start, lte: end } };
    if (professionalId) filter.professionalId = professionalId;

    const sessions = await prisma.session.findMany({
      where: filter,
      include: {
        professional: {
          include: { serviceRules: true }
        }
      }
    });

    let updatedCount = 0;

    for (const s of sessions) {
      // Encontrar a regra ativa para este serviço nesta data
      // Regra específica
      const specificRules = s.professional.serviceRules.filter(
        r => s.serviceType.includes(r.serviceCode) && r.startDate <= s.date
      );
      
      let percentage = s.professional.defaultPercentage;
      
      if (specificRules.length > 0) {
        // Pega a mais recente (maior startDate)
        const latest = specificRules.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
        percentage = latest.percentage;
      }

      // Atualizar a sessão
      if (s.clinicPercentage !== percentage) {
        await prisma.session.update({
          where: { id: s.id },
          data: { clinicPercentage: percentage }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
