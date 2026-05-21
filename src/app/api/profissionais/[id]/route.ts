import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.professional.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, defaultPercentage, serviceRules, effectiveDate } = body;

    // effectiveDate virá do formulário se o usuário quiser criar uma nova versão histórica
    // Se não vier, atualizamos o registro mais recente ou criamos um novo com a data de hoje.

    const data: any = { name };
    if (defaultPercentage !== undefined) data.defaultPercentage = defaultPercentage;

    // Se houver serviceRules e effectiveDate, criamos novas versões
    if (serviceRules && effectiveDate) {
       await prisma.servicePercentage.createMany({
         data: serviceRules.map((r: any) => ({
           professionalId: id,
           serviceCode: r.serviceCode,
           percentage: r.percentage,
           startDate: new Date(effectiveDate)
         }))
       });
    } else if (serviceRules) {
      // Caso simples (sem histórico explicito): deleta e recria (comportamento antigo mas agora com startDate de hoje por padrão)
      await prisma.servicePercentage.deleteMany({ where: { professionalId: id } });
      data.serviceRules = {
        create: serviceRules.map((r: any) => ({
          serviceCode: r.serviceCode,
          percentage: r.percentage,
          startDate: new Date()
        }))
      };
    }

    const professional = await prisma.professional.update({
      where: { id },
      data,
      include: {
        serviceRules: true,
      },
    });

    return NextResponse.json(professional);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
