"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: "Falha ao buscar usuários" };
    }
}

import bcrypt from "bcryptjs";

export async function createUser(data: any) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                crefito: data.crefito,
                avatar_url: data.avatar_url,
                birth_date: data.birth_date ? new Date(data.birth_date) : null,
                is_active: true,
                force_password_change: data.force_password_change || false,
                change_logs: [
                    {
                        timestamp: new Date().toISOString(),
                        entry: `Usuário criado por Administrador`
                    }
                ]
            }
        });
        revalidatePath("/dashboard/admin/users");
        return { success: true, data: user };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: "Falha ao criar usuário (email já pode estar em uso)" };
    }
}

export async function updateUser(id: string, data: any, adminName: string) {
    try {
        const current = await prisma.user.findUnique({ where: { id } }) as any;
        if (!current) throw new Error("Usuário não encontrado");

        const logs = Array.isArray(current.change_logs) ? [...current.change_logs as any[]] : [];
        const timestamp = new Date().toLocaleString('pt-BR');
        
        const newLogs: string[] = [];
        if (data.name !== current.name) newLogs.push(`${timestamp} - ${adminName} alterou nome de '${current.name}' para '${data.name}'`);
        if (data.email !== current.email) newLogs.push(`${timestamp} - ${adminName} alterou email de '${current.email}' para '${data.email}'`);
        if (data.role !== current.role) newLogs.push(`${timestamp} - ${adminName} alterou função de '${current.role}' para '${data.role}'`);
        if (data.crefito !== current.crefito) newLogs.push(`${timestamp} - ${adminName} alterou CREFITO de '${current.crefito || 'vazio'}' para '${data.crefito || 'vazio'}'`);
        if (data.is_active !== current.is_active) newLogs.push(`${timestamp} - ${adminName} alterou status para ${data.is_active ? 'Ativo' : 'Inativo'}`);
        if (data.password) newLogs.push(`${timestamp} - ${adminName} alterou a senha do usuário`);

        newLogs.forEach(entry => logs.push({ timestamp: new Date().toISOString(), entry }));

        let updatedPassword = current.password;
        if (data.password) {
            updatedPassword = await bcrypt.hash(data.password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                crefito: data.crefito,
                avatar_url: data.avatar_url,
                birth_date: data.birth_date ? new Date(data.birth_date) : null,
                is_active: data.is_active,
                force_password_change: data.force_password_change,
                password: updatedPassword,
                change_logs: logs
            }
        });

        revalidatePath("/dashboard/admin/users");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Falha ao atualizar usuário" };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath("/dashboard/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Falha ao remover usuário" };
    }
}
