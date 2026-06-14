import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateImageWithFallback } from "@/lib/gemini-image";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId é obrigatório." }, { status: 400 });
    }

    const post = await prisma.marketingPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }

    // Call Gemini Image (Nano Banana 2) with AI Horde Fallback
    const dataUrl = await generateImageWithFallback(post.imagePrompt, {
      width: 512,
      height: 512
    });

    // Save in database
    await prisma.marketingPost.update({
      where: { id: postId },
      data: { imageUrl: dataUrl }
    });

    return NextResponse.json({ success: true, imageUrl: dataUrl });
  } catch (error: any) {
    console.error("[generate-image] Erro ao gerar imagem:", error);
    return NextResponse.json({ error: error.message || "Erro na geração da imagem." }, { status: 500 });
  }
}
