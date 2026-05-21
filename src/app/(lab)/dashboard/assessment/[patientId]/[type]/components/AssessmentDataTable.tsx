"use client";

import { memo, useState } from "react";
import { X, Upload, Maximize2, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { calculateDeficit } from "./utils";
import { compressImage } from "@/lab/lib/image-compressor";

export const ImageUpload = memo(({ 
    value, 
    isEditing, 
    onChange, 
    onImageClick,
    onAnalyzeImage,
    isTable = false 
}: { 
    value: any, 
    isEditing: boolean, 
    onChange: (val: any) => void,
    onImageClick: (img: string) => void,
    onAnalyzeImage?: (img: string, index: number) => void,
    isTable?: boolean 
}) => {
    const images: string[] = Array.isArray(value) ? value : (value ? [value] : []);
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: isTable ? 'center' : 'flex-start' }}>
            {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: isTable ? 'center' : 'flex-start' }}>
                    {images.map((img, idx) => (
                        <div 
                            key={idx}
                            style={{ position: 'relative', width: isTable ? '60px' : '360px', height: isTable ? '60px' : '270px', cursor: 'zoom-in' }}
                            onClick={() => onImageClick(img)}
                        >
                            <img 
                                src={img} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} 
                                alt="Upload" 
                            />
                            {isEditing && (
                                <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                                    {onAnalyzeImage && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAnalyzeImage(img, idx);
                                            }}
                                            style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                                        >
                                            <Maximize2 size={12} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = [...images];
                                            newImages.splice(idx, 1);
                                            onChange(newImages);
                                        }}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {isEditing && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                try {
                                    const compressed = await compressImage(file);
                                    onChange([...images, compressed]);
                                } catch (err) {
                                    console.error("Compression error:", err);
                                    // Fallback
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        onChange([...images, reader.result as string]);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                        />
                        <button type="button" className="btn-action-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Upload size={14} /> Upload
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export const DataTableCell = memo(({ 
    fieldId, 
    fieldType, 
    fieldOptions,
    value, 
    isEditing, 
    handleInputChange, 
    onImageClick,
    isPrint,
    reflexOptions,
    onOpenDynamo,
    onAnalyzeImage,
    rowLabel,
    isCalculated = false
}: { 
    fieldId: string, 
    fieldType: string, 
    fieldOptions: any[],
    value: any, 
    isEditing: boolean, 
    handleInputChange: (id: string, val: any) => void,
    onImageClick: (img: string) => void,
    onAnalyzeImage?: (img: string, fieldId: string, index: number) => void,
    isPrint: boolean,
    reflexOptions: string[],
    onOpenDynamo?: (fieldId: string, label: string) => void,
    rowLabel?: string,
    isCalculated?: boolean
}) => {
    if (isCalculated) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '0.4rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '0.4rem',
                border: '1px solid var(--border)',
                fontWeight: '700',
                color: 'var(--primary)',
                fontSize: '0.85rem'
            }}>
                {value || "0%"}
            </div>
        );
    }

    if (fieldType === 'checkbox') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isPrint ? (
                    value ? <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem' }}>✓</span> : "-"
                ) : (
                    <input 
                        type="checkbox" 
                        checked={!!value}
                        onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                        disabled={!isEditing}
                        style={{ width: '20px', height: '20px', cursor: isEditing ? 'pointer' : 'not-allowed', accentColor: '#8B0000' }}
                    />
                )}
            </div>
        );
    }

    if (fieldType === 'select') {
        return isPrint ? (
            <div style={{ textAlign: 'center' }}><span style={{ fontWeight: '600' }}>{value || "-"}</span></div>
        ) : (
            <select
                value={value || ""}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                disabled={!isEditing}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid var(--border)', backgroundColor: isEditing ? 'white' : 'transparent', fontSize: '0.85rem', textAlign: 'center' }}
            >
                <option value="">-</option>
                {(fieldOptions.length > 0 ? fieldOptions : reflexOptions).map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    if (fieldType === 'image-upload') {
        return (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <ImageUpload 
                    value={value}
                    isEditing={isEditing}
                    onChange={(val: any) => handleInputChange(fieldId, val)}
                    onImageClick={onImageClick}
                    onAnalyzeImage={onAnalyzeImage ? (img, idx) => onAnalyzeImage(img, fieldId, idx) : undefined}
                    isTable={true}
                />
            </div>
        );
    }

    return isPrint ? (
        <div style={{ textAlign: 'center' }}><span style={{ fontWeight: '600' }}>{value || "-"}</span></div>
    ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
            <input 
                type={fieldType === 'number' ? 'number' : 'text'}
                value={value || ""}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                disabled={!isEditing}
                placeholder="-"
                style={{ flex: 1, padding: '0.4rem', borderRadius: '0.4rem', border: isEditing ? '1px solid var(--border)' : '1px solid transparent', backgroundColor: isEditing ? 'white' : 'transparent', fontSize: '0.85rem', textAlign: 'center' }}
            />
            {isEditing && fieldType === 'number' && (fieldId.includes('forca') || fieldId.startsWith('f_') || fieldId.includes('preensao') || fieldId.includes('polpa') || fieldId.includes('lateral') || fieldId.includes('tripode') || fieldId.includes('resist')) && onOpenDynamo && (
                <button
                    type="button"
                    onClick={() => onOpenDynamo(fieldId, rowLabel || "")}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--primary)', cursor: 'pointer' }}
                >
                    <Calculator size={14} />
                </button>
            )}
        </div>
    );
});

