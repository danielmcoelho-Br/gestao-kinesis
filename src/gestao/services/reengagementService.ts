import { prisma } from "@/lib/prisma";

export interface InactivePatientInfo {
  id: string;
  name: string;
  phone: string | null;
  accessToken: string | null;
  lastSessionDate: Date;
  daysInactive: number;
  lastContactedAt?: string | null;
}

function cleanName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchPatientName(sessionNameClean: string, patientNameClean: string): boolean {
  if (sessionNameClean === patientNameClean) return true;
  
  if (patientNameClean.startsWith(sessionNameClean) && sessionNameClean.length >= 8) return true;
  if (sessionNameClean.startsWith(patientNameClean) && patientNameClean.length >= 8) return true;

  const sWords = sessionNameClean.split(" ");
  const pWords = patientNameClean.split(" ");

  if (sWords.length === 0 || pWords.length === 0) return false;

  let matches = 0;
  for (let i = 0; i < sWords.length; i++) {
    const sWord = sWords[i];
    const pWord = pWords[i];

    if (!pWord) break;

    if (i === sWords.length - 1) {
      if (pWord.startsWith(sWord) && sWord.length >= 2) {
        matches++;
      }
    } else {
      if (sWord === pWord) {
        matches++;
      }
    }
  }

  if (matches === sWords.length && sWords.length >= 2) {
    return true;
  }

  return false;
}

