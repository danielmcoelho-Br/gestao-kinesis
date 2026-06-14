import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClosingReportEmail } from "@/lib/finance/mailer";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "");
    let year = parseInt(searchParams.get("year") || "");

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: "Parâmetros 'month' e 'year' são obrigatórios e devem ser números." }, { status: 400 });
    }

    if (year < 100) year = 2000 + year;

    const lock = await prisma.monthLock.findUnique({
      where: {
        month_year: { month, year }
      }
    });

    return NextResponse.json({ locked: lock?.locked || false });
  } catch (error: any) {
    console.error("[LOCK_GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { month, year, locked } = body;

    if (typeof month !== 'number' || typeof year !== 'number' || typeof locked !== 'boolean') {
      return NextResponse.json({ error: "Campos 'month', 'year' (números) e 'locked' (boolean) são obrigatórios no corpo da requisição." }, { status: 400 });
    }

    if (year < 100) year = 2000 + year;

    // Check previous lock state
    const prevLock = await prisma.monthLock.findUnique({
      where: {
        month_year: { month, year }
      }
    });

    const wasLocked = prevLock?.locked || false;

    const lock = await prisma.monthLock.upsert({
      where: {
        month_year: { month, year }
      },
      update: {
        locked,
        updatedAt: new Date()
      },
      create: {
        month,
        year,
        locked
      }
    });

    let emailStatus = null;
    // Trigger email report only if transitioning from unlocked to locked
    if (locked && !wasLocked) {
      console.log(`[LOCK_POST] Period ${month}/${year} locked. Sending automatic closing email report...`);
      emailStatus = await sendClosingReportEmail(month, year);
    }

    return NextResponse.json({ success: true, lock, emailStatus });
  } catch (error: any) {
    console.error("[LOCK_POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
