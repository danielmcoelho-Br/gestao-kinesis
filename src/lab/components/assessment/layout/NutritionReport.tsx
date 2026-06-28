"use client";

import { memo } from "react";
import { ArrowUp, ArrowDown, Scale, TrendingUp, User, ShieldAlert, Award, Zap, Calendar } from "lucide-react";

interface NutritionReportProps {
    answers: Record<string, any>;
    patientGender: string;
    patientAge: number;
    patientName: string;
    assessmentDate: string;
    patientAssessments: any[];
    assessmentId: string | null;
    isPrint?: boolean;
}

// Omron Body Fat Reference Ranges stratified by gender and age
const getOmronGorduraRange = (gender: string, age: number) => {
    const g = gender?.toLowerCase() || "";
    const isFemale = g.startsWith("f") || g.includes("mulher") || g.includes("fem");
    
    if (isFemale) {
        if (age <= 39) return { min: 21.0, max: 32.9, label: "Ideal (18-39 anos): 21.0% - 32.9%" };
        if (age <= 59) return { min: 23.0, max: 33.9, label: "Ideal (40-59 anos): 23.0% - 33.9%" };
        return { min: 24.0, max: 35.9, label: "Ideal (60-79 anos): 24.0% - 35.9%" };
    } else {
        if (age <= 39) return { min: 8.0, max: 19.9, label: "Ideal (18-39 anos): 8.0% - 19.9%" };
        if (age <= 59) return { min: 11.0, max: 21.9, label: "Ideal (40-59 anos): 11.0% - 21.9%" };
        return { min: 13.0, max: 24.9, label: "Ideal (60-79 anos): 13.0% - 24.9%" };
    }
};

// Omron Skeletal Muscle / Lean Mass % Reference Ranges stratified by gender and age
const getOmronMuscleRange = (gender: string, age: number) => {
    const g = gender?.toLowerCase() || "";
    const isFemale = g.startsWith("f") || g.includes("mulher") || g.includes("fem");
    
    if (isFemale) {
        if (age <= 39) return { min: 24.3, max: 30.3, label: "Ideal (18-39 anos): 24.3% - 30.3%" };
        if (age <= 59) return { min: 24.1, max: 30.1, label: "Ideal (40-59 anos): 24.1% - 30.1%" };
        return { min: 23.9, max: 29.9, label: "Ideal (60-80 anos): 23.9% - 29.9%" };
    } else {
        if (age <= 39) return { min: 33.3, max: 39.3, label: "Ideal (18-39 anos): 33.3% - 39.3%" };
        if (age <= 59) return { min: 33.1, max: 39.1, label: "Ideal (40-59 anos): 33.1% - 39.1%" };
        return { min: 32.9, max: 38.9, label: "Ideal (60-80 anos): 32.9% - 38.9%" };
    }
};

