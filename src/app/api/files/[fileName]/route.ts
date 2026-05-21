import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    
    // Sanitiza o nome do arquivo impedindo caracteres de navegação no path (ex: ../..)
    const safeFileName = path.basename(fileName);
    const uploadDir = path.join(os.tmpdir(), "uploads");
    const filePath = path.join(uploadDir, safeFileName);

    // Garante que o arquivo solicitado está dentro do diretório permitido de uploads
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
