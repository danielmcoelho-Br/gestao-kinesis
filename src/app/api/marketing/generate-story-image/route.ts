import { NextRequest, NextResponse } from "next/server";
import { generateImageWithFallback } from "@/lib/gemini-image";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visualPrompt } = body;

    if (!visualPrompt) {
      return NextResponse.json({ error: "visualPrompt é obrigatório." }, { status: 400 });
    }

    // Call Gemini Image (Nano Banana 2) with AI Horde Fallback
    const dataUrl = await generateImageWithFallback(visualPrompt, {
      width: 512,
      height: 896
    });

    return NextResponse.json({ success: true, imageUrl: dataUrl });
  } catch (error: any) {
    console.error("[generate-story-image] Erro ao gerar imagem vertical:", error);
    return NextResponse.json({ error: error.message || "Erro na geração da imagem." }, { status: 500 });
  }
}
