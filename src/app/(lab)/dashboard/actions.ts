"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createPatientSchema, updatePatientSchema, addPatientDocumentSchema } from "@/lab/lib/schemas";

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function getPatients(query: string = "", limit?: number) {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        created_by: {
          select: { name: true }
        },
        assessments: {
          where: {
            assessment_type: 'oswestry'
          },
          select: {
            id: true
          }
        }
      },

      orderBy: {
        createdAt: 'desc'
      },
      take: limit ?? 50
    });
    
    // Transform to include a flag
    const formatted = patients.map((p: any) => ({
      ...p,
      hasOswestry: p.assessments.length > 0
    }));


    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return { success: false, error: "Falha ao buscar pacientes" };
  }
}

export async function findPatientByName(name: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
    return { success: true, data: patient };
  } catch (error) {
    console.error("Error finding patient by name:", error);
    return { success: false, error: "Erro ao buscar duplicidade de nome" };
  }
}

export async function createPatient(data: {
  name: string;
  birth_date?: Date;
  age?: number;
  gender?: string;
  dominance?: string;
  activity_level?: string;
  created_by_id?: string;
  phone?: string;
}) {
  try {
    // Defensive date handling
    let birth_date = data.birth_date;
    if (birth_date && isNaN(birth_date.getTime())) {
      console.warn("Invalid birth_date received, setting to null");
      birth_date = undefined;
    }

    const validationResult = createPatientSchema.safeParse(data);
    if (!validationResult.success) {
      console.warn("Patient validation failed:", validationResult.error.format());
      return { success: false, error: "Dados do paciente inválidos ou incompletos." };
    }

    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        birth_date: birth_date,
        age: data.age || 0,
        gender: data.gender,
        dominance: data.dominance,
        activity_level: data.activity_level,
        created_by_id: data.created_by_id || null,
        phone: data.phone || null,
        change_logs: [
          {
            timestamp: new Date().toISOString(),
            entry: `Paciente cadastrado`
          }
        ]
      }
    });

    revalidatePath("/dashboard");
    return { success: true, data: patient };
  } catch (error: any) {
    console.error("Error creating patient:", error);
    return { success: false, error: `Falha ao criar paciente: ${error.message || "Erro desconhecido"}` };
  }
}

export async function updatePatient(id: string, data: any, userId?: string, userName?: string) {
  try {
    const current = await prisma.patient.findUnique({ where: { id } });
    if (!current) throw new Error("Paciente não encontrado");

    const parsedData = { ...data, id };
    const validationResult = updatePatientSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.warn("Patient validation failed:", validationResult.error.format());
      return { success: false, error: "Dados do paciente inválidos ou incompletos." };
    }

    const logs = Array.isArray(current.change_logs) ? [...current.change_logs as any[]] : [];
    const timestamp = new Date().toLocaleString('pt-BR');
    
    if (data.name !== current.name) logs.push({ timestamp: new Date().toISOString(), entry: `${timestamp} - ${userName || 'Usuário'} alterou nome de '${current.name}' para '${data.name}'` });

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: data.name,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        age: data.age,
        gender: data.gender,
        dominance: data.dominance,
        activity_level: data.activity_level,
        phone: data.phone,
        change_logs: logs
      }
    });
    revalidatePath("/dashboard");
    return { success: true, data: patient };
  } catch (error) {
    console.error("Error updating patient:", error);
    return { success: false, error: "Falha ao atualizar paciente" };
  }
}


export async function deletePatient(id: string) {
  try {
    await prisma.patient.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting patient:", error);
    return { success: false, error: `Falha ao excluir: ${error?.message || error}` };
  }
}

