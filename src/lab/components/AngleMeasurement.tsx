"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, Target, ImagePlus, Undo, RotateCcw } from "lucide-react";
import { compressImage } from "@/lab/lib/image-compressor";

interface Point {
    x: number;
    y: number;
}

interface DrawingElement {
    id: string;
    type: 'brush' | 'line' | 'angle';
    points: Point[];
    color: string;
    thickness: number;
    angle?: number | null;
}

interface AngleMeasurementProps {
    value?: string;
    onChange?: (value: string) => void;
    onAnalyze?: () => void;
    currentTool?: 'brush' | 'line' | 'angle' | 'eraser';
    currentColor?: string;
    showGrid?: boolean;
    gridSize?: number;
    showControls?: boolean;
    isEditing?: boolean;
}

export default function AngleMeasurement({ 
    value, 
    onChange, 
    onAnalyze,
    currentTool = 'angle', 
    currentColor = '#ff0000',
    showGrid = false,
    gridSize = 50,
    showControls = true,
    isEditing = true
}: AngleMeasurementProps) {
    const [image, setImage] = useState<string | null>(null);
    const [elements, setElements] = useState<DrawingElement[]>([]);
    const [currentElementPoints, setCurrentElementPoints] = useState<Point[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Initial load
    useEffect(() => {
        if (value && value.startsWith("data:image")) {
            setImage(value);
        } else if (value) {
            // Probably a URL
            setImage(value);
        }
    }, [value]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setImage(compressed);
            setElements([]);
            setCurrentElementPoints([]);
            if (onChange) {
                setTimeout(() => {
                    if (canvasRef.current) {
                        onChange(canvasRef.current.toDataURL('image/jpeg', 0.8));
                    }
                }, 100);
            }
        } catch (err) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                if (onChange) {
                    setTimeout(() => {
                        if (canvasRef.current) onChange(canvasRef.current.toDataURL());
                    }, 100);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateAngleValue = (pts: Point[]): number => {
        if (pts.length < 3) return 0;
        const [p1, p2, p3] = pts;
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dotProduct = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
        return Math.round((angleRad * 180 / Math.PI) * 10) / 10;
    };

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const x = (clientX - rect.left) * (canvasRef.current!.width / rect.width);
        const y = (clientY - rect.top) * (canvasRef.current!.height / rect.height);
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!image || !isEditing || !onChange) return; // If no onChange, we're likely in preview mode
        const pt = getCanvasPoint(e);
        setIsDrawing(true);

        if (currentTool === 'angle') {
            const nextPoints = [...currentElementPoints, pt];
            setCurrentElementPoints(nextPoints);
            if (nextPoints.length === 3) {
                const angle = calculateAngleValue(nextPoints);
                setElements(prev => [...prev, {
                    id: Date.now().toString(),
                    type: 'angle',
                    points: nextPoints,
                    angle: angle,
                    color: currentColor,
                    thickness: 2
                }]);
                setCurrentElementPoints([]);
                setIsDrawing(false);
            }
        } else if (currentTool === 'line' || currentTool === 'brush') {
            setCurrentElementPoints([pt]);
        } else if (currentTool === 'eraser') {
            setElements(prev => prev.filter(el => !el.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 20)));
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !image) return;
        const pt = getCanvasPoint(e);
        if (currentTool === 'brush') setCurrentElementPoints(prev => [...prev, pt]);
        else if (currentTool === 'line') setCurrentElementPoints(prev => [prev[0], pt]);
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentTool === 'brush' || (currentTool === 'line' && currentElementPoints.length === 2)) {
            setElements(prev => [...prev, {
                id: Date.now().toString(),
                type: currentTool as any,
                points: currentElementPoints,
                color: currentColor,
                thickness: currentTool === 'brush' ? 4 : 2
            }]);
            setCurrentElementPoints([]);
        }
    };

    useEffect(() => {
        if (!canvasRef.current || !image) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            if (showGrid) {
                ctx.save();
                ctx.strokeStyle = `rgba(59, 130, 246, 0.4)`;
                ctx.lineWidth = 1;
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }
                ctx.strokeStyle = `rgba(239, 68, 68, 0.5)`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
                ctx.restore();
            }

            const drawEl = (el: DrawingElement | any) => {
                ctx.strokeStyle = el.color;
                ctx.fillStyle = el.color;
                ctx.lineWidth = el.thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (el.type === 'brush' || el.type === 'line') {
                    if (el.points.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(el.points[0].x, el.points[0].y);
                    for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
                    ctx.stroke();
                } else if (el.type === 'angle') {
                    el.points.forEach((p: any) => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
                    if (el.points.length >= 2) { ctx.beginPath(); ctx.moveTo(el.points[0].x, el.points[0].y); ctx.lineTo(el.points[1].x, el.points[1].y); ctx.stroke(); }
                    if (el.points.length === 3) {
                        ctx.beginPath(); ctx.moveTo(el.points[1].x, el.points[1].y); ctx.lineTo(el.points[2].x, el.points[2].y); ctx.stroke();
                        if (el.angle) {
                            const vertex = el.points[1];
                            ctx.font = "bold 50px Arial";
                            ctx.fillStyle = "white";
                            ctx.shadowBlur = 4;
                            ctx.shadowColor = "black";
                            ctx.textAlign = "center";
                            ctx.fillText(`${el.angle}°`, vertex.x, vertex.y - 40);
                            ctx.shadowBlur = 0;
                        }
                    }
                }
            };

            elements.forEach(drawEl);
            if (currentElementPoints.length > 0) {
                drawEl({
                    type: currentTool === 'eraser' ? 'angle' : currentTool,
                    points: currentElementPoints,
                    color: currentTool === 'eraser' ? 'rgba(255,255,255,0.5)' : currentColor,
                    thickness: currentTool === 'brush' ? 4 : 2,
                    angle: currentTool === 'angle' && currentElementPoints.length === 3 ? calculateAngleValue(currentElementPoints) : null
                });
            }

            if (!isDrawing && onChange) onChange(canvas.toDataURL());
        };
        img.src = image;
    }, [image, elements, currentElementPoints, showGrid, gridSize, isDrawing]);

    // If we're not using the interactive engine (standard view in form)
    if (!onChange && onAnalyze) {
        return (
            <div className="am-trigger-container">
                {!value ? (
                    <div className="am-empty-state">
                        <div className="am-icon-circle">
                            <Target size={40} className="opacity-20" />
                        </div>
                        <p className="am-empty-text">Faça o upload de uma imagem para iniciar a análise</p>
                        {isEditing && (
                            <button onClick={onAnalyze} className="am-btn-studio">
                                <div className="am-btn-icon"><Maximize2 size={24} /></div>
                                <span>Abrir Estúdio de Análise Professional</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="am-preview-container">
                        <img src={value} alt="Análise Angular" className="am-preview-image" />
                        {isEditing && (
                            <div className="am-preview-overlay">
                                <button onClick={onAnalyze} className="am-btn-studio-mini">
                                    <Maximize2 size={20} />
                                    <span>Abrir Estúdio</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <style jsx>{`
                    .am-trigger-container { width: 100%; border-radius: 1.5rem; overflow: hidden; background-color: #f8fafc; border: 2px solid #e2e8f0; }
                    .am-empty-state { height: 18rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; padding: 2rem; text-align: center; }
                    .am-icon-circle { width: 5rem; height: 5rem; background-color: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                    .am-empty-text { font-weight: 600; color: #64748b; font-size: 1.1rem; max-width: 300px; }
                    .am-btn-studio { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.5rem; background-color: #9b1d22; color: white; border-radius: 1rem; font-weight: 700; font-size: 1rem; border: none; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(155, 29, 34, 0.2); }
                    .am-btn-studio:hover { background-color: #7a161b; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(155, 29, 34, 0.3); }
                    .am-btn-icon { background-color: rgba(255, 255, 255, 0.2); padding: 0.25rem; border-radius: 0.5rem; }
                    .am-preview-container { position: relative; width: 100%; min-height: 12rem; display: flex; justify-content: center; background-color: #f1f5f9; }
                    .am-preview-image { max-width: 100%; max-height: 30rem; height: auto; display: block; object-fit: contain; }
                    .am-preview-overlay { position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; }
                    .am-preview-container:hover .am-preview-overlay { opacity: 1; }
                    .am-btn-studio-mini { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background-color: #9b1d22; color: white; border-radius: 0.75rem; font-weight: 700; border: none; cursor: pointer; }
                `}</style>
            </div>
        );
    }

    // Engine view for the Modal
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {showControls && isEditing && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setElements(prev => prev.slice(0, -1))} className="btn-action-outline" title="Desfazer"><Undo size={18}/></button>
                        <button onClick={() => { if(confirm("Limpar?")) setElements([]); }} className="btn-action-outline" title="Limpar"><RotateCcw size={18}/></button>
                    </div>
                </div>
            )}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', backgroundColor: '#cbd5e1', borderRadius: '1rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!image ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}>
                        <ImagePlus size={48} color="#64748b" />
                        <span style={{ fontWeight: 600, color: '#64748b' }}>Carregar Imagem para Estúdio</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                ) : (
                    <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                )}
            </div>
        </div>
    );
}
