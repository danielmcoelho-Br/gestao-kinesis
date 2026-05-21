import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/gestao/lib/password";
import { getSession } from "@/gestao/lib/auth";

// Middleware internal check
async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role
      }
    });

    return NextResponse.json({ message: "Usuário criado com sucesso", id: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
