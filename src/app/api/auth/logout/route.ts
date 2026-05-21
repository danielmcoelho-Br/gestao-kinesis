import { NextResponse } from "next/server";
import { destroySession } from "@/gestao/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ message: "Logout realizado com sucesso" });
}
