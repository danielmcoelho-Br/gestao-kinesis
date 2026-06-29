import { 
    saveAssessment, 
    getAssessment, 
    updateAssessment 
} from "@/app/(lab)/dashboard/assessment/actions";
import { getPatient, getPatientAssessments } from "@/app/(lab)/dashboard/actions";
import { Questionnaire, AssessmentResult } from "@/lab/types/clinical";
import { calculateAssessmentScore, CalculationType } from "@/lab/lib/calculations";

export const assessmentService = {
    /**
     * Fetches a clinical assessment by ID or returns the base data for a new one.
     */
    async fetchAssessment(assessmentId: string | null, patientId: string, type: string) {
        if (assessmentId) {
            return await getAssessment(assessmentId);
        }
        return null;
    },

    /**
     * Fetches patient basic info.
     */
    async fetchPatient(patientId: string) {
        return await getPatient(patientId);
    },

    /**
     * Fetches all assessments for a patient (useful for history charts).
     */
    async fetchPatientHistory(patientId: string) {
        return await getPatientAssessments(patientId);
    },

    /**
     * Saves or updates an assessment.
     */
    async saveOrUpdate(data: {
        id: string | null;
        patientId: string;
        type: string;
        segment?: string;
        answers: Record<string, any>;
        isFinished: boolean;
        result?: AssessmentResult;
        userId?: string;
        logEntries?: string[];
        date?: string;
    }) {
        if (data.id) {
            return await updateAssessment(data.id, {
                answers: data.answers,
                scoreData: data.result,
                logEntries: data.logEntries || [],
                date: data.date
            });
        } else {
            return await saveAssessment({
                patientId: data.patientId,
                type: data.type,
                segment: data.segment || '',
                answers: data.answers,
                scoreData: data.result,
                userId: data.userId,
                date: data.date
            });
        }
    },

    /**
     * Calculates the score based on the questionnaire type.
     */
    calculateResult(type: string, answers: Record<string, any>, questionnaire: Questionnaire, profile?: any): AssessmentResult {
        const calcType = (questionnaire.structure?.calculationType || type) as CalculationType;
        return calculateAssessmentScore(calcType, answers, profile);
    }
};
