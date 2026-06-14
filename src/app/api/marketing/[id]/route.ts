import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, imagePrompt, imageUrl, status, storyContent } = body;

    const existing = await prisma.marketingPost.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }

    const updated = await prisma.marketingPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        content: content !== undefined ? content : existing.content,
        imagePrompt: imagePrompt !== undefined ? imagePrompt : existing.imagePrompt,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        status: status !== undefined ? status : existing.status,
        storyContent: storyContent !== undefined ? storyContent : existing.storyContent
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.marketingPost.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Postagem não encontrada." }, { status: 404 });
    }

    await prisma.marketingPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