const NutritionReport = memo(({
    answers,
    patientGender,
    patientAge,
    patientName,
    assessmentDate,
    patientAssessments = [],
    assessmentId,
    isPrint = false
}: NutritionReportProps) => {

    const parseVal = (v: any): number => {
        if (v === undefined || v === null || v === "") return 0;
        const clean = String(v).replace("%", "").replace(",", ".").trim();
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    // Current Values
    const peso = parseVal(answers.peso);
    const altura = parseVal(answers.altura);
    const imc = parseVal(answers.imc);
    
    const massaMagraPct = parseVal(answers.massa_magra_pct);
    const gorduraPct = parseVal(answers.gordura_pct);
    const idadeMetabolica = parseVal(answers.idade_metabolica);
    const gorduraVisceral = parseVal(answers.gordura_visceral);
    const taxaMetabolicaBasal = parseVal(answers.taxa_metabolica_basal);
    
    const massaMagraKg = parseVal(answers.massa_magra_kg);
    const gorduraKg = parseVal(answers.gordura_kg);

    // Get Normal Ranges
    const fatRange = getOmronGorduraRange(patientGender, patientAge);
    const muscleRange = getOmronMuscleRange(patientGender, patientAge);
    const imcRange = { min: 18.5, max: 24.9, label: "Ideal (OMS): 18.5 - 24.9" };
    
    const getBmrRange = (gender: string) => {
        const g = gender?.toLowerCase() || "";
        const isFemale = g.startsWith("f") || g.includes("mulher") || g.includes("fem");
        return isFemale ? { label: "1100 - 1400 Kcal" } : { label: "1500 - 1800 Kcal" };
    };
    const bmrRange = getBmrRange(patientGender);

    // Get Historical nutrition assessments
    const nutritionHistory = (patientAssessments || [])
        .filter(a => a.assessment_type === "nutricao" && a.id !== assessmentId)
        .map(a => {
            const d = a.created_at ? new Date(a.created_at) : null;
            return {
                id: a.id,
                date: d ? d.toLocaleDateString("pt-BR") : "",
                timestamp: d ? d.getTime() : 0,
                answers: a.answers || {}
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    const currentPoint = {
        id: assessmentId || "current",
        date: assessmentDate || new Date().toLocaleDateString("pt-BR"),
        timestamp: Date.now(),
        answers: answers
    };

    const allHistory = [...nutritionHistory, currentPoint].filter(h => parseVal(h.answers.peso) > 0);
    const hasPrevious = nutritionHistory.length > 0;
    const previousAssessment = hasPrevious ? nutritionHistory[nutritionHistory.length - 1] : null;

    // Classification helpers
    const getFatClassification = (val: number) => {
        if (val === 0) return { label: "---", color: "#64748b" };
        if (val < fatRange.min) return { label: "Baixo", color: "#3b82f6" };
        if (val <= fatRange.max) return { label: "Normal", color: "#10b981" };
        return { label: "Alto", color: "#ef4444" };
    };

    const getMuscleClassification = (val: number) => {
        if (val === 0) return { label: "---", color: "#64748b" };
        if (val < muscleRange.min) return { label: "Baixo", color: "#ef4444" };
        if (val <= muscleRange.max) return { label: "Normal", color: "#10b981" };
        return { label: "Alto", color: "#15803d" };
    };

    const getImcClassification = (val: number) => {
        if (val === 0) return { label: "---", color: "#64748b" };
        if (val < 18.5) return { label: "Abaixo do peso", color: "#3b82f6" };
        if (val < 25.0) return { label: "Peso normal", color: "#10b981" };
        if (val < 30.0) return { label: "Sobrepeso", color: "#f59e0b" };
        return { label: "Obesidade", color: "#ef4444" };
    };

    const getVisceralClassification = (val: number) => {
        if (val === 0) return { label: "---", color: "#64748b" };
        if (val <= 9) return { label: "Normal", color: "#10b981" };
        if (val <= 14) return { label: "Alto", color: "#f59e0b" };
        return { label: "Muito Alto", color: "#ef4444" };
    };

    const fatClass = getFatClassification(gorduraPct);
    const muscleClass = getMuscleClassification(massaMagraPct);
    const imcClass = getImcClassification(imc);
    const visceralClass = getVisceralClassification(gorduraVisceral);

    // Dynamic variation percent helper
    const getVariation = (currentKey: string, previousAnswers: Record<string, any> | null) => {
        if (!previousAnswers) return null;
        const curVal = parseVal(answers[currentKey]);
        const prevVal = parseVal(previousAnswers[currentKey]);
        if (prevVal === 0) return null;

        const diff = curVal - prevVal;
        const percent = (diff / prevVal) * 100;
        return {
            diff: Math.round(diff * 100) / 100,
            percent: Math.round(percent * 100) / 100
        };
    };

    // Render historical column chart component
    const renderMiniHistoryChart = (title: string, dataKey: string, unit: string, refMin?: number, refMax?: number) => {
        if (allHistory.length < 2 && !refMin) return null;

        const values = allHistory.map(h => parseVal(h.answers[dataKey]));
        const maxValue = Math.max(...values, refMax || 0, 1) * 1.25;

        return (
            <div style={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "1rem",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                flex: 1,
                minWidth: "220px",
                position: "relative",
                pageBreakInside: "avoid"
            }}>
                <h5 style={{ margin: 0, fontSize: "0.85rem", color: "#1e293b", fontWeight: "800", textTransform: "uppercase", borderLeft: "3px solid #8b0000", paddingLeft: "0.5rem" }}>
                    {title}
                </h5>
                <div style={{ position: "relative", display: "flex", height: "110px", alignItems: "flex-end", gap: "0.75rem", padding: "10px 5px", marginTop: "1rem" }}>
                    
                    {/* Normal range shaded band */}
                    {refMin && refMax && (
                        <div style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: `${(refMin / maxValue) * 100}%`,
                            height: `${((refMax - refMin) / maxValue) * 100}%`,
                            backgroundColor: "rgba(16, 185, 129, 0.05)",
                            borderTop: "2px dashed rgba(16, 185, 129, 0.6)",
                            borderBottom: "2px dashed rgba(16, 185, 129, 0.6)",
                            zIndex: 1,
                            pointerEvents: "none"
                        }} />
                    )}

                    {/* Left Reference Bar (Grey) */}
                    {refMax && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", zIndex: 2 }}>
                            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                                <div style={{
                                    height: `${(refMax / maxValue) * 100}%`,
                                    width: "100%",
                                    backgroundColor: "#cbd5e1",
                                    borderRadius: "4px 4px 0 0",
                                    position: "relative",
                                    display: "flex",
                                    justifyContent: "center"
                                }}>
                                    <span style={{
                                        position: "absolute",
                                        top: "-18px",
                                        fontSize: "0.75rem",
                                        fontWeight: "800",
                                        color: "#64748b"
                                    }}>
                                        {refMax}{unit}
                                    </span>
                                </div>
                            </div>
                            <span style={{ fontSize: "0.65rem", marginTop: "6px", fontWeight: "800", color: "#64748b", whiteSpace: "nowrap" }}>
                                Normal
                            </span>
                        </div>
                    )}

                    {/* Bars */}
                    {allHistory.map((h, idx) => {
                        const val = parseVal(h.answers[dataKey]);
                        const barHeight = (val / maxValue) * 100;
                        const isCurrent = h.id === (assessmentId || "current");
                        
                        return (
                            <div key={h.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", zIndex: 2 }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                                    <div style={{
                                        height: `${barHeight}%`,
                                        width: "100%",
                                        backgroundColor: isCurrent ? "#8B0000" : "#b91c1c",
                                        borderRadius: "4px 4px 0 0",
                                        position: "relative",
                                        display: "flex",
                                        justifyContent: "center",
                                        transition: "height 0.5s ease"
                                    }}>
                                        <span style={{
                                            position: "absolute",
                                            top: "-18px",
                                            fontSize: "0.75rem",
                                            fontWeight: "800",
                                            color: isCurrent ? "#8b0000" : "#b91c1c"
                                        }}>
                                            {val}{unit}
                                        </span>
                                    </div>
                                </div>
                                <span style={{ fontSize: "0.65rem", marginTop: "6px", fontWeight: "800", color: "#64748b", whiteSpace: "nowrap" }}>
                                    {h.date.substring(0, 5)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", fontFamily: "inherit" }}>
            
            {/* ROW 1: Peso, IMC, Idade Metabólica (3 columns) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                width: "100%"
            }}>
                {/* Weight Card */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#8b0000" }}>
                        <Scale size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Peso</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{peso > 0 ? `${peso} Kg` : "---"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Altura: {altura > 0 ? `${altura} m` : "---"}</span>
                    </div>
                </div>

                {/* IMC Card */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: imcClass.color + "15", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: imcClass.color }}>
                        <User size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>IMC</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{imc > 0 ? `${imc}` : "---"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                color: imcClass.color,
                                backgroundColor: imcClass.color + "12",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                display: "inline-block",
                                width: "fit-content"
                            }}>
                                {imcClass.label}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{imcRange.label}</span>
                        </div>
                    </div>
                </div>

                {/* Idade Metabólica Card */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#475569" }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Idade Metabólica</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{idadeMetabolica > 0 ? `${idadeMetabolica} anos` : "---"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Idade Real: {patientAge} anos</span>
                    </div>
                </div>
            </div>

            {/* ROW 2: Gordura Corporal (%) e Gordura Corporal (Kg) (2 columns) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                width: "100%"
            }}>
                {/* Gordura Corporal (%) */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: fatClass.color + "15", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: fatClass.color }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Gordura Corporal (%)</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{gorduraPct > 0 ? `${gorduraPct}%` : "---"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                color: fatClass.color,
                                backgroundColor: fatClass.color + "12",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                display: "inline-block",
                                width: "fit-content"
                            }}>
                                {fatClass.label}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{fatRange.label}</span>
                        </div>
                    </div>
                </div>

                {/* Gordura Corporal (Kg) */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: fatClass.color + "10", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: fatClass.color }}>
                        <Scale size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Gordura Corporal (Kg)</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: fatClass.color }}>{gorduraKg > 0 ? `${gorduraKg} Kg` : "---"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Peso absoluto de gordura corporal</span>
                    </div>
                </div>
            </div>

            {/* ROW 3: Massa Muscular (%) e Massa Muscular (Kg) (2 columns) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                width: "100%"
            }}>
                {/* Massa Muscular (%) */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: muscleClass.color + "15", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: muscleClass.color }}>
                        <Award size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Massa Muscular (%)</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{massaMagraPct > 0 ? `${massaMagraPct}%` : "---"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                color: muscleClass.color,
                                backgroundColor: muscleClass.color + "12",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                display: "inline-block",
                                width: "fit-content"
                            }}>
                                {muscleClass.label}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{muscleRange.label}</span>
                        </div>
                    </div>
                </div>

                {/* Massa Muscular (Kg) */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: muscleClass.color + "10", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: muscleClass.color }}>
                        <Scale size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Massa Muscular (Kg)</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: muscleClass.color }}>{massaMagraKg > 0 ? `${massaMagraKg} Kg` : "---"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Peso absoluto de massa muscular</span>
                    </div>
                </div>
            </div>

            {/* ROW 4: Gordura Visceral e Metabolismo Basal (2 columns) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
                width: "100%"
            }}>
                {/* Gordura Visceral */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: visceralClass.color + "15", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: visceralClass.color }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Gordura Visceral</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{gorduraVisceral > 0 ? `${gorduraVisceral}` : "---"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                color: visceralClass.color,
                                backgroundColor: visceralClass.color + "12",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                display: "inline-block",
                                width: "fit-content"
                            }}>
                                {visceralClass.label}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Faixa Ideal (Omron): 1 - 9</span>
                        </div>
                    </div>
                </div>

                {/* Metabolismo Basal */}
                <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#fcf6f6", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#8b0000" }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Metabolismo Basal</span>
                        <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b" }}>{taxaMetabolicaBasal > 0 ? `${taxaMetabolicaBasal} Kcal` : "---"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Referência Média: {bmrRange.label}</span>
                    </div>
                </div>
            </div>

            {/* 3. COLUMNS CHART FOR HISTORICAL DATA */}
            {(allHistory.length >= 2 || (imc > 0 && imcRange) || (gorduraPct > 0 && fatRange)) && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.25rem",
                    width: "100%",
                    marginTop: "0.5rem"
                }}>
                    {renderMiniHistoryChart("Evolução: Peso", "peso", "kg")}
                    {renderMiniHistoryChart("Evolução: IMC", "imc", "", imcRange.min, imcRange.max)}
                    {renderMiniHistoryChart("Evolução: Gordura (%)", "gordura_pct", "%", fatRange.min, fatRange.max)}
                    {renderMiniHistoryChart("Evolução: Massa Muscular (%)", "massa_magra_pct", "%")}
                </div>
            )}

            {/* 4. EVOLUTION TABLE FOR METRICS (GAIN / LOSS) */}
            {hasPrevious && previousAssessment && (
                <div style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderRadius: "1rem",
                    border: "1px solid #e2e8f0",
                    padding: "1.25rem",
                    boxShadow: isPrint ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05)",
                    pageBreakInside: "avoid"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                        <TrendingUp size={18} style={{ color: "#8b0000" }} />
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "900", color: "#1e293b", textTransform: "uppercase" }}>
                            Comparativo com a Avaliação Anterior ({previousAssessment.date})
                        </h4>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: "800" }}>
                                    <th style={{ padding: "0.75rem 0.5rem" }}>Indicador</th>
                                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Anterior ({previousAssessment.date})</th>
                                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Atual ({currentPoint.date})</th>
                                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Diferença Absoluta</th>
                                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Variação (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: "Peso Corporal (Kg)", key: "peso", positiveIsGood: false },
                                    { label: "IMC", key: "imc", positiveIsGood: false },
                                    { label: "Massa Muscular (%)", key: "massa_magra_pct", positiveIsGood: true },
                                    { label: "Massa Muscular (Kg)", key: "massa_magra_kg", positiveIsGood: true },
                                    { label: "Gordura Corporal (%)", key: "gordura_pct", positiveIsGood: false },
                                    { label: "Gordura Corporal (Kg)", key: "gordura_kg", positiveIsGood: false },
                                    { label: "Idade Metabólica (anos)", key: "idade_metabolica", positiveIsGood: false },
                                    { label: "Índice de Gordura Visceral", key: "gordura_visceral", positiveIsGood: false },
                                    { label: "Taxa Metabólica Basal (Kcal)", key: "taxa_metabolica_basal", positiveIsGood: true }
                                ].map((row, idx) => {
                                    const varData = getVariation(row.key, previousAssessment.answers);
                                    if (!varData) return null;

                                    const isPositive = varData.diff > 0;
                                    const isZero = varData.diff === 0;
                                    
                                    // Custom color logic based on health goals
                                    let badgeColor = "#475569";
                                    let badgeBg = "#f1f5f9";
                                    
                                    if (!isZero) {
                                        if (row.positiveIsGood) {
                                            badgeColor = isPositive ? "#166534" : "#991b1b";
                                            badgeBg = isPositive ? "#f0fdf4" : "#fff5f5";
                                        } else {
                                            // Loss of fat/weight is good (green), gain is red
                                            badgeColor = isPositive ? "#991b1b" : "#166534";
                                            badgeBg = isPositive ? "#fff5f5" : "#f0fdf4";
                                        }
                                    }

                                    return (
                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                                            <td style={{ padding: "0.75rem 0.5rem", fontWeight: "700" }}>{row.label}</td>
                                            <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{parseVal(previousAssessment.answers[row.key])}</td>
                                            <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: "800" }}>{parseVal(answers[row.key])}</td>
                                            <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: "700" }}>
                                                {isZero ? "---" : `${isPositive ? "+" : ""}${varData.diff}`}
                                            </td>
                                            <td style={{ padding: "0.5rem", textAlign: "center" }}>
                                                {isZero ? (
                                                    <span style={{ padding: "4px 8px", borderRadius: "6px", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: "800", fontSize: "0.75rem" }}>
                                                        Sem alteração
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        backgroundColor: badgeBg,
                                                        color: badgeColor,
                                                        fontWeight: "800",
                                                        fontSize: "0.75rem",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "3px"
                                                    }}>
                                                        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        {Math.abs(varData.percent)}%
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
        </div>
    );
});

NutritionReport.displayName = "NutritionReport";
export default NutritionReport;
