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

export const ReengagementService = {
  /**
   * Identifica todos os pacientes inativos (última consulta há mais de X dias e sem consultas futuras agendadas).
   * @param daysThreshold Número de dias de inatividade (padrão: 14 dias)
   */
  async getInactivePatients(daysThreshold = 14): Promise<InactivePatientInfo[]> {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - daysThreshold);

    // Buscar todos os pacientes
    const patients = await prisma.patient.findMany({
      orderBy: { name: "asc" }
    });

    const inactiveList: InactivePatientInfo[] = [];

    for (const patient of patients) {
      // Buscar a última sessão (qualquer status)
      const lastSession = await prisma.session.findFirst({
        where: {
          patientName: {
            equals: patient.name,
            mode: 'insensitive'
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      if (lastSession) {
        // Verificar se a última consulta foi antes do limite (inativa)
        const isInactive = lastSession.date < thresholdDate;

        if (isInactive) {
          // Verificar se NÃO possui nenhuma sessão futura agendada a partir de agora
          const upcomingSession = await prisma.session.findFirst({
            where: {
              patientName: {
                equals: patient.name,
                mode: 'insensitive'
              },
              date: {
                gte: now
              }
            }
          });

          // Se não tem sessões futuras, está inativo!
          if (!upcomingSession) {
            // Verificar a data do último contato de reengajamento nos logs
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
              lastSessionDate: lastSession.date,
              daysInactive: Math.floor((now.getTime() - lastSession.date.getTime()) / (1000 * 60 * 60 * 24)),
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

    // Disparar envio (Simulado / Integração externa de WhatsApp)
    console.log(`[DISPARO WHATSAPP] Enviando para ${phone}: "${message}"`);

    // Registrar o contato nos logs do paciente
    const logs = Array.isArray(patient.change_logs) ? (patient.change_logs as any[]) : [];
    
    logs.push({
      type: "REENGAGEMENT_CONTACT",
      date: new Date().toISOString(),
      status: "SENT",
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
