import { NextResponse } from "next/server";
import { StatsService } from "@/services/statsService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth();
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const profId = searchParams.get("profId") || null;

    const data = await StatsService.getDashboardData(month, year, profId);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
