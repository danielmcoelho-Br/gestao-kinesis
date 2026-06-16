"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createPatientSchema, updatePatientSchema, addPatientDocumentSchema } from "@/lab/lib/schemas";
import { normalizeName } from "@/lib/utils";

const isValidUUID = (id: string) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || 
         /^[a-z0-9]{20,32}$/i.test(id);
};



export async function getPatients(
  query: string = "",
  limit?: number,
  professionalId?: string,
  showDischarged: boolean = false
) {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // 1. Obter sessões finalizadas nos últimos 30 dias para aplicar restrição temporal (excluindo Pilates)
    const sessionsLastMonth = await prisma.session.findMany({
      where: {
        status: { contains: "Finalizado", mode: 'insensitive' },
        date: { gte: oneMonthAgo },
        NOT: {
          serviceType: { contains: "Pilates", mode: 'insensitive' }
        }
      },
      select: {
        patientName: true,
        professionalId: true
      }
    });

    const uniquePatientNamesOfLastMonth = Array.from(new Set(
      sessionsLastMonth.map(s => s.patientName.trim().toLowerCase())
    ));
    const uniquePatientNamesOfLastMonthVariants = Array.from(new Set(
      uniquePatientNamesOfLastMonth.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const andConditions: any[] = [];

    // 2. Filtro por Fisioterapeuta e Restrição Temporal
    if (query) {
      // Se houver busca por texto (busca de nomes específicos), pesquisa de forma global em todo o banco
      andConditions.push({
        name: {
          contains: query,
          mode: 'insensitive'
        }
      });
    } else {
      // Sem busca por texto: restringe aos últimos 30 dias (atendidos pelo profissional ou novos sem atendimento)
      if (professionalId && professionalId !== "all") {
        const patientNamesForProf = Array.from(new Set(
          sessionsLastMonth
            .filter(s => s.professionalId === professionalId)
            .map(s => s.patientName.trim().toLowerCase())
        ));
        const patientNamesForProfVariants = Array.from(new Set(
          patientNamesForProf.flatMap(name => [
            name,
            name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          ])
        ));
        
        const startsWithConditions = patientNamesForProfVariants.map(name => ({
          name: {
            startsWith: name,
            mode: 'insensitive' as const
          }
        }));

        const newPatientCondition: any = {
          createdAt: { gte: oneMonthAgo }
        };

        if (uniquePatientNamesOfLastMonthVariants.length > 0) {
          newPatientCondition.AND = uniquePatientNamesOfLastMonthVariants.map(name => ({
            name: {
              not: {
                startsWith: name
              }
            }
          }));
        }

        andConditions.push({
          OR: [
            ...startsWithConditions,
            newPatientCondition
          ]
        });
      } else {
        const startsWithConditions = uniquePatientNamesOfLastMonthVariants.map(name => ({
          name: {
            startsWith: name,
            mode: 'insensitive' as const
          }
        }));

        andConditions.push({
          OR: [
            ...startsWithConditions,
            {
              createdAt: { gte: oneMonthAgo }
            }
          ]
        });
      }
    }

    // 3. Filtro por Alta (Em Atendimento)
    if (!showDischarged) {
      andConditions.push({
        OR: [
          {
            diagnoses: {
              none: {}
            }
          },
          {
            diagnoses: {
              some: {
                status: "ATIVO"
              }
            }
          }
        ]
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const patients = await prisma.patient.findMany({
      where: whereClause,
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
        },
        diagnoses: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ?? 50
    });
    
    // Obter sessões finalizadas (excluindo Pilates) APENAS para os pacientes retornados (com truncamento de 18 caracteres)
    const truncatedPatientNames = patients.map((p: any) => p.name.substring(0, 18).trim().toLowerCase());
    const truncatedPatientNamesVariants = Array.from(new Set(
      truncatedPatientNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));
    
    const patientSessions = truncatedPatientNamesVariants.length > 0 
      ? await prisma.session.findMany({
          where: {
            status: { contains: "Finalizado", mode: 'insensitive' },
            patientName: {
              in: truncatedPatientNamesVariants,
              mode: 'insensitive'
            },
            NOT: {
              serviceType: { contains: "Pilates", mode: 'insensitive' }
            }
          },
          select: {
            patientName: true,
            professional: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      : [];

    // Mapear profissionais pelo nome completo do paciente (usando comparação normalizada)
    const patientProfsMap = new Map<string, Array<{ id: string, name: string }>>();
    patientSessions.forEach(s => {
      if (!s.professional) return;
      const sessionNameNorm = normalizeName(s.patientName.substring(0, 18));
      
      const matchedPatient = patients.find(p => 
        normalizeName(p.name.substring(0, 18)) === sessionNameNorm
      );
      
      if (matchedPatient) {
        const key = normalizeName(matchedPatient.name);
        const existing = patientProfsMap.get(key) || [];
        if (!existing.some(p => p.id === s.professional.id)) {
          existing.push({ id: s.professional.id, name: s.professional.name });
          patientProfsMap.set(key, existing);
        }
      }
    });

    // Transform to include a flag and professionals (usando comparação normalizada)
    const formatted = patients.map((p: any) => ({
      ...p,
      hasOswestry: p.assessments.length > 0,
      professionals: patientProfsMap.get(normalizeName(p.name)) || []
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
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const sessions = await prisma.session.findMany({
      where: {
        date: { gte: oneMonthAgo },
        NOT: {
          serviceType: { contains: "Pilates", mode: 'insensitive' }
        }
      },
      select: { patientName: true },
      distinct: ['patientName']
    });
    const billingSessions = await prisma.billingSession.findMany({
      where: {
        date: { gte: oneMonthAgo },
        NOT: {
          serviceType: { contains: "Pilates", mode: 'insensitive' }
        }
      },
      select: { patientName: true, phone: true },
      distinct: ['patientName'],
      orderBy: [
        { patientName: 'asc' },
        { phone: 'desc' }
      ]
    });

    const nameToPhoneMap = new Map<string, string>();
    billingSessions.forEach(bs => {
      if (bs.phone) {
        nameToPhoneMap.set(normalizeName(bs.patientName), bs.phone);
      }
    });

    const allGestaoNames = Array.from(new Set([
      ...sessions.map(s => s.patientName.trim()),
      ...billingSessions.map(bs => bs.patientName.trim())
    ])).filter(Boolean);

    const existingPatients = await prisma.patient.findMany({
      select: { name: true }
    });
    const existingNamesLower = new Set(existingPatients.map(p => normalizeName(p.name)));

    const pending = allGestaoNames
      .filter(name => !existingNamesLower.has(normalizeName(name)))
      .map(name => ({
        name,
        phone: nameToPhoneMap.get(normalizeName(name)) || null
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

export async function getPatientDiagnoses(patientId: string) {
  try {
    const diagnoses = await prisma.patientDiagnosis.findMany({
      where: { patient_id: patientId },
      orderBy: { start_date: 'desc' }
    });
    return { success: true, data: diagnoses };
  } catch (error: any) {
    console.error("Error fetching patient diagnoses:", error);
    return { success: false, error: `Falha ao buscar diagnósticos: ${error.message || "Erro desconhecido"}` };
  }
}

async function ensureDefaultSuggestionsSeeded() {
  try {
    const count = await prisma.clinicalSegment.count();
    if (count > 0) return;

    const defaultData: Record<string, string[]> = {
      "Coluna": [
        "Cervicalgia / Dor Cervical",
        "Lombalgia / Dor Lombar",
        "Hérnia de Disco Cervical",
        "Hérnia de Disco Lombar",
        "Escoliose",
        "Estenose do Canal Vertebral"
      ],
      "Joelho": [
        "Lesão de Ligamento Cruzado Anterior (LCA)",
        "Lesão de Menisco",
        "Condromalácia Patelar / Dor Femoropatelar",
        "Artrose de Joelho (Gonartrose)",
        "Tendinite Patelar"
      ],
      "Ombro": [
        "Síndrome do Impacto / Lesão do Manguito Rotador",
        "Capsulite Adesiva (Ombro Congelado)",
        "Instabilidade de Ombro / Luxação Recidivante",
        "Tendinite do Bíceps"
      ],
      "Quadril": [
        "Artrose de Quadril (Coxartrose)",
        "Impacto Femoroacetabular (IFA)",
        "Bursite Trocantérica / Síndrome da Dor Trocantérica Maior"
      ],
      "Tornozelo e Pé": [
        "Entorse de Tornozelo",
        "Fascite Plantar",
        "Tendinopatia de Calcâneo (Aquiles)",
        "Esporão de Calcâneo"
      ],
      "Cotovelo, Punho e Mão": [
        "Epicondilite Lateral (Cotovelo de Tenista)",
        "Epicondilite Medial (Cotovelo de Golfista)",
        "Síndrome do Túnel do Carpo",
        "Tenossinovite de De Quervain"
      ]
    };

    for (const [segName, diags] of Object.entries(defaultData)) {
      const segment = await prisma.clinicalSegment.create({
        data: { name: segName }
      });
      for (const diag of diags) {
        await prisma.diagnosisSuggestion.create({
          data: {
            segmentId: segment.id,
            diagnosis: diag
          }
        });
      }
    }
  } catch (error) {
    console.error("Error seeding default suggestions:", error);
  }
}

export async function getClinicalSegmentsAndSuggestions() {
  try {
    await ensureDefaultSuggestionsSeeded();
    const segments = await prisma.clinicalSegment.findMany({
      include: {
        suggestions: {
          orderBy: { diagnosis: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: segments };
  } catch (error: any) {
    console.error("Error fetching clinical segments:", error);
    return { success: false, error: `Erro ao buscar segmentos e sugestões: ${error.message || error}` };
  }
}

export async function createClinicalSegment(name: string) {
  try {
    const segment = await prisma.clinicalSegment.create({
      data: { name: name.trim() }
    });
    revalidatePath("/dashboard");
    return { success: true, data: segment };
  } catch (error: any) {
    console.error("Error creating clinical segment:", error);
    return { success: false, error: `Erro ao criar segmento: ${error.message || error}` };
  }
}

export async function updateClinicalSegment(id: string, name: string) {
  try {
    const updated = await prisma.clinicalSegment.update({
      where: { id },
      data: { name: name.trim() }
    });
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating clinical segment:", error);
    return { success: false, error: `Erro ao renomear segmento: ${error.message || error}` };
  }
}

export async function deleteClinicalSegment(id: string) {
  try {
    await prisma.clinicalSegment.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting clinical segment:", error);
    return { success: false, error: `Erro ao excluir segmento: ${error.message || error}` };
  }
}

export async function createDiagnosisSuggestion(segmentId: string, diagnosis: string) {
  try {
    const suggestion = await prisma.diagnosisSuggestion.create({
      data: {
        segmentId,
        diagnosis: diagnosis.trim()
      }
    });
    revalidatePath("/dashboard");
    return { success: true, data: suggestion };
  } catch (error: any) {
    console.error("Error creating diagnosis suggestion:", error);
    return { success: false, error: `Erro ao adicionar sugestão: ${error.message || error}` };
  }
}

export async function updateDiagnosisSuggestion(id: string, diagnosis: string) {
  try {
    const updated = await prisma.diagnosisSuggestion.update({
      where: { id },
      data: { diagnosis: diagnosis.trim() }
    });
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating diagnosis suggestion:", error);
    return { success: false, error: `Erro ao renomear sugestão: ${error.message || error}` };
  }
}

export async function deleteDiagnosisSuggestion(id: string) {
  try {
    await prisma.diagnosisSuggestion.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting diagnosis suggestion:", error);
    return { success: false, error: `Erro ao excluir sugestão: ${error.message || error}` };
  }
}

export async function addPatientDiagnosis(patientId: string, data: { segment: string; diagnosis: string; start_date: Date }) {
  try {
    const newDiagnosis = await prisma.patientDiagnosis.create({
      data: {
        patient_id: patientId,
        segment: data.segment,
        diagnosis: data.diagnosis,
        start_date: new Date(data.start_date),
        status: "ATIVO"
      }
    });

    // Garante que o segmento e o diagnóstico existam nas sugestões dinâmicas
    try {
      let segmentRecord = await prisma.clinicalSegment.findUnique({
        where: { name: data.segment }
      });
      if (!segmentRecord) {
        segmentRecord = await prisma.clinicalSegment.create({
          data: { name: data.segment }
        });
      }

      await prisma.diagnosisSuggestion.upsert({
        where: {
          segmentId_diagnosis: {
            segmentId: segmentRecord.id,
            diagnosis: data.diagnosis
          }
        },
        create: {
          segmentId: segmentRecord.id,
          diagnosis: data.diagnosis
        },
        update: {}
      });
    } catch (err) {
      console.error("Error auto-saving suggestion in addPatientDiagnosis:", err);
    }

    revalidatePath(`/dashboard/patient/${patientId}`);
    return { success: true, data: newDiagnosis };
  } catch (error: any) {
    console.error("Error adding patient diagnosis:", error);
    return { success: false, error: `Falha ao salvar diagnóstico: ${error.message || "Erro desconhecido"}` };
  }
}

export async function updatePatientDiagnosisStatus(id: string, status: string, dischargeDate?: Date) {
  try {
    const updated = await prisma.patientDiagnosis.update({
      where: { id },
      data: {
        status,
        discharge_date: dischargeDate ? new Date(dischargeDate) : null
      }
    });
    revalidatePath(`/dashboard/patient/${updated.patient_id}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating patient diagnosis status:", error);
    return { success: false, error: `Falha ao atualizar diagnóstico: ${error.message || "Erro desconhecido"}` };
  }
}

export async function deletePatientDiagnosis(id: string) {
  try {
    const deleted = await prisma.patientDiagnosis.delete({
      where: { id }
    });
    revalidatePath(`/dashboard/patient/${deleted.patient_id}`);
    return { success: true, data: deleted };
  } catch (error: any) {
    console.error("Error deleting patient diagnosis:", error);
    return { success: false, error: `Falha ao excluir diagnóstico: ${error.message || "Erro desconhecido"}` };
  }
}

export async function getDischargedDiagnoses(
  professionalId: string = "all",
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number
) {
  try {
    const whereCondition: any = {
      status: "ALTA",
    };

    if (startMonth !== undefined && startYear !== undefined && endMonth !== undefined && endYear !== undefined) {
      const startPeriod = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      const endPeriod = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
      whereCondition.discharge_date = {
        gte: startPeriod,
        lte: endPeriod
      };
    }

    const diagnoses = await prisma.patientDiagnosis.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        discharge_date: 'desc'
      }
    });

    const uniqueTruncatedNames = Array.from(new Set(
      diagnoses.map(d => d.patient.name.substring(0, 18).trim().toLowerCase())
    ));
    const nameVariants = Array.from(new Set(
      uniqueTruncatedNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const sessions = nameVariants.length > 0
      ? await prisma.session.findMany({
          where: {
            patientName: {
              in: nameVariants,
              mode: 'insensitive'
            },
            status: { contains: "Finalizado", mode: 'insensitive' },
            NOT: {
              serviceType: { contains: "Pilates", mode: 'insensitive' }
            }
          },
          select: {
            date: true,
            professionalId: true,
            patientName: true,
            professional: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      : [];

    const sessionsMap = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const key = normalizeName(s.patientName.substring(0, 18));
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, []);
      }
      sessionsMap.get(key)!.push(s);
    }

    const formatted = [];

    for (const diag of diagnoses) {
      const patientName = diag.patient.name;
      const truncatedName = normalizeName(patientName.substring(0, 18));
      const patientSessions = sessionsMap.get(truncatedName) || [];

      // Filter sessions within the diagnosis period
      const diagStart = new Date(diag.start_date);
      const diagEnd = diag.discharge_date ? new Date(diag.discharge_date) : new Date();

      // Set time boundaries to cover the full days
      diagStart.setHours(0, 0, 0, 0);
      diagEnd.setHours(23, 59, 59, 999);

      const periodSessions = patientSessions.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= diagStart && sDate <= diagEnd;
      });

      // If filtering by professional, ensure the patient has had sessions with this professional
      if (professionalId !== "all") {
        const hasSessionWithProf = periodSessions.some(s => s.professionalId === professionalId);
        if (!hasSessionWithProf) {
          continue;
        }
      }

      formatted.push({
        id: diag.id,
        patientName: diag.patient.name,
        patientId: diag.patient.id,
        diagnosis: diag.diagnosis,
        segment: diag.segment,
        startDate: diag.start_date,
        dischargeDate: diag.discharge_date,
        sessionCount: periodSessions.length
      });
    }

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("Error in getDischargedDiagnoses:", error);
    return { success: false, error: error.message || "Erro ao buscar altas" };
  }
}

export async function getProfessionalDiagnosticsFrequency(
  professionalId: string = "all",
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number
) {
  try {
    let startPeriod: Date;
    let endPeriod: Date;

    if (startMonth !== undefined && startYear !== undefined && endMonth !== undefined && endYear !== undefined) {
      startPeriod = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      endPeriod = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startPeriod = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const diagnoses = await prisma.patientDiagnosis.findMany({
      where: {
        start_date: {
          gte: startPeriod,
          lte: endPeriod
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const uniqueTruncatedNames = Array.from(new Set(
      diagnoses.map(d => d.patient.name.substring(0, 18).trim().toLowerCase())
    ));
    const nameVariants = Array.from(new Set(
      uniqueTruncatedNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const professionalSessionsSet = new Set<string>();

    if (professionalId !== "all" && nameVariants.length > 0) {
      const sessions = await prisma.session.findMany({
        where: {
          professionalId: professionalId,
          patientName: {
            in: nameVariants,
            mode: 'insensitive'
          }
        },
        select: {
          patientName: true
        }
      });
      for (const s of sessions) {
        professionalSessionsSet.add(normalizeName(s.patientName.substring(0, 18)));
      }
    }

    const frequencyMap: { [key: string]: { segment: string; count: number } } = {};

    for (const diag of diagnoses) {
      const patientName = diag.patient.name;
      const truncatedName = normalizeName(patientName.substring(0, 18));

      if (professionalId !== "all") {
        if (!professionalSessionsSet.has(truncatedName)) {
          continue;
        }
      }

      const key = diag.diagnosis;
      if (!frequencyMap[key]) {
        frequencyMap[key] = { segment: diag.segment, count: 0 };
      }
      frequencyMap[key].count += 1;
    }

    const sorted = Object.entries(frequencyMap)
      .map(([diagnosis, item]) => ({ segment: item.segment, diagnosis, count: item.count }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: sorted };
  } catch (error: any) {
    console.error("Error in getProfessionalDiagnosticsFrequency:", error);
    return { success: false, error: error.message || "Erro ao buscar frequência de diagnósticos" };
  }
}

export async function getProfessionalCasesFrequency(
  professionalId: string = "all",
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number
) {
  try {
    let startPeriod: Date;
    let endPeriod: Date;

    if (startMonth !== undefined && startYear !== undefined && endMonth !== undefined && endYear !== undefined) {
      startPeriod = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      endPeriod = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startPeriod = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const diagnoses = await prisma.patientDiagnosis.findMany({
      where: {
        start_date: {
          lte: endPeriod
        },
        OR: [
          { discharge_date: null },
          { discharge_date: { gte: startPeriod } },
          { status: "ATIVO" }
        ]
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const uniqueTruncatedNames = Array.from(new Set(
      diagnoses.map(d => d.patient.name.substring(0, 18).trim().toLowerCase())
    ));
    const nameVariants = Array.from(new Set(
      uniqueTruncatedNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const patientWithSessionsSet = new Set<string>();

    if (nameVariants.length > 0) {
      const sessionsWhereClause: any = {
        patientName: {
          in: nameVariants,
          mode: 'insensitive'
        },
        status: { contains: "Finalizado", mode: 'insensitive' },
        date: {
          gte: startPeriod,
          lte: endPeriod
        },
        NOT: {
          serviceType: { contains: "Pilates", mode: 'insensitive' }
        }
      };

      if (professionalId !== "all") {
        sessionsWhereClause.professionalId = professionalId;
      }

      const sessions = await prisma.session.findMany({
        where: sessionsWhereClause,
        select: {
          patientName: true
        }
      });

      for (const s of sessions) {
        patientWithSessionsSet.add(normalizeName(s.patientName.substring(0, 18)));
      }
    }

    const frequencyMap: { [key: string]: { segment: string; count: number } } = {};

    for (const diag of diagnoses) {
      const patientName = diag.patient.name;
      const truncatedName = normalizeName(patientName.substring(0, 18));

      if (!patientWithSessionsSet.has(truncatedName)) {
        continue;
      }

      const key = diag.diagnosis;
      if (!frequencyMap[key]) {
        frequencyMap[key] = { segment: diag.segment, count: 0 };
      }
      frequencyMap[key].count += 1;
    }

    const sorted = Object.entries(frequencyMap)
      .map(([diagnosis, item]) => ({ segment: item.segment, diagnosis, count: item.count }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: sorted };
  } catch (error: any) {
    console.error("Error in getProfessionalCasesFrequency:", error);
    return { success: false, error: error.message || "Erro ao buscar frequência de casos" };
  }
}

export async function getAverageSessionsPerDiagnosis(
  professionalId: string = "all",
  startMonth?: number,
  startYear?: number,
  endMonth?: number,
  endYear?: number
) {
  try {
    const whereCondition: any = {
      status: "ALTA"
    };

    let startPeriod: Date;
    let endPeriod: Date;

    if (startMonth !== undefined && startYear !== undefined && endMonth !== undefined && endYear !== undefined) {
      startPeriod = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      endPeriod = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
      whereCondition.discharge_date = {
        gte: startPeriod,
        lte: endPeriod
      };
    } else {
      const now = new Date();
      startPeriod = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const diagnoses = await prisma.patientDiagnosis.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const uniqueTruncatedNames = Array.from(new Set(
      diagnoses.map(d => d.patient.name.substring(0, 18).trim().toLowerCase())
    ));
    const nameVariants = Array.from(new Set(
      uniqueTruncatedNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const sessions = nameVariants.length > 0
      ? await prisma.session.findMany({
          where: {
            patientName: {
              in: nameVariants,
              mode: 'insensitive'
            },
            status: { contains: "Finalizado", mode: 'insensitive' },
            NOT: {
              serviceType: { contains: "Pilates", mode: 'insensitive' }
            }
          },
          select: {
            date: true,
            professionalId: true,
            patientName: true
          }
        })
      : [];

    const sessionsMap = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const key = normalizeName(s.patientName.substring(0, 18));
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, []);
      }
      sessionsMap.get(key)!.push(s);
    }

    const diagnosisSessions: { [key: string]: { segment: string; sessionsArray: number[] } } = {};

    for (const diag of diagnoses) {
      const patientName = diag.patient.name;
      const truncatedName = normalizeName(patientName.substring(0, 18));
      const patientSessions = sessionsMap.get(truncatedName) || [];

      // Filtrar sessões no período do diagnóstico (início até a alta)
      const diagStart = new Date(diag.start_date);
      const diagEnd = diag.discharge_date ? new Date(diag.discharge_date) : new Date();

      diagStart.setHours(0, 0, 0, 0);
      diagEnd.setHours(23, 59, 59, 999);

      const periodSessions = patientSessions.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= diagStart && sDate <= diagEnd;
      });

      // Se filtrado por profissional, certificar-se de que o paciente teve sessões com esse profissional
      if (professionalId !== "all") {
        const hasSessionWithProf = periodSessions.some(s => s.professionalId === professionalId);
        if (!hasSessionWithProf) {
          continue;
        }
      }

      const key = diag.diagnosis;
      if (!diagnosisSessions[key]) {
        diagnosisSessions[key] = { segment: diag.segment, sessionsArray: [] };
      }
      diagnosisSessions[key].sessionsArray.push(periodSessions.length);
    }

    const result = Object.entries(diagnosisSessions).map(([diagnosis, item]) => {
      const totalSessions = item.sessionsArray.reduce((sum, val) => sum + val, 0);
      const averageSessions = item.sessionsArray.length > 0 ? Number((totalSessions / item.sessionsArray.length).toFixed(1)) : 0;
      return {
        segment: item.segment,
        diagnosis,
        averageSessions,
        casesCount: item.sessionsArray.length
      };
    }).sort((a, b) => b.casesCount - a.casesCount);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error in getAverageSessionsPerDiagnosis:", error);
    return { success: false, error: error.message || "Erro ao calcular média de sessões" };
  }
}


