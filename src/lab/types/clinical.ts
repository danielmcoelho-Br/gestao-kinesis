export type Option = {
    value: number;
    label: string;
};
  
export type Question = {
    id?: string;
    text: string;
    isInstruction?: boolean;
    options?: Option[];
};
  
export type ClinicalFlag = {
    id: string;
    label: string;
    level: 'red' | 'yellow';
    message: string;
    criteria: (answers: Record<string, any>) => boolean;
};
  
export type SectionField = {
    id: string;
    label: string;
    type: 'textarea' | 'range' | 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'table' | 'bodyschema' | 'image-upload' | 'button' | 'paintmap' | 'angle_measurement' | 'freecanvas' | 'static' | 'info';
    min?: number;
    max?: number;
    step?: number;
    image?: string;
    options?: string[] | { id: string, value: string }[]; 
    colors?: { hex: string, label: string }[]; 
    rows?: number; 
    isCalculated?: boolean;
};
  
export type TableRowField = string | { 
    id: string; 
    type?: 'checkbox' | 'text' | 'number' | 'select' | 'image-upload' | 'static'; 
    options?: string[]; 
    min?: number; 
    max?: number;
    isCalculated?: boolean;
};

export type TableRow = {
    id: string;
    label: string;
    fields: TableRowField[];
};
  
export type SectionColumn = string | { 
    label: string; 
    action?: { type: 'fill', value: any }; 
    type?: 'checkbox' | 'text' | 'number' | 'select' | 'image-upload' | 'textarea' | 'static'; 
};

export type Section = {
    id: string;
    title: string;
    type?: 'default' | 'table' | 'multi-table';
    fields?: SectionField[];
    columns?: SectionColumn[];
    rows?: TableRow[];
    subsections?: Section[];
    chart?: string;
    footer?: string;
    description?: string;
};
  
export type DiagnosisRule = {
    id: string;
    label?: string;
    criteria: (answers: Record<string, any>) => boolean;
    message: string;
};

export type Questionnaire = {
    id: string;
    segment: string;
    title: string;
    description: string;
    icon?: string;
    type?: 'clinical' | 'questionnaire';
    questions?: Question[];
    sections?: Section[];
    structure?: any; 
    flags?: ClinicalFlag[];
    clinicalFlags?: ClinicalFlag[];
    diagnosisRules?: DiagnosisRule[];
    calculateScore?: (answers: Record<string, any>) => AssessmentResult;
};

export type AssessmentResult = {
    score?: number | string;
    percentage?: number;
    interpretation: string;
    unit?: string;
    details?: Record<string, any>;
};
