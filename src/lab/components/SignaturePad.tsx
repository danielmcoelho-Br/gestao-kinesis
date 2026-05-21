"use client";

import { useEffect, useRef, useState } from "react";
import { Undo2, RotateCcw } from "lucide-react";

interface SignaturePadProps {
    value?: string;
    onChange: (value: string) => void;
}

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    const CANVAS_WIDTH = 500;
    const CANVAS_HEIGHT = 200;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        contextRef.current = ctx;

        if (value && value.startsWith("data:image")) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.drawImage(img, 0, 0);
                if (history.length === 0) setHistory([value]);
            };
            img.src = value;
        }
    }, [value]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        const canvas = canvasRef.current;
        if (canvas) {
            setHistory(prev => [...prev, canvas.toDataURL()].slice(-10));
        }

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
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
            const canvas = canvasRef.current;
            if (canvas) onChange(canvas.toDataURL('image/webp', 0.6));
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
        if (history.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        const prevState = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(img, 0, 0);
            setHistory(newHistory);
            onChange(canvas.toDataURL('image/webp', 0.6));
        };
        img.src = prevState;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;
        setHistory(prev => [...prev, canvas.toDataURL()]);
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        onChange("");
    };

    return (
        <div style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '2px dashed var(--border)', overflow: 'hidden' }}>
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
                    style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                />
                
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={undo} disabled={history.length === 0} style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid var(--border)', cursor: 'pointer', opacity: history.length === 0 ? 0.4 : 1 }}>
                        <Undo2 size={16} />
                    </button>
                    <button type="button" onClick={clear} style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                Assine acima usando o mouse ou tela touchscreen
            </p>
        </div>
    );
}
