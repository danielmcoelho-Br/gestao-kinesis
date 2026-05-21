"use client";

import { motion } from "framer-motion";

interface BarProps {
    value: number;
    maxValue: number;
    label: string;
    color: string;
    subLabel?: string;
    unit?: string;
    isPrint?: boolean;
}

const Bar = ({ value, maxValue, label, color, subLabel, unit = 's', isPrint = false }: BarProps) => {
    let barColor = color;
    if (isPrint) {
        if (color === 'var(--primary)' || color.toLowerCase() === '#8b0000') barColor = '#8B0000';
        else if (color === 'var(--primary-light)' || color.toLowerCase() === '#fee2e2') barColor = '#fee2e2';
        else if (color === 'var(--secondary)') barColor = '#1e293b';
        else if (color === 'var(--secondary-light)') barColor = '#f1f5f9';
    }
    
    return (
        <div style={{ 
            flex: 1, 
            minWidth: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '8px',
            height: '190px' // INCREASED TOTAL HEIGHT
        }}>
            <div style={{ 
                height: '140px', // FIXED BAR CONTAINER HEIGHT
                width: '100%', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                overflow: 'hidden'
            }}>
                {isPrint ? (
                    <div style={{ 
                        height: `${(value / (maxValue || 1)) * 100}%`,
                        width: '100%', 
                        backgroundColor: barColor,
                        borderRadius: '4px 4px 0 0'
                    }} />
                ) : (
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / (maxValue || 1)) * 100}%` }}
                        style={{ 
                            width: '100%', 
                            backgroundColor: barColor,
                            borderRadius: '4px 4px 0 0'
                        }}
                    />
                )}
                <div style={{ 
                    position: 'absolute', 
                    top: value / (maxValue || 1) > 0.5 ? '50%' : 'auto',
                    bottom: value / (maxValue || 1) > 0.5 ? 'auto' : '8px',
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontWeight: '800',
                    color: value / (maxValue || 1) > 0.5 ? '#fff' : 'var(--text)',
                    textShadow: value / (maxValue || 1) > 0.5 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    zIndex: 1,
                    textAlign: 'center',
                    width: '100%',
                    fontSize: isPrint ? '0.7rem' : '0.9rem'
                }}>
                    {value}{unit}
                </div>
            </div>
            <div style={{ 
                textAlign: 'center', 
                height: '48px', // INCREASED LABEL AREA HEIGHT
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                padding: '0 4px'
            }}>
                <div style={{ fontSize: isPrint ? '0.75rem' : '1rem', fontWeight: '900', color: 'var(--secondary)', lineHeight: 1.1 }}>{label}</div>
                {subLabel && <div style={{ fontSize: isPrint ? '0.7rem' : '0.9rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '2px' }}>{subLabel}</div>}
            </div>
        </div>
    );
};

export default Bar;
