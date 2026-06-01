import { NextRequest, NextResponse } from "next/server";
import { ReengagementService } from "@/gestao/services/reengagementService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thresholdStr = searchParams.get("threshold");
    const threshold = thresholdStr ? parseInt(thresholdStr) : 14;

    const inactivePatients = await ReengagementService.getInactivePatients(threshold);
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
