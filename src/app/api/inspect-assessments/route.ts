import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "cmp2n5op902kunstop5h7d37m";

    const count = await prisma.assessment.count();
    const samples = await prisma.assessment.findMany({
      take: 5,
      select: { id: true, patient_id: true, assessment_type: true }
    });

    const patient = await prisma.patient.findUnique({ where: { id } });
    const patientAssessments = await prisma.assessment.findMany({ where: { patient_id: id } });

    // Also find ALL assessments count just to verify they exist
    const allAssessments = await prisma.assessment.findMany({ take: 20, select: { id: true, patient_id: true }});

    return NextResponse.json({
      totalInDb: count,
      samples,
      patientName: patient?.name || "NOT FOUND",
      assessmentsCountForPatient: patientAssessments.length,
      patientIdFromScreenshot: id,
      assessmentsList: allAssessments
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