export const ReengagementService = {
  /**
   * Identifica todos os pacientes inativos (última consulta há mais de X dias, sem consultas futuras agendadas e dentro do último mês de pesquisa).
   * @param daysThreshold Número de dias de inatividade (padrão: 14 dias)
   * @param referenceDate Data de referência para análise (padrão: data atual)
   * @param maxDaysInactive Limite máximo de inatividade para evitar listar pacientes de alta antiga (padrão: 45 dias)
   */
  async getInactivePatients(
    daysThreshold = 14,
    referenceDate = new Date(),
    maxDaysInactive = 45
  ): Promise<InactivePatientInfo[]> {
    const thresholdDate = new Date(referenceDate);
    thresholdDate.setDate(referenceDate.getDate() - daysThreshold);

    const minSessionDate = new Date(referenceDate);
    minSessionDate.setDate(referenceDate.getDate() - maxDaysInactive);

    // Buscar todos os pacientes com seus diagnósticos
    const patients = await prisma.patient.findMany({
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        accessToken: true, 
        change_logs: true,
        diagnoses: {
          select: {
            status: true
          }
        }
      }
    });

    // Buscar a data da última sessão de cada paciente de forma agrupada
    const lastSessions = await prisma.session.groupBy({
      by: ['patientName'],
      _max: {
        date: true
      }
    });

    // Buscar pacientes que têm sessões agendadas para o futuro a partir da data de referência
    const upcomingSessions = await prisma.session.groupBy({
      by: ['patientName'],
      where: {
        date: {
          gte: referenceDate
        }
      }
    });

    const lastSessionMap = new Map<string, Date>();
    lastSessions.forEach(s => {
      if (s._max.date) {
        lastSessionMap.set(cleanName(s.patientName), s._max.date);
      }
    });

    const upcomingPatientsSet = new Set(
      upcomingSessions.map(s => cleanName(s.patientName))
    );

    const inactiveList: InactivePatientInfo[] = [];

    for (const patient of patients) {
      // Regra 1: Pular pacientes que receberam alta (todos os diagnósticos são "ALTA")
      const allDischarged = patient.diagnoses && patient.diagnoses.length > 0 && 
                            patient.diagnoses.every(d => d.status === "ALTA");
      if (allDischarged) {
        continue;
      }

      const patientNameClean = cleanName(patient.name);
      
      // Encontrar a última sessão do paciente usando correspondência flexível
      let lastSessionDate: Date | undefined;
      for (const [sNameClean, date] of lastSessionMap.entries()) {
        if (matchPatientName(sNameClean, patientNameClean)) {
          if (!lastSessionDate || date > lastSessionDate) {
            lastSessionDate = date;
          }
        }
      }

      if (lastSessionDate) {
        // Regra 2: Inativo se a última sessão ocorreu antes de thresholdDate e após minSessionDate
        const isInactive = lastSessionDate < thresholdDate && lastSessionDate >= minSessionDate;
        if (isInactive) {
          // Verificar sessões futuras usando correspondência flexível
          let hasUpcoming = false;
          for (const sNameClean of upcomingPatientsSet) {
            if (matchPatientName(sNameClean, patientNameClean)) {
              hasUpcoming = true;
              break;
            }
          }

          if (!hasUpcoming) {
            let lastContactedAt: string | null = null;
            if (patient.change_logs && Array.isArray(patient.change_logs)) {
              const logs = patient.change_logs as any[];
              const contactLog = logs
                .filter(l => l.type === "REENGAGEMENT_CONTACT")
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              
              if (contactLog) {
                lastContactedAt = contactLog.date;
              }
            }

            inactiveList.push({
              id: patient.id,
              name: patient.name,
              phone: patient.phone,
              accessToken: patient.accessToken,
              lastSessionDate,
              daysInactive: Math.floor((referenceDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)),
              lastContactedAt
            });
          }
        }
      }
    }

    return inactiveList;
  },

  /**
   * Dispara o contato de reengajamento para um paciente.
   * Envia uma mensagem fictícia/WhatsApp API com o token único e registra no banco de dados.
   */
  async triggerReengagement(patientId: string): Promise<{ success: boolean; message: string }> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return { success: false, message: "Paciente não encontrado." };
    }

    if (!patient.accessToken) {
      return { success: false, message: "Paciente não possui token de acesso configurado." };
    }

    const phone = patient.phone || "Sem Telefone";
    const firstName = patient.name.split(' ')[0];
    
    // Link único para o portal de motivos
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/${patient.accessToken}/motivo`;

    const message = `Olá, ${firstName}! Sentimos sua falta na Kinesis. Como você está? Gostaríamos muito de entender se ocorreu algum problema ou se podemos te ajudar em algo. Se puder responder em 1 minutinho, clique aqui: ${portalLink}`;

    // Disparar envio real via WhatsappService
    const sendResult = await WhatsappService.sendTextMessage(phone, message);

    // Registrar o contato nos logs do paciente
    const logs = Array.isArray(patient.change_logs) ? (patient.change_logs as any[]) : [];
    
    logs.push({
      type: "REENGAGEMENT_CONTACT",
      date: new Date().toISOString(),
      status: sendResult.success ? "SENT" : "FAILED",
      error: sendResult.error || null,
      messageSent: message
    });

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        change_logs: logs
      }
    });

    return { 
      success: true, 
      message: `Mensagem enviada com sucesso para ${patient.name} (${phone}).` 
    };
  },

  /**
   * Salva a resposta do paciente explicando o motivo de sua ausência.
   */
  async saveReengagementFeedback(
    token: string, 
    feedback: { reason: string; comment?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const patient = await prisma.patient.findUnique({
      where: { accessToken: token }
    });

    if (!patient) {
      return { success: false, error: "Paciente inválido ou não encontrado." };
    }

    // Registrar o feedback no JSON de logs
    const logs = Array.isArray(patient.change_logs) ? (patient.change_logs as any[]) : [];
    
    logs.push({
      type: "REENGAGEMENT_FEEDBACK",
      date: new Date().toISOString(),
      reason: feedback.reason,
      comment: feedback.comment || "",
      reviewed: false // Para o admin poder marcar como "Lido/Resolvido"
    });

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        change_logs: logs
      }
    });

    return { success: true };
  },

  /**
   * Retorna todos os feedbacks recebidos para exibição no painel administrativo.
   */
  async getReengagementFeedbacks(): Promise<any[]> {
    const patients = await prisma.patient.findMany({
      where: {
        change_logs: {
          not: prisma.patient.fields.change_logs // Garante que tem algum log
        }
      }
    });

    const feedbackList: any[] = [];

    patients.forEach(p => {
      if (p.change_logs && Array.isArray(p.change_logs)) {
        const logs = p.change_logs as any[];
        
        logs.forEach(log => {
          if (log.type === "REENGAGEMENT_FEEDBACK") {
            feedbackList.push({
              patientId: p.id,
              patientName: p.name,
              phone: p.phone,
              date: log.date,
              reason: log.reason,
              comment: log.comment,
              reviewed: log.reviewed || false
            });
          }
        });
      }
    });

    // Ordenar do mais recente para o mais antigo
    return feedbackList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

export const WhatsappService = {
  /**
   * Envia uma mensagem de texto simples usando a API de WhatsApp configurada.
   * @param to Número de telefone do destinatário (com ou sem formatação)
   * @param text Conteúdo da mensagem de texto
   */
  async sendTextMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiType = process.env.WHATSAPP_API_TYPE || "SIMULATED";
    const apiUrl = process.env.WHATSAPP_API_URL || "";
    const apiKey = process.env.WHATSAPP_API_KEY || "";
    const instanceName = process.env.WHATSAPP_INSTANCE_NAME || "";

    // 1. Limpar e normalizar o número do destinatário
    let cleanedPhone = to.replace(/[^\d]/g, "");
    
    // Garantir o código de país (55 para Brasil)
    if (cleanedPhone.length === 11) {
      cleanedPhone = "55" + cleanedPhone;
    } else if (cleanedPhone.length === 10) {
      // Adicionar o dígito 9 e o DDI 55
      cleanedPhone = "55" + cleanedPhone.slice(0, 2) + "9" + cleanedPhone.slice(2);
    }

    if (apiType === "SIMULATED") {
      console.log(`[WHATSAPP SIMULATED] Enviando para ${cleanedPhone}: "${text}"`);
      return { success: true, messageId: "simulated-" + Date.now() };
    }

    if (!apiUrl || !apiKey || !instanceName) {
      console.warn("[WHATSAPP WARNING] API do WhatsApp configurada para envio real, mas faltam credenciais no .env. Executando simulação.");
      console.log(`[WHATSAPP SIMULATED FALLBACK] Enviando para ${cleanedPhone}: "${text}"`);
      return { success: true, messageId: "simulated-fallback-" + Date.now() };
    }

    try {
      if (apiType === "EVOLUTION") {
        // Evolution API: POST /message/sendText/{instance}
        const endpoint = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`;
        const payload = {
          number: cleanedPhone,
          options: {
            delay: 1200, // Simular delay de digitação por 1.2 segundos para reduzir risco de ban
            presence: "composing" // Exibe "digitando..." na tela do destinatário
          },
          text: text
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          return { success: false, error: `Evolution API HTTP ${response.status}: ${errText}` };
        }

        const data = await response.json();
        const messageId = data?.key?.id || data?.messageId || "ev-" + Date.now();
        return { success: true, messageId };
      } 
      
      if (apiType === "Z-API") {
        // Z-API: POST /instances/{instance}/token/{token}/send-text
        const endpoint = `${apiUrl.replace(/\/$/, "")}/instances/${instanceName}/token/${apiKey}/send-text`;
        const payload = {
          phone: cleanedPhone,
          message: text
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          return { success: false, error: `Z-API HTTP ${response.status}: ${errText}` };
        }

        const data = await response.json();
        const messageId = data?.messageId || "zapi-" + Date.now();
        return { success: true, messageId };
      }

      return { success: false, error: `Tipo de API desconhecido: ${apiType}` };
    } catch (err: any) {
      console.error("[WHATSAPP EXCEPTION] Erro ao enviar mensagem:", err);
      return { success: false, error: err?.message || "Erro desconhecido de rede" };
    }
  }
};
