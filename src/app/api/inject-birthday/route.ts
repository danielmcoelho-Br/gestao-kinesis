import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 1. Pega o primeiro paciente real
  const firstPatient = await prisma.patient.findFirst({ 
    where: { name: { gt: 'A' } }, // Inicia com letras
    orderBy: { name: 'asc' } 
  });
  if (!firstPatient) return NextResponse.json({ error: "Nenhum paciente encontrado." });

  // 2. Ajusta a data para HOJE (Independente do ano)
  const today = new Date();
  const testBirth = new Date(1985, today.getMonth(), today.getDate(), 12, 0, 0);
  
  const updated = await prisma.patient.update({
    where: { id: firstPatient.id },
    data: { birth_date: testBirth }
  });

  return NextResponse.json({
    success: true,
    message: `Aniversário de teste definido para ${updated.name}`,
    birth_date: updated.birth_date
  });
}
