"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(id: string, data: any) {
    if (!id || typeof id !== 'string') {
        return { success: false, error: "Sessão inválida. Por favor, saia e entre novamente." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return { success: false, error: "Usuário não encontrado" };

        let updatedPassword = user.password;
        if (data.newPassword) {
            updatedPassword = await bcrypt.hash(data.newPassword, 10);
        }

        const logs = Array.isArray(user.change_logs) ? [...user.change_logs as any[]] : [];
        logs.push({
            timestamp: new Date().toISOString(),
            entry: `Usuário atualizou seu próprio perfil${data.newPassword ? ' e senha' : ''}`
        });

        // Defensive date handling
        let birthDate: Date | null = null;
        if (data.birth_date) {
            const parsedDate = new Date(data.birth_date);
            if (!isNaN(parsedDate.getTime())) {
                birthDate = parsedDate;
            }
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                crefito: data.crefito,
                birth_date: birthDate,
                password: updatedPassword,
                signature: data.signature,
                change_logs: logs
            }
        });

        revalidatePath("/dashboard/profile");
        
        return { 
            success: true, 
            data: { 
                id: updated.id, 
                name: updated.name, 
                email: updated.email,
                birth_date: updated.birth_date,
                role: updated.role, 
                crefito: updated.crefito, 
                avatar_url: updated.avatar_url,
                signature: updated.signature
            } 
        };
    } catch (error: any) {
        console.error("Error updating profile:", error);
        
        // Return a slightly more helpful error message if it's a known constraint issue
        let errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Unique constraint")) {
            errorMessage = "Este email já está sendo utilizado por outro usuário.";
        }

        return { success: false, error: `Falha ao salvar: ${errorMessage.substring(0, 150)}` };
    }
}