export const DataTable = memo(({ 
    section, 
    answers, 
    isEditing, 
    handleInputChange, 
    onImageClick,
    onOpenDynamo,
    onAnalyzeImage,
    isPrint
}: { 
    section: any, 
    answers: Record<string, any>, 
    isEditing: boolean, 
    handleInputChange: (id: string, val: any) => void,
    onImageClick: (img: string) => void,
    onOpenDynamo?: (fieldId: string, label: string) => void,
    onAnalyzeImage?: (img: string, fieldId: string, index: number) => void,
    isPrint: boolean
}) => {
    const reflexOptions = ['Normal', 'Aumentado', 'Diminuído', 'Abolido'];
    
    return (
        <div className="table-wrapper print-avoid-break" style={{ overflowX: 'auto', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                        {section.columns?.map((col: any, idx: number) => (
                            <th key={idx} style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                <span>{typeof col === 'string' ? col : col.label}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {section.rows?.map((row: any, rIdx: number) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: rIdx % 2 === 0 ? 'white' : 'var(--bg-secondary)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--secondary)', width: '35%' }}>{row.label}</td>
                            {row.fields.map((field: any, fIdx: number) => {
                                const fieldId = typeof field === 'string' ? field : field.id;
                                let fieldType = typeof field === 'string' ? 'text' : field.type;
                                if (typeof field === 'string' && (fieldId.includes('forca') || fieldId.includes('graus') || fieldId.includes('int') || fieldId.includes('preensao') || fieldId.includes('polpa') || fieldId.includes('lateral') || fieldId.includes('tripode'))) fieldType = 'number';
                                
                                const isDeficitField = fieldId.toLowerCase().includes('deficit');
                                let val = answers[fieldId];
                                if (isDeficitField) {
                                    // Simplified deficit logic for the component
                                    val = "Calculando..."; 
                                }

                                return (
                                    <td key={fIdx} style={{ padding: '0.5rem 1rem' }}>
                                        <DataTableCell 
                                            fieldId={fieldId}
                                            fieldType={fieldType}
                                            fieldOptions={typeof field === 'string' ? [] : (field.options || [])}
                                            value={val}
                                            isEditing={isEditing}
                                            handleInputChange={handleInputChange}
                                            onImageClick={onImageClick}
                                            isPrint={isPrint}
                                            reflexOptions={reflexOptions}
                                            onOpenDynamo={onOpenDynamo}
                                            onAnalyzeImage={onAnalyzeImage}
                                            rowLabel={row.label}
                                            isCalculated={isDeficitField}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
