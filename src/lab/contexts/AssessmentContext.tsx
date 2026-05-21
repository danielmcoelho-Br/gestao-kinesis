"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAssessmentState } from '@/lab/hooks/useAssessmentState';

type AssessmentState = ReturnType<typeof useAssessmentState>;

const AssessmentContext = createContext<AssessmentState | undefined>(undefined);

interface AssessmentProviderProps {
    children: ReactNode;
    state: AssessmentState;
}

export function AssessmentProvider({ children, state }: AssessmentProviderProps) {
    return (
        <AssessmentContext.Provider value={state}>
            {children}
        </AssessmentContext.Provider>
    );
}

export function useAssessmentContext() {
    const context = useContext(AssessmentContext);
    if (context === undefined) {
        throw new Error('useAssessmentContext must be used within an AssessmentProvider');
    }
    return context;
}