export async function getPatientAssessments(patientId: string) {
  console.log(`[DEBUG] getPatientAssessments called for: ${patientId}`);
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    const assessments = await prisma.assessment.findMany({
      where: { patient_id: patientId },
      include: {
        created_by: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const patientData = patient ? {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      dominance: patient.dominance,
      activity_level: patient.activity_level,
      birth_date: patient.birth_date,
      created_at: patient.createdAt,
      phone: patient.phone,
      accessToken: patient.accessToken
    } : null;

    return { 
      success: true, 
      data: { patient: patientData, assessments } 
    };
  } catch (error) {
    console.error("Error fetching patient assessments:", error);
    return { success: false, error: "Falha ao buscar histórico" };
  }
}

export async function getPatient(id: string) {
  console.log(`[DEBUG] getPatient called for: ${id}`);
  try {
    const patient = await prisma.patient.findUnique({
      where: { id }
    });
    
    const patientData = patient ? {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      dominance: patient.dominance,
      activity_level: patient.activity_level,
      birth_date: patient.birth_date,
      created_at: patient.createdAt,
      phone: patient.phone,
      accessToken: patient.accessToken
    } : null;

    return { success: true, data: patientData };
  } catch (error) {
    console.error("Error fetching patient:", error);
    return { success: false, error: "Falha ao buscar paciente" };
  }
}

export async function deleteAssessment(id: string) {
  try {
    const assessment = await prisma.assessment.delete({
      where: { id }
    });
    
    revalidatePath("/dashboard/patient/[patientId]", "page");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return { success: false, error: "Falha ao excluir avaliação" };
  }
}

export async function addPatientDocument(patientId: string, doc: { name: string; type: string; data: string; size: number }) {
  try {
    const validationResult = addPatientDocumentSchema.safeParse({
      patient_id: patientId,
      description: doc.name,
      file_url: doc.data,
      file_type: doc.type
    });
    
    if (!validationResult.success) {
      console.warn("Document validation failed:", validationResult.error.format());
      return { success: false, error: "Dados do documento inválidos." };
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error("Paciente não encontrado");

    const currentDocs = Array.isArray(patient.documents) ? [...patient.documents as any[]] : [];
    const newDoc = {
      ...doc,
      id: Math.random().toString(36).substring(2, 11),
      uploaded_at: new Date().toISOString()
    };

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        documents: [...currentDocs, newDoc]
      }
    });

    revalidatePath(`/dashboard/patient/${patientId}`);
    return { success: true, data: newDoc };
  } catch (error: any) {
    console.error("Error adding document:", error);
    return { success: false, error: `Falha ao anexar documento: ${error.message || "Erro desconhecido"}` };
  }
}

export async function deletePatientDocument(patientId: string, documentId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error("Paciente não encontrado");

    const currentDocs = Array.isArray(patient.documents) ? [...patient.documents as any[]] : [];
    const filteredDocs = currentDocs.filter(d => d.id !== documentId);

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        documents: filteredDocs
      }
    });

    revalidatePath(`/dashboard/patient/${patientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return { success: false, error: `Falha ao excluir documento: ${error.message || "Erro desconhecido"}` };
  }
}

import crypto from 'crypto';

export async function ensurePatientAccessToken(patientId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { success: false, error: "Paciente não encontrado." };
    
    if (patient.accessToken) {
      return { success: true, accessToken: patient.accessToken };
    }
    
    // Generate random 12-char secure alpha token
    const newToken = crypto.randomBytes(8).toString('hex');
    
    await prisma.patient.update({
      where: { id: patientId },
      data: { accessToken: newToken }
    });
    
    revalidatePath(`/dashboard/patient/${patientId}`);
    return { success: true, accessToken: newToken };
  } catch (error) {
    console.error("Error ensuring patient access token:", error);
    return { success: false, error: "Falha ao gerar token." };
  }
}

export async function getGestaoPatientsPendingRegister() {
  try {
    const sessions = await prisma.session.findMany({
      select: { patientName: true }
    });
    const billingSessions = await prisma.billingSession.findMany({
      select: { patientName: true, phone: true }
    });

    const nameToPhoneMap = new Map<string, string>();
    billingSessions.forEach(bs => {
      if (bs.phone) {
        nameToPhoneMap.set(bs.patientName.trim().toLowerCase(), bs.phone);
      }
    });

    const allGestaoNames = Array.from(new Set([
      ...sessions.map(s => s.patientName.trim()),
      ...billingSessions.map(bs => bs.patientName.trim())
    ])).filter(Boolean);

    const existingPatients = await prisma.patient.findMany({
      select: { name: true }
    });
    const existingNamesLower = new Set(existingPatients.map(p => p.name.trim().toLowerCase()));

    const pending = allGestaoNames
      .filter(name => !existingNamesLower.has(name.trim().toLowerCase()))
      .map(name => ({
        name,
        phone: nameToPhoneMap.get(name.trim().toLowerCase()) || null
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: pending };
  } catch (error) {
    console.error("Error fetching pending gestao patients:", error);
    return { success: false, error: "Erro ao buscar pacientes pendentes da Gestão" };
  }
}

export async function getPatientEvolutions(patientId: string) {
  try {
    const evolutions = await prisma.evolution.findMany({
      where: { patientId },
      include: {
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: evolutions };
  } catch (error) {
    console.error("Error fetching patient evolutions:", error);
    return { success: false, error: "Erro ao buscar evoluções do paciente" };
  }
}

export async function createPatientEvolution(data: {
  patientId: string;
  content: string;
  date: Date;
  createdById?: string;
}) {
  try {
    const evolution = await prisma.evolution.create({
      data: {
        patientId: data.patientId,
        content: data.content,
        date: new Date(data.date),
        createdById: data.createdById || null
      }
    });
    revalidatePath(`/dashboard/patient/${data.patientId}`);
    return { success: true, data: evolution };
  } catch (error) {
    console.error("Error creating evolution:", error);
    return { success: false, error: "Erro ao registrar evolução" };
  }
}

export async function updatePatientEvolution(id: string, content: string, date: Date) {
  try {
    const evolution = await prisma.evolution.update({
      where: { id },
      data: {
        content,
        date: new Date(date)
      }
    });
    revalidatePath(`/dashboard/patient/${evolution.patientId}`);
    return { success: true, data: evolution };
  } catch (error) {
    console.error("Error updating evolution:", error);
    return { success: false, error: "Erro ao atualizar evolução" };
  }
}

export async function deletePatientEvolution(id: string) {
  try {
    const evolution = await prisma.evolution.delete({
      where: { id }
    });
    revalidatePath(`/dashboard/patient/${evolution.patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting evolution:", error);
    return { success: false, error: "Erro ao deletar evolução" };
  }
}

