import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startMonth = parseInt(searchParams.get("startMonth") || searchParams.get("month") || "0");
    const startYear = parseInt(searchParams.get("startYear") || searchParams.get("year") || "2026");
    const endMonth = parseInt(searchParams.get("endMonth") || startMonth.toString());
    const endYear = parseInt(searchParams.get("endYear") || startYear.toString());

    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        professional: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
