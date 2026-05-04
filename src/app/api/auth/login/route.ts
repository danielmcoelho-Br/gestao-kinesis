import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado ou senha inválida" }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Usuário não encontrado ou senha inválida" }, { status: 401 });
    }

    // Create session cookie
    await createSession(user);

    return NextResponse.json({ 
      message: "Login realizado com sucesso",
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
