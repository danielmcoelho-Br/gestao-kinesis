"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Maximize2, 
    Save, 
    Eraser, 
    Pencil, 
    Minus, 
    RotateCcw, 
    Undo, 
    Copy, 
    Download, 
    Grid, 
    Palette, 
    MousePointer2,
    Layers,
    Type,
    Trash2,
    Paintbrush
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import AngleMeasurement from "./AngleMeasurement";
import { compressImage } from "@/lab/lib/image-compressor";
import { toast } from "sonner";

interface PosturalAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (processedImage: string) => void;
}

export default function PosturalAnalysisModal({
    isOpen,
    onClose,
    imageSrc,
    onSave
}: PosturalAnalysisModalProps) {
    const [currentImage, setCurrentImage] = useState<string>(imageSrc);
    const [currentTool, setCurrentTool] = useState<'brush' | 'line' | 'angle' | 'eraser'>('angle');
    const [currentColor, setCurrentColor] = useState('#ff0000');
    const [showGrid, setShowGrid] = useState(false);
    const [gridSize, setGridSize] = useState(50);

    useEffect(() => {
        setCurrentImage(imageSrc);
    }, [imageSrc]);

    const handleAngleChange = useCallback((updatedImage: string) => {
        setCurrentImage(updatedImage);
    }, []);

    const handleSave = async () => {
        try {
            const compressed = await compressImage(currentImage);
            onSave(compressed);
            onClose();
        } catch (err) {
            console.error("Error saving image:", err);
            onSave(currentImage);
            onClose();
        }
    };

    const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"];

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: 10010, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: 'rgba(0,0,0,0.92)', 
                    backdropFilter: 'blur(12px)',
                    padding: '1.5rem'
                }}>
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        style={{ 
                            backgroundColor: '#1e293b', 
                            width: '100%', 
                            maxWidth: '1400px', 
                            height: '95vh',
                            borderRadius: '1.5rem', 
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f1f5f9'
                        }}
                    >
                        {/* HEADER */}
                        <div style={{ 
                            padding: '1rem 1.5rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: '#0f172a',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ borderLeft: '4px solid #8B0000', paddingLeft: '1rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
                                        Estúdio Profissional
                                    </h2>
                                </div>
                                <button style={{ backgroundColor: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Maximize2 size={14} /> NOVO
                                </button>
                            </div>

                            {/* TOOLBAR CENTER */}
                            <div style={{ display: 'flex', backgroundColor: '#334155', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                                <ToolButton active={currentTool === 'brush'} onClick={() => setCurrentTool('brush')} icon={<Paintbrush size={18}/>} label="PINCEL" />
                                <ToolButton active={currentTool === 'eraser'} onClick={() => setCurrentTool('eraser')} icon={<Eraser size={18}/>} label="BORRACHA" />
                                <ToolButton active={currentTool === 'line'} onClick={() => setCurrentTool('line')} icon={<Minus size={18}/>} label="RETA" />
                                <ToolButton active={currentTool === 'angle'} onClick={() => setCurrentTool('angle')} icon={<RotateCcw size={18}/>} label="ÂNGULO" />
                            </div>

                            {/* GRID & COLORS */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#334155', padding: '6px 12px', borderRadius: '12px' }}>
                                    <Grid size={18} color={showGrid ? '#ef4444' : '#94a3b8'} style={{ cursor: 'pointer' }} onClick={() => setShowGrid(!showGrid)} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Gradil</span>
                                    <input 
                                        type="range" 
                                        min="10" max="200" step="5" 
                                        value={gridSize} 
                                        onChange={(e) => setGridSize(parseInt(e.target.value))}
                                        style={{ width: '60px', accentColor: '#8B0000' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {COLORS.map(c => (
                                        <div 
                                            key={c} 
                                            onClick={() => setCurrentColor(c)}
                                            style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                borderRadius: '4px', 
                                                backgroundColor: c, 
                                                cursor: 'pointer',
                                                border: currentColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                                                transform: currentColor === c ? 'scale(1.2)' : 'scale(1)',
                                                transition: 'all 0.1s'
                                            }}
                                        />
                                    ))}
                                </div>
                                <X size={24} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={onClose} />
                            </div>
                        </div>

                        {/* SUB-HEADER ACTIONS */}
                        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', backgroundColor: '#1e293b' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <IconButton icon={<Undo size={16}/>} label="Desfazer" />
                                <IconButton icon={<RotateCcw size={16}/>} label="Limpar" />
                                <IconButton icon={<Trash2 size={16}/>} label="Apagar" color="#ef4444" bg="rgba(239, 68, 68, 0.1)"/>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <IconButton icon={<Copy size={16}/>} label="Copiar" />
                                <IconButton icon={<Download size={16}/>} label="Baixar" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={onClose} style={{ border: 'none', background: '#334155', color: '#f1f5f9', fontWeight: '700', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleSave} style={{ border: 'none', background: '#8B0000', color: 'white', fontWeight: '800', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(139, 0, 0, 0.4)' }}>SALVAR E INSERIR NO FORMULÁRIO</button>
                            </div>
                        </div>

                        {/* WORKSPACE */}
                        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', backgroundColor: '#0f172a', padding: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                                <AngleMeasurement 
                                    value={imageSrc} 
                                    onChange={handleAngleChange}
                                    currentTool={currentTool}
                                    currentColor={currentColor}
                                    showGrid={showGrid}
                                    gridSize={gridSize}
                                    showControls={false}
                                />
                            </div>
                        </div>

                        {/* FOOTER BAR */}
                        <div style={{ padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>KINESISLAB STUDIO V2.0 <span style={{ color: '#22c55e' }}>●</span></span>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>FERRAMENTA: {currentTool.toUpperCase()}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>HISTÓRICO: ATIVO</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '2px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: active ? '#ffffff' : 'transparent',
                color: active ? '#0f172a' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '80px'
            }}
        >
            {icon}
            <span style={{ fontSize: '0.6rem', fontWeight: '900' }}>{label}</span>
        </button>
    );
}

function IconButton({ icon, label, color = '#f1f5f9', bg = '#334155' }: { icon: any, label: string, color?: string, bg?: string }) {
    return (
        <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: bg, 
            color: color, 
            fontSize: '0.7rem', 
            fontWeight: '700', 
            cursor: 'pointer' 
        }}>
            {icon} {label}
        </button>
    );
}
