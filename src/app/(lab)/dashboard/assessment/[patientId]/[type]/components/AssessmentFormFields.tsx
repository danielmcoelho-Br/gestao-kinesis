"use client";

import { memo } from "react";
import { Info, Calculator } from "lucide-react";
import { getNormalityValue } from "./utils";
import { AssessmentComparisonChart, AssessmentHistoryChart } from "./AssessmentCharts";
import { DataTable } from "./AssessmentDataTable";
import { FunctionalQuestionnaireBlock } from "./FunctionalBlocks";

export const FormField = memo(function FormField({ 
    field, value, isEditing, handleInputChange, onImageClick, patientGender, patientAge, patientAssessments, patientId, type, assessmentId, router, isPrint, answers, assessmentDate, onAnalyzeImage, onOpenDynamo, hideChart = false
}: { 
    field: any, value: any, isEditing: boolean, handleInputChange: (fieldId: string, value: any) => void, onImageClick: (img: string) => void, onAnalyzeImage?: (img: string, fieldId: string, index: number) => void, onOpenDynamo?: (fieldId: string, label: string) => void, patientGender: string, patientAge: number, patientAssessments: any[], patientId: string, type: string, assessmentId: string | null, router: any, isPrint: boolean, answers: any, assessmentDate: string, hideChart?: boolean
}) {
    // Ported logic from FormField in page.tsx
    if (field.type === 'functional-block') {
        return (
            <FunctionalQuestionnaireBlock 
                questType={field.id}
                title={field.label}
                history={patientAssessments}
                answers={answers}
                isEditing={isEditing}
                patientId={patientId}
                type={type}
                router={router}
                assessmentId={assessmentId}
                assessmentDate={assessmentDate}
            />
        );
    }

    if (field.type === 'table') {
        return (
            <DataTable 
                section={field}
                answers={answers}
                isEditing={isEditing}
                handleInputChange={handleInputChange}
                onImageClick={onImageClick}
                onOpenDynamo={onOpenDynamo}
                onAnalyzeImage={onAnalyzeImage}
                isPrint={isPrint}
            />
        );
    }

    // Standard field rendering logic...
    // (Simplified for brevity in this step, but should match original)
    return (
        <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: 'var(--secondary)' }}>
                {field.label}
            </label>
            {field.type === 'textarea' ? (
                <textarea 
                    value={value || ""} 
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    disabled={!isEditing}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', minHeight: '100px' }}
                />
            ) : (
                <input 
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={value || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    disabled={!isEditing}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                />
            )}
        </div>
    );
});
