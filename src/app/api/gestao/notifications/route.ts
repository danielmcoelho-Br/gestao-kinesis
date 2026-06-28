import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Calcula a data da última sexta-feira (início da rotina semanal)
function getMostRecentFriday(now: Date) {
  const d = new Date(now);
  const day = d.getDay(); // 0 = Dom, 1 = Seg, ..., 5 = Sex, 6 = Sáb
  const diff = (day >= 5) ? (day - 5) : (day + 2); // dias desde a última sexta
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const now = new Date();
    const lastFriday = getMostRecentFriday(now);

    // Buscar logs de importação criados a partir da última sexta-feira
    const logs = await prisma.importLog.findMany({
      where: {
        createdAt: {
          gte: lastFriday
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Identificar logs para cada tipo necessário
    const extratosLog = logs.find(log => log.fileType === "BANCO_BB" || log.fileType === "BANCO_INTER");
    const atendimentosLog = logs.find(log => log.fileType === "SEUFISIO");
    const perfilLog = logs.find(log => log.fileType === "PERFIL_PACIENTE");

    const status = {
      extratos: {
        uploaded: !!extratosLog,
        fileName: extratosLog?.fileName || null,
        createdAt: extratosLog?.createdAt || null
      },
      atendimentos: {
        uploaded: !!atendimentosLog,
        fileName: atendimentosLog?.fileName || null,
        createdAt: atendimentosLog?.createdAt || null
      },
      perfil: {
        uploaded: !!perfilLog,
        fileName: perfilLog?.fileName || null,
        createdAt: perfilLog?.createdAt || null
      }
    };

    // Pendente se algum dos três tipos estiver faltando
    const hasPending = !status.extratos.uploaded || !status.atendimentos.uploaded || !status.perfil.uploaded;

    return NextResponse.json({
      hasPending,
      lastFriday: lastFriday.toISOString(),
      status
    });
  } catch (error: any) {
    console.error("Erro na API de notificações:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
