import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/gestao/lib/password";
import { getSession } from "@/gestao/lib/auth";

// Middleware internal check
async function checkAdmin() {
  const session = await getSession();
  if (!session || !['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(session.role || '').toUpperCase())) {
    return false;
  }
  return true;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    let users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    const professionals = await prisma.professional.findMany({
      include: { serviceRules: true }
    });

    let hasNewSyncs = false;
    const hashedPassword = await hashPassword("kinesis123");

    for (const prof of professionals) {
      if (prof.role === 'Inativo') continue;
      const hasUser = users.some(u => u.name.trim().toLowerCase() === prof.name.trim().toLowerCase());
      if (!hasUser) {
        const cleanWord = (word: string) => {
          return word
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
        };
        const parts = prof.name.split(/\s+/).map(cleanWord).filter(Boolean);
        let baseEmail = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
        if (!baseEmail) baseEmail = "fisioterapeuta";
        let email = `${baseEmail}@kinesis.com.br`;

        let counter = 1;
        while (await prisma.user.findUnique({ where: { email } })) {
          email = `${baseEmail}${counter}@kinesis.com.br`;
          counter++;
        }

        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: prof.name,
            role: 'FISIOTERAPEUTA'
          }
        });
        hasNewSyncs = true;
      }
    }

    if (hasNewSyncs) {
      users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    const enrichedUsers = users.map(user => {
      const prof = professionals.find(p => p.name.toLowerCase() === user.name.toLowerCase());
      return {
        ...user,
        defaultPercentage: prof ? prof.defaultPercentage : null,
        serviceRules: prof ? prof.serviceRules : []
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  try {
    const body = await request.json();
    const { email, password, name, role, defaultPercentage, serviceRules } = body;

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

    // Se for Fisioterapeuta, cria simultaneamente o Professional e suas regras específicas
    if (role === 'FISIOTERAPEUTA') {
      const defaultPercentageVal = defaultPercentage !== undefined ? parseFloat(defaultPercentage) : 0.5;
      const rulesData = serviceRules ? serviceRules.map((r: any) => ({
        serviceCode: r.serviceCode,
        percentage: parseFloat(r.percentage),
        startDate: new Date()
      })) : [];

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

    return NextResponse.json({ message: "Usuário criado com sucesso", id: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
