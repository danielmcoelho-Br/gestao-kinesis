import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/gestao/lib/password";
import { getSession } from "@/gestao/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, role: true }
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { name, currentPassword, newPassword } = await request.json();

    if (!currentPassword) {
      return NextResponse.json({ error: "Sua senha atual é necessária para salvar mudanças" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
    }

    const updateData: any = { name };
    
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
      }
      updateData.password = await hashPassword(newPassword);
    }

    await prisma.user.update({
      where: { id: session.id },
      data: updateData
    });

    return NextResponse.json({ message: "Perfil atualizado com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
