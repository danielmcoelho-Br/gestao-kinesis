"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPatientByToken(token: string) {
    if (!token || token.length < 8) return null;
    try {
        const patient = await prisma.patient.findUnique({
            where: { accessToken: token },
            select: {
                id: true,
                name: true,
                accessToken: true
            }
        });
        return patient;
    } catch (error) {
        console.error("Error getting patient by token:", error);
        return null;
    }
}

export async function saveDiaryEntry(token: string, data: {
    painLevel: number;
    mood?: string;
    disposition?: string;
    note?: string;
}) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { accessToken: token },
            select: { id: true }
        });
        
        if (!patient) return { success: false, error: "Paciente não identificado." };
        
        await prisma.diaryLog.create({
            data: {
                patientId: patient.id,
                painLevel: data.painLevel,
                mood: data.mood,
                disposition: data.disposition,
                note: data.note
            }
        });
        
        revalidatePath("/dashboard"); // Clear admin cache to show new entry
        return { success: true };
    } catch (error) {
        console.error("Error saving diary log:", error);
        return { success: false, error: "Erro no servidor." };
    }
}
