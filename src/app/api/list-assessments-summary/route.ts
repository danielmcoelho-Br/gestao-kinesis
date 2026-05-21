import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const allAssessments = await prisma.assessment.findMany({
      orderBy: { created_at: 'desc' },
      include: { patient: { select: { name: true } } },
      take: 50
    });

    const summary = allAssessments.map(a => ({
      patient: a.patient.name,
      type: a.assessment_type,
      created_at: a.created_at
    }));

    return NextResponse.json({ count: allAssessments.length, items: summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
