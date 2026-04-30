import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth();
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Agrupar por paciente
    const groups: Record<string, any> = {};

    sessions.forEach(s => {
      if (!groups[s.patientName]) {
        groups[s.patientName] = {
          patientName: s.patientName,
          totalValue: 0,
          sessionCount: 0,
          dates: []
        };
      }
      groups[s.patientName].totalValue += s.value;
      groups[s.patientName].sessionCount += 1;
      // Formatar data para DD/MM
      const day = s.date.getDate().toString().padStart(2, '0');
      const mo = (s.date.getMonth() + 1).toString().padStart(2, '0');
      groups[s.patientName].dates.push(`${day}/${mo}`);
    });

    return NextResponse.json(Object.values(groups));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
