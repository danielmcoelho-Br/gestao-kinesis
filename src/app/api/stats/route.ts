import { NextResponse } from "next/server";
import { StatsService } from "@/services/statsService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startMonth = parseInt(searchParams.get("startMonth") || searchParams.get("month") || "0");
    const startYear = parseInt(searchParams.get("startYear") || searchParams.get("year") || "2026");
    const endMonth = parseInt(searchParams.get("endMonth") || startMonth.toString());
    const endYear = parseInt(searchParams.get("endYear") || startYear.toString());
    const profId = searchParams.get("profId") || null;

    const data = await StatsService.getDashboardData(startMonth, startYear, endMonth, endYear, profId);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
