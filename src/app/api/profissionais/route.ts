import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profissionais = await prisma.professional.findMany({
      include: {
        serviceRules: true,
      },
    });
    return NextResponse.json(profissionais);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, defaultPercentage, serviceRules } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const professional = await prisma.professional.create({
      data: {
        name,
        role: role || "Fisioterapeuta",
        defaultPercentage: defaultPercentage || 0.5,
        serviceRules: {
          create: serviceRules || [],
        },
      },
      include: {
        serviceRules: true,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
