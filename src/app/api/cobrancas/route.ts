import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth();
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    const sessions = await prisma.billingSession.findMany({
      where: {
        month: month,
        year: year
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
          phone: s.phone || null,
          totalValue: 0,
          sessionCount: 0,
          dates: []
        };
      }
      groups[s.patientName].totalValue += s.value;
      groups[s.patientName].sessionCount += 1;
      
      const dateObj = new Date(s.date);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const mo = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      groups[s.patientName].dates.push(`${day}/${mo}`);
    });

    return NextResponse.json(Object.values(groups));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
