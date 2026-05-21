"use server";

import { prisma } from "@/lib/prisma";
import { getPatientSession } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export type DiaryLogInput = {
  painLevel: number;
  mood: string;
  disposition: string;
  note: string;
};

export async function saveDiaryLog(data: DiaryLogInput) {
  try {
    // Pegar sessão ativa do paciente com segurança
    const session = await getPatientSession();
    if (!session || !session.id) {
      return { success: false, error: "Sessão expirada ou inválida." };
    }

    // Criar o registro no banco
    const log = await prisma.diaryLog.create({
      data: {
        patientId: session.id,
        painLevel: data.painLevel,
        mood: data.mood,
        disposition: data.disposition,
        note: data.note,
      }
    });

    // Invalida a rota do gestor para atualizar listagem se necessário
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/patient/${session.id}`);
    revalidatePath("/integracao");

    return { success: true, data: log };
  } catch (error) {
    console.error("Erro ao salvar diário:", error);
    return { success: false, error: "Erro interno do servidor." };
  }
}
