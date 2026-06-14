import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStartStr = searchParams.get("weekStart");
    const archivedParam = searchParams.get("archived");

    let whereClause = {};
    if (archivedParam === "true") {
      whereClause = {
        status: "ARCHIVED"
      };
    } else if (weekStartStr) {
      const date = new Date(weekStartStr);
      if (!isNaN(date.getTime())) {
        // Query the entire week range
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 7);
        
        whereClause = {
          weekStart: {
            gte: start,
            lt: end
          },
          status: {
            not: "ARCHIVED"
          }
        };
      }
    }

    const posts = await prisma.marketingPost.findMany({
      where: whereClause,
      orderBy: [
        { weekStart: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, dayOfWeek, title, sourceTopic, content, imagePrompt, imageUrl, status } = body;

    if (!weekStart || !dayOfWeek || !title || !content || !imagePrompt) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const parsedWeekStart = new Date(weekStart);
    if (isNaN(parsedWeekStart.getTime())) {
      return NextResponse.json({ error: "Data de início da semana inválida." }, { status: 400 });
    }

    const post = await prisma.marketingPost.create({
      data: {
        weekStart: parsedWeekStart,
        dayOfWeek,
        title,
        sourceTopic: sourceTopic || "",
        content,
        imagePrompt,
        imageUrl: imageUrl || null,
        status: status || "DRAFT"
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
