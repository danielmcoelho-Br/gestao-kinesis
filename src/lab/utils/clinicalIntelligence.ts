import { Questionnaire, questionnairesData } from "@/lab/data/questionnaires";

export interface ActiveClinicalFlag {
  id: string;
  label: string;
  level: 'red' | 'yellow';
  message: string;
}

/**
 * Avalia as flags clínicas de um questionário baseado nas respostas fornecidas.
 */
export function evaluateClinicalFlags(
  questionnaireId: string,
  answers: Record<string, any>
): ActiveClinicalFlag[] {
  const questionnaire = (questionnairesData as any)[questionnaireId] as Questionnaire;
  if (!questionnaire || !questionnaire.clinicalFlags) return [];

  return questionnaire.clinicalFlags
    .filter(flag => {
      try {
        return flag.criteria(answers);
      } catch (err) {
        console.error(`Erro ao avaliar flag ${flag.id} para ${questionnaireId}:`, err);
        return false;
      }
    })
    .map(flag => ({
      id: flag.id,
      label: flag.label,
      level: flag.level,
      message: flag.message
    }));
}

/**
 * Retorna as flags de maior gravidade (Red > Yellow).
 */
export function getHighestSeverityFlags(flags: ActiveClinicalFlag[]): ActiveClinicalFlag[] {
  if (flags.some(f => f.level === 'red')) {
    return flags.filter(f => f.level === 'red');
  }
  return flags;
}
