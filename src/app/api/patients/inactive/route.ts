import { NextRequest, NextResponse } from "next/server";
import { ReengagementService } from "@/gestao/services/reengagementService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thresholdStr = searchParams.get("threshold");
    const threshold = thresholdStr ? parseInt(thresholdStr) : 14;

    const startMonth = searchParams.get("startMonth");
    const startYear = searchParams.get("startYear");
    const endMonth = searchParams.get("endMonth");
    const endYear = searchParams.get("endYear");

    let referenceDate = new Date();
    if (endMonth && endYear) {
      const year = parseInt(endYear);
      const month = parseInt(endMonth); // 1 = Janeiro, 12 = Dezembro
      const now = new Date();
      
      const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
      if (isCurrentMonth) {
        referenceDate = now;
      } else {
        // Último dia do mês selecionado às 23:59:59
        referenceDate = new Date(year, month, 0, 23, 59, 59);
      }
    }

    const inactivePatients = await ReengagementService.getInactivePatients(threshold, referenceDate, 45);
    const feedbacks = await ReengagementService.getReengagementFeedbacks();

    return NextResponse.json({
      success: true,
      inactivePatients,
      feedbacks
    });
  } catch (error: any) {
    console.error("Error in GET /api/patients/inactive:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json({ success: false, error: "patientId é obrigatório." }, { status: 400 });
    }

    const result = await ReengagementService.triggerReengagement(patientId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error("Error in POST /api/patients/inactive:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
