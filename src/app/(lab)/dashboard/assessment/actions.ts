"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const isValidUUID = (id: string) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || 
         /^[a-z0-9]{20,32}$/i.test(id);
};

const parsePtBrDate = (dateStr?: string) => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-based
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      date.setHours(12, 0, 0, 0);
      return date;
    }
  }
  return undefined;
};

export async function saveAssessment(data: {
  patientId: string;
  type: string;
  segment: string;
  answers: any;
  scoreData: any;
  userId?: string;
  date?: string;
}) {
  console.log(`[DEBUG] saveAssessment called for patient: ${data.patientId}`);
  if (!data.patientId) return { success: false, error: "ID de paciente inválido" };

  try {
    const createdDate = parsePtBrDate(data.date);
    const assessment = await prisma.assessment.create({
      data: {
        patient_id: data.patientId,
        assessment_type: data.type,
        segment: data.segment,
        questionnaire_answers: data.answers,
        clinical_data: data.scoreData,
        created_by_id: data.userId,
        created_at: createdDate
      }
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/patient/${data.patientId}`);
    return { success: true, id: assessment.id };
  } catch (error) {
    console.error("Error saving assessment:", error);
    return { success: false, error: "Falha ao salvar avaliação" };
  }
}

export async function getAssessment(id: string) {
  console.log(`[DEBUG] getAssessment called for: ${id}`);
  if (!id) return { success: false, error: "ID de avaliação inválido" };

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        created_by: {
          select: {
            name: true,
            crefito: true
          }
        }
      }
    });

    if (!assessment) return { success: false, error: "Avaliação não encontrada" };

    // Sanitize to ensure serializability
    const sanitized = {
      id: assessment.id,
      patient_id: assessment.patient_id,
      assessment_type: assessment.assessment_type,
      segment: assessment.segment,
      questionnaire_answers: assessment.questionnaire_answers,
      clinical_data: assessment.clinical_data,
      created_at: assessment.created_at,
      created_by_id: assessment.created_by_id,
      change_logs: Array.isArray(assessment.change_logs) ? assessment.change_logs : [],
      created_by: assessment.created_by
    };

    return { success: true, data: sanitized };
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return { success: false, error: "Falha ao buscar avaliação" };
  }
}

export async function updateAssessment(id: string, data: {
  answers: any;
  scoreData: any;
  logEntries: string[];
  date?: string;
}) {
  console.log(`[DEBUG] updateAssessment called for: ${id}`);
  if (!id) return { success: false, error: "ID de avaliação inválido" };

  try {
    const current = await prisma.assessment.findUnique({
      where: { id },
      select: { change_logs: true }
    });

    const logs = Array.isArray(current?.change_logs) ? [...current.change_logs as any[]] : [];
    
    data.logEntries.forEach(entry => {
        logs.push({
            timestamp: new Date().toISOString(),
            entry: entry
        });
    });

    const createdDate = parsePtBrDate(data.date);
    const updateData: any = {
      questionnaire_answers: data.answers,
      clinical_data: data.scoreData,
      change_logs: logs
    };
    if (createdDate) {
      updateData.created_at = createdDate;
    }

    await prisma.assessment.update({
      where: { id },
      data: updateData
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating assessment:", error);
    return { success: false, error: "Falha ao atualizar avaliação" };
  }
}
