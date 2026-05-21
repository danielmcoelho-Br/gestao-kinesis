"use server";

import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/gestao/lib/password";
import { createSession } from "@/gestao/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Credenciais inválidas" };
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return { error: "Credenciais inválidas" };
    }

    // Create session cookie
    await createSession(user);

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      } 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Erro interno no servidor" };
  }
}
