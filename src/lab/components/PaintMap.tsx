"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Paintbrush, Undo2, Eraser } from "lucide-react";
import { compressImage } from "@/lab/lib/image-compressor";
import { motion, AnimatePresence } from "framer-motion";

interface PaintMapProps {
  image: string;
  value?: string;
  onChange: (value: string) => void;
  colors: { hex: string, label: string }[];
  readOnly?: boolean;
}

export default function PaintMap({ image, value, onChange, colors, readOnly = false }: PaintMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeColor, setActiveColor] = useState(colors[0]?.hex || "#00FF00");
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Constants for fixed canvas logical size
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 900;

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    contextRef.current = ctx;

    // Load initial value if exists
    if (value && value.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0);
        if (history.length === 0) {
            setHistory([value]);
        }
      };
      img.src = value;
    } else if (!value) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (history.length > 0) setHistory([canvas.toDataURL()]);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = contextRef.current;
    if (!ctx || readOnly) return;

    const canvas = canvasRef.current;
    if (canvas) {
        const currentState = canvas.toDataURL();
        setHistory(prev => [...prev, currentState].slice(-20));
    }

    if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 30;
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 15;
    }

    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (!isEraser) return; // SOMENTE O PONTO (No scribbling for the brush)

    const ctx = contextRef.current;
    if (!ctx) return;
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      contextRef.current?.closePath();
      setIsDrawing(false);
      save();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      offsetX: (clientX - rect.left) * scaleX,
      offsetY: (clientY - rect.top) * scaleY,
    };
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const img = new Image();
    img.onload = () => {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0);
        setHistory(newHistory);
        save();
    };
    img.src = previousState;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    setHistory(prev => [...prev, canvas.toDataURL()]);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    save();
    setShowClearConfirm(false);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const compressed = await compressImage(dataUrl, 1000, 0.7, 'image/png');
    onChange(compressed);
  };

  return (
    <div className="paintmap-container">
      
      {/* 1. INTERACTIVE CANVAS Area */}
      <div 
        style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr',
            position: "relative", 
            width: "100%", 
            backgroundColor: "white", 
            borderRadius: "1.5rem", 
            overflow: "hidden", 
            border: "2px solid var(--border)", 
            boxShadow: "var(--shadow-lg)",
            cursor: readOnly ? "default" : "crosshair",
            touchAction: readOnly ? "auto" : "none"
        }}
      >
          <img 
            src={image} 
            alt="Map" 
            style={{ 
                gridArea: '1/1',
                width: "100%", 
                height: "auto", 
                display: "block",
                pointerEvents: "none", 
                zIndex: 1
            }} 
          />
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ 
                gridArea: '1/1',
                width: "100%", 
                height: "100%", 
                zIndex: 10,
                touchAction: "none"
            }}
          />

          {!readOnly && (
            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, y: 30, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    style={{ 
                        position: "absolute", 
                        bottom: "20px", 
                        left: "50%", 
                        transform: "translateX(-50%)", 
                        zIndex: 30,
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        padding: "8px 16px", 
                        backgroundColor: "rgba(255, 255, 255, 0.9)", 
                        backdropFilter: "blur(12px)", 
                        border: "1px solid rgba(0,0,0,0.1)", 
                        borderRadius: "2.5rem", 
                        boxShadow: "var(--shadow-xl)"
                    }}
                >
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setIsEraser(!isEraser)} style={{ padding: '8px', borderRadius: '50%', background: isEraser ? 'var(--primary)' : 'transparent', color: isEraser ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}><Eraser size={20} /></button>
                        <button onClick={undo} disabled={history.length <= 1} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', opacity: history.length <= 1 ? 0.3 : 1 }}><Undo2 size={20} /></button>
                        <button onClick={() => setShowClearConfirm(true)} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}><RotateCcw size={20} /></button>
                    </div>
                </motion.div>
            </AnimatePresence>
          )}
      </div>

      {/* 2. PERMANENT LEGEND & COLOR SELECTOR (SIDEBAR STYLE) */}
      <div style={{ 
        width: '100%', 
        padding: '1.5rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '1.5rem', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Paintbrush size={18} style={{ color: 'var(--primary)' }} />
          <h4 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', margin: 0 }}>
            Legenda e Cores
          </h4>
        </div>
        
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem' 
        }}>
          {colors.map((item, idx) => {
            const isActive = !isEraser && activeColor === item.hex;
            return (
              <button
                key={idx}
                onClick={() => {
                    if (readOnly) return;
                    setActiveColor(item.hex);
                    setIsEraser(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '0.75rem',
                  border: isActive ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? 'white' : 'white',
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                  textAlign: 'left'
                }}
              >
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: item.hex,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0
                }} />
                <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: isActive ? '800' : '600',
                    color: isActive ? 'var(--primary)' : '#475569'
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {!readOnly && (
            <p style={{ margin: 0, marginTop: '4px', fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                * Selecione uma cor e clique no mapa para fazer o registro da sensibilidade.
            </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '1rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontWeight: '700', marginBottom: '15px' }}>Deseja limpar todos os registros?</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => setShowClearConfirm(false)} className="btn-secondary">Cancelar</button>
                        <button onClick={clear} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Sim, Limpar</button>
                    </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
