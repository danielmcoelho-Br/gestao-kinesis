import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    const maskedUrl = rawUrl.replace(/:[^:@]+@/, ":****@"); // hide password
    
    // Count transactions in April 2026
    const count = await prisma.transaction.count({
      where: {
        date: {
          gte: new Date(2026, 3, 1),
          lte: new Date(2026, 3, 30, 23, 59, 59)
        }
      }
    });

    const activeCount = await prisma.transaction.count({
      where: {
        date: {
          gte: new Date(2026, 3, 1),
          lte: new Date(2026, 3, 30, 23, 59, 59)
        },
        OR: [
          { ownerId: null },
          { ownerId: { not: 'DELETED' } }
        ]
      }
    });

    // Get PRO_EARNING txs
    const proEarnings = await prisma.transaction.findMany({
      where: {
        category: 'PRO_EARNING',
        date: {
          gte: new Date(2026, 3, 1),
          lte: new Date(2026, 3, 30, 23, 59, 59)
        }
      },
      select: { description: true, amount: true }
    });

    return NextResponse.json({
      db_url: maskedUrl,
      april_total_txs: count,
      april_active_txs: activeCount,
      pro_earnings: proEarnings
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
