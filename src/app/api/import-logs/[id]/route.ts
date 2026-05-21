import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar o log para saber o que limpar
    const log = await prisma.importLog.findUnique({
      where: { id }
    });

    if (!log) {
      return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
    }

    const startOfMonth = new Date(log.year, log.month, 1);
    const endOfMonth = new Date(log.year, log.month + 1, 0, 23, 59, 59);

    // Limpar os dados dependendo do tipo
    if (log.fileType === "SEUFISIO") {
      await prisma.session.deleteMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth }
        }
      });
    } else if (log.fileType === "BANCO_BB" || log.fileType === "BANCO_INTER") {
      const bankName = log.fileType === "BANCO_BB" ? "Banco do Brasil" : "Banco Inter";
      await prisma.transaction.deleteMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          bank: bankName
        }
      });
    }

    // Deletar o log
    await prisma.importLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
