"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Paintbrush, Undo2, Eraser } from "lucide-react";
import { compressImage } from "@/lab/lib/image-compressor";

interface BodySchemaProps {
  image: string;
  value?: string;
  onChange: (value: string) => void;
  colors?: { hex: string, label: string }[];
  mode?: "draw" | "stamp";
  readOnly?: boolean;
}

const COLORS = [
  { id: "red", hex: "#ff0000", label: "Dor" },
  { id: "blue", hex: "#0000ff", label: "Formigamento" },
  { id: "yellow", hex: "#ffff00", label: "Queimação" },
  { id: "green", hex: "#00ff00", label: "Parestesia" },
];

import { motion, AnimatePresence } from "framer-motion";

export default function BodySchema({ image, value, onChange, colors: customColors, mode = "draw", readOnly = false }: BodySchemaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const colors = customColors || COLORS;
  const [activeColor, setActiveColor] = useState(colors[0].hex);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Constants for fixed canvas logical size
  const CANVAS_WIDTH = 700;
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const currentData = canvas.toDataURL();
      if (value === currentData) return;

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
        // If value is explicitly cleared from parent
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (history.length > 0) setHistory([canvas.toDataURL()]);
    } else {
        // Initial empty state for history
        if (history.length === 0) {
            setHistory([canvas.toDataURL()]);
        }
    }
  }, [value]);


  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = contextRef.current;
    if (!ctx || readOnly) return;

    // Save current state to history BEFORE starting a new stroke
    const canvas = canvasRef.current;
    if (canvas) {
        const currentState = canvas.toDataURL();
        setHistory(prev => [...prev, currentState].slice(-20)); // Keep last 20 states
    }

    if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 30; // Eraser is typically larger
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 1.0; // Solid colors as requested
        ctx.lineWidth = mode === "stamp" ? 28 : 15;
    }

    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    // Draw point exactly where clicked, allowing dots instead of just lines
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (mode === "stamp" && !isEraser) return; // Prevent continuous dragging in stamp mode

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
    if (history.length <= 1) return; // Cannot undo initial state or empty history

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    const img = new Image();
    img.onload = () => {
        ctx.globalCompositeOperation = "source-over"; // Reset for redraw
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
    <div 
        style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            width: "100%", 
            position: "relative" 
        }}
    >
      
      {/* Container do Desenho (Canvas + Background) */}
      <div 
        style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr',
            position: "relative", 
            width: "100%", 
            maxWidth: "800px", 
            backgroundColor: "white", 
            borderRadius: "2rem", 
            overflow: "hidden", 
            border: "2px solid var(--border)", 
            boxShadow: "var(--shadow-lg)",
            cursor: readOnly ? "default" : (isEraser ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m20 20-7-7 3-3 7 7Z\"/><path d=\"M14 14 6 6l-3 3 8 8Z\"/></svg>') 12 12, auto" : "crosshair"),
            touchAction: readOnly ? "auto" : "none"
        }}
      >
          {/* Imagem de Fundo (Esquema Corporal) */}
          <img 
            src={image} 
            alt="Corpo" 
            style={{ 
                gridArea: '1/1',
                width: "100%", 
                height: "auto", 
                display: "block",
                pointerEvents: "none", 
                opacity: 0.95,
                zIndex: 1
            }} 
          />
          
          {/* Camada de Desenho (Canvas) */}
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

          {/* Barra de Ferramentas (Toolbar) */}
          {!readOnly && (
            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, y: 30, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 30, x: "-50%" }}
                    style={{ 
                        position: "absolute", 
                        bottom: "25px", 
                        left: "50%", 
                        transform: "translateX(-50%)", 
                        zIndex: 30,
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        padding: "10px 18px", 
                        backgroundColor: "rgba(255, 255, 255, 0.9)", 
                        backdropFilter: "blur(12px)", 
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.5)", 
                        borderRadius: "2.5rem", 
                        boxShadow: "0 15px 35px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.08)",
                        minWidth: "max-content"
                    }}
                >
                    {/* Grupo de Cores (Círculo + Label) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {colors.map((item: any, idx: number) => {
                            const isActive = !isEraser && activeColor === item.hex;
                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setActiveColor(item.hex);
                                        setIsEraser(false);
                                    }}
                                    style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "8px", 
                                        padding: "8px 14px", 
                                        borderRadius: "1.25rem", 
                                        border: "none",
                                        backgroundColor: isActive ? "white" : "transparent",
                                        boxShadow: isActive ? "0 4px 6px rgba(0,0,0,0.05)" : "none",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <div 
                                        style={{ 
                                            width: "18px", 
                                            height: "18px", 
                                            borderRadius: "50%", 
                                            backgroundColor: item.hex, 
                                            border: "2px solid white", 
                                            boxShadow: isActive ? "0 0 0 2px var(--primary)" : "0 0 0 1px rgba(0,0,0,0.1)",
                                            flexShrink: 0
                                        }} 
                                    />
                                    <span style={{ 
                                        fontSize: "13px", 
                                        fontWeight: "800", 
                                        color: isActive ? "var(--primary)" : "var(--text-muted)",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {item.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(0,0,0,0.08)", margin: "0 4px" }} />

                    {/* Grupo de Ferramentas (Somente Ícones) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsEraser(!isEraser)}
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "42px", 
                                height: "42px", 
                                borderRadius: "50%", 
                                border: "none",
                                backgroundColor: isEraser ? "var(--primary)" : "transparent",
                                color: isEraser ? "white" : "var(--text-muted)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            title="Borracha"
                        >
                            <Eraser size={22} />
                        </motion.button>

                        <motion.button
                            whileHover={history.length > 1 ? { scale: 1.1 } : {}}
                            whileTap={history.length > 1 ? { scale: 0.9 } : {}}
                            onClick={undo}
                            disabled={history.length <= 1}
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "42px", 
                                height: "42px", 
                                borderRadius: "50%", 
                                border: "none",
                                backgroundColor: "transparent",
                                color: "var(--text-muted)",
                                opacity: history.length <= 1 ? 0.3 : 1,
                                cursor: history.length <= 1 ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                            }}
                            title="Desfazer"
                        >
                            <Undo2 size={22} />
                        </motion.button>

                        {/* Limpar Tudo */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowClearConfirm(true)}
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "42px", 
                                height: "42px", 
                                borderRadius: "50%", 
                                border: "none",
                                backgroundColor: "transparent",
                                color: "#ef4444",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            title="Limpar Tudo"
                        >
                            <RotateCcw size={22} />
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
          )}

          {/* Dialogo de Confirmação Customizado */}
          <AnimatePresence>
            {showClearConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(4px)",
                        zIndex: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            backgroundColor: "white",
                            padding: "30px",
                            borderRadius: "2rem",
                            maxWidth: "340px",
                            width: "100%",
                            textAlign: "center",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                            border: "1px solid #f1f5f9"
                        }}
                    >
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            backgroundColor: "#fef2f2", 
                            borderRadius: "50%", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            margin: "0 auto 20px",
                            color: "#ef4444"
                        }}>
                            <RotateCcw size={30} />
                        </div>
                        
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "750", color: "#1e293b", marginBottom: "12px" }}>
                            Limpar tudo?
                        </h3>
                        
                        <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: "1.5", marginBottom: "25px" }}>
                            Deseja realmente apagar todas as marcações do esquema corporal? Esta ação não pode ser desfeita.
                        </p>
                        
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "1rem",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: "white",
                                    color: "#64748b",
                                    fontSize: "0.9rem",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={clear}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: "1rem",
                                    border: "none",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    fontSize: "0.9rem",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)"
                                }}
                            >
                                Apagar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Instrução Inferior */}
      {!readOnly && (
          <div style={{ marginTop: "1rem", opacity: 0.5, fontSize: "11px", fontWeight: "700", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Clique ou toque para marcar no esquema corporal
          </div>
      )}
    </div>
  );
}


