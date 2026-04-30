import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;
    const filePath = path.join(process.cwd(), "uploads", fileName);

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
