import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.patient.findMany({
    select: { name: true, birth_date: true }
  });
  return NextResponse.json(data);
}
