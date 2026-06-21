"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/gestao/lib/auth";

async function checkAuth() {
    const session = await getSession();
    return session;
}

async function checkAdmin() {
    const session = await getSession();
    if (!session || !['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(session.role || '').toUpperCase())) {
        return false;
    }
    return true;
}

export async function getTemplates() {
    if (!await checkAuth()) {
        return { success: false, error: "Acesso não autorizado. Por favor, faça login." };
    }
    try {
        const templates = await prisma.assessmentTemplate.findMany({
            orderBy: { title: 'asc' }
        });
        return { success: true, data: templates };
    } catch (error) {
        console.error("Error fetching templates:", error);
        return { success: false, error: "Falha ao buscar modelos" };
    }
}

export async function createTemplate(data: any) {
    if (!await checkAdmin()) {
        return { success: false, error: "Acesso não autorizado. Apenas administradores podem gerenciar modelos." };
    }
    try {
        const template = await prisma.assessmentTemplate.create({
            data: {
                title: data.title,
                description: data.description,
                segment: data.segment,
                icon_url: data.icon_url,
                structure: data.structure || {},
                is_active: true,
                change_logs: [
                    {
                        timestamp: new Date().toISOString(),
                        entry: `Modelo criado`
                    }
                ]
            }
        });
        revalidatePath("/dashboard/admin/assessments");
        return { success: true, data: template };
    } catch (error) {
        console.error("Error creating template:", error);
        return { success: false, error: "Falha ao criar modelo" };
    }
}

export async function updateTemplate(id: string, data: any, adminName: string) {
    if (!await checkAdmin()) {
        return { success: false, error: "Acesso não autorizado. Apenas administradores podem gerenciar modelos." };
    }
    try {
        const current = await prisma.assessmentTemplate.findUnique({ where: { id } });
        if (!current) throw new Error("Modelo não encontrado");

        const logs = Array.isArray(current.change_logs) ? [...current.change_logs as any[]] : [];
        const timestamp = new Date().toLocaleString('pt-BR');
        
        const newLogs: string[] = [];
        if (data.title !== current.title) newLogs.push(`${timestamp} - ${adminName} alterou título de '${current.title}' para '${data.title}'`);
        if (data.segment !== current.segment) newLogs.push(`${timestamp} - ${adminName} alterou segmento de '${current.segment}' para '${data.segment}'`);
        if (data.is_active !== current.is_active) newLogs.push(`${timestamp} - ${adminName} alterou status para ${data.is_active ? 'Ativo' : 'Inativo'}`);
        if (JSON.stringify(data.structure) !== JSON.stringify(current.structure)) newLogs.push(`${timestamp} - ${adminName} alterou a estrutura do formulário`);

        newLogs.forEach(entry => logs.push({ timestamp: new Date().toISOString(), entry }));

        const updated = await prisma.assessmentTemplate.update({

            where: { id },
            data: {
                title: data.title,
                description: data.description,
                segment: data.segment,
                icon_url: data.icon_url,
                structure: data.structure,
                is_active: data.is_active,
                change_logs: logs
            }
        });

        revalidatePath("/dashboard/admin/assessments");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating template:", error);
        return { success: false, error: "Falha ao atualizar modelo" };
    }
}

export async function deleteTemplate(id: string) {
    if (!await checkAdmin()) {
        return { success: false, error: "Acesso não autorizado. Apenas administradores podem gerenciar modelos." };
    }
    try {
        await prisma.assessmentTemplate.delete({ where: { id } });
        revalidatePath("/dashboard/admin/assessments");
        return { success: true };
    } catch (error) {
        console.error("Error deleting template:", error);
        return { success: false, error: "Falha ao excluir modelo" };
    }
}