export async function getPatientDiaryHistory(patientId: string) {
  try {
    const logs = await prisma.diaryLog.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Error fetching diary logs:", error);
    return { success: false, error: "Erro ao buscar histórico de dor" };
  }
}

export async function getGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    return { success: true, data: groups };
  } catch (error) {
    console.error("Error fetching groups:", error);
    return { success: false, error: "Falha ao buscar grupos" };
  }
}

export async function createGroup(name: string, patientIds: string[]) {
  try {
    const existing = await prisma.group.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return { success: false, error: "Já existe um grupo com este nome" };
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        patients: {
          connect: patientIds.map(id => ({ id }))
        }
      },
      include: {
        patients: true
      }
    });

    revalidatePath("/dashboard");
    return { success: true, data: group };
  } catch (error: any) {
    console.error("Error creating group:", error);
    return { success: false, error: `Falha ao criar grupo: ${error.message || error}` };
  }
}

export async function updateGroup(id: string, name: string, patientIds: string[]) {
  try {
    const existing = await prisma.group.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    });
    if (existing) {
      return { success: false, error: "Já existe outro grupo com este nome" };
    }

    const currentGroup = await prisma.group.findUnique({
      where: { id },
      include: { patients: { select: { id: true } } }
    });

    if (!currentGroup) {
      return { success: false, error: "Grupo não encontrado" };
    }

    const currentPatientIds = currentGroup.patients.map((p: any) => p.id);
    const disconnectIds = currentPatientIds.filter((id: string) => !patientIds.includes(id));

    const group = await prisma.group.update({
      where: { id },
      data: {
        name: name.trim(),
        patients: {
          disconnect: disconnectIds.map((id: string) => ({ id })),
          connect: patientIds.map((id: string) => ({ id }))
        }
      },
      include: {
        patients: true
      }
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/group/${id}`);
    return { success: true, data: group };
  } catch (error: any) {
    console.error("Error updating group:", error);
    return { success: false, error: `Falha ao atualizar grupo: ${error.message || error}` };
  }
}

export async function deleteGroup(id: string) {
  try {
    await prisma.group.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting group:", error);
    return { success: false, error: `Falha ao excluir grupo: ${error.message || error}` };
  }
}

export async function getGroupDetails(id: string) {
  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
            accessToken: true,
            createdAt: true,
            gender: true,
            age: true
          }
        }
      }
    });
    if (!group) {
      return { success: false, error: "Grupo não encontrado" };
    }
    return { success: true, data: group };
  } catch (error) {
    console.error("Error fetching group details:", error);
    return { success: false, error: "Falha ao buscar detalhes do grupo" };
  }
}

