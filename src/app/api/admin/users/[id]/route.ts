import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/gestao/lib/password";
import { getSession } from "@/gestao/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  if (!session || !['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(session.role || '').toUpperCase())) {
    return false;
  }
  return true;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { email, password, name, role, defaultPercentage, serviceRules } = body;

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const updateData: any = {
      email: email.toLowerCase(),
      name,
      role
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Sincronizar com a tabela de profissionais (Professional) se o perfil for FISIOTERAPEUTA
    let prof = await prisma.professional.findFirst({
      where: { name: { equals: oldUser.name, mode: 'insensitive' } }
    });

    if (role === 'FISIOTERAPEUTA') {
      const defaultPercentageVal = defaultPercentage !== undefined ? parseFloat(defaultPercentage) : 0.5;
      const rulesData = serviceRules ? serviceRules.map((r: any) => ({
        serviceCode: r.serviceCode,
        percentage: parseFloat(r.percentage),
        startDate: new Date()
      })) : [];

      if (prof) {
        // Atualiza profissional e recria as regras específicas de repasse
        await prisma.servicePercentage.deleteMany({ where: { professionalId: prof.id } });
        await prisma.professional.update({
          where: { id: prof.id },
          data: {
            name: name, // Atualiza nome caso tenha sido alterado
            defaultPercentage: defaultPercentageVal,
            serviceRules: {
              create: rulesData
            }
          }
        });
      } else {
        // Cria um novo registro profissional caso não existisse anteriormente
        await prisma.professional.create({
          data: {
            name,
            role: "Fisioterapeuta",
            defaultPercentage: defaultPercentageVal,
            serviceRules: {
              create: rulesData
            }
          }
        });
      }
    } else {
      // Se a função não for FISIOTERAPEUTA mas existia um registro na tabela profissional,
      // atualizamos o nome se mudou, mas mantemos o registro para preservar histórico de sessões.
      if (prof && prof.name !== name) {
        await prisma.professional.update({
          where: { id: prof.id },
          data: { name }
        });
      }
    }

    return NextResponse.json({ message: "Usuário atualizado com sucesso", id: updatedUser.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Remove o usuário
    await prisma.user.delete({ where: { id } });

    // Remove o profissional associado de forma consistente
    const prof = await prisma.professional.findFirst({
      where: { name: { equals: user.name, mode: 'insensitive' } }
    });
    
    if (prof) {
      // Deleta as regras associadas
      await prisma.servicePercentage.deleteMany({ where: { professionalId: prof.id } });
      try {
        // Deleta o profissional se não houver vínculos impeditivos (sessões)
        await prisma.professional.delete({ where: { id: prof.id } });
      } catch (err) {
        // Se houver sessões associadas, mantemos o profissional para preservar dados históricos
        // e mudamos a função dele para "Inativo" para evitar recriação automática
        await prisma.professional.update({
          where: { id: prof.id },
          data: { role: "Inativo" }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Usuário e regras profissionais removidos com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
