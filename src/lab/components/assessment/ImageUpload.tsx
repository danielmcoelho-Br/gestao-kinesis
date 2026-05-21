"use client";

import { useState, memo } from "react";
import { Upload, X, Maximize2 } from "lucide-react";
import { compressImage } from "@/lab/lib/image-compressor";

interface ImageUploadProps {
    value: any; 
    isEditing: boolean; 
    onChange: (val: any) => void;
    onImageClick: (img: string) => void;
    onAnalyzeImage?: (img: string, index: number) => void;
    isTable?: boolean;
    isPrint?: boolean;
}

const ImageUpload = memo(({ 
    value, 
    isEditing, 
    onChange, 
    onImageClick,
    onAnalyzeImage,
    isTable = false,
    isPrint = false 
}: ImageUploadProps) => {
    const images: string[] = Array.isArray(value) ? value : (value ? [value] : []);
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: (isTable || isPrint) ? 'center' : 'flex-start', width: '100%' }}>
            {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: (isTable || isPrint) ? 'center' : 'flex-start', width: '100%' }}>
                    {images.map((img, idx) => (
                        <div 
                            key={idx}
                            style={{ 
                                position: 'relative', 
                                width: isPrint ? '100%' : (isTable ? '60px' : '360px'), 
                                maxWidth: isPrint ? '700px' : '100%',
                                height: isPrint ? 'auto' : (isTable ? '60px' : '270px'), 
                                minHeight: isPrint ? '500px' : '0',
                                cursor: 'zoom-in',
                                margin: isPrint ? '0 auto 2rem' : '0'
                            }}
                            onClick={() => onImageClick(img)}
                        >
                            <img 
                                src={img} 
                                style={{ width: '100%', height: '100%', objectFit: isPrint ? 'contain' : 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
                                alt="Upload" 
                            />
                            {isEditing && (
                                <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                                    {onAnalyzeImage && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAnalyzeImage(img, idx);
                                            }}
                                            title="Análise Postural"
                                            style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                        >
                                            <Maximize2 size={12} />
                                        </button>
                                    )}
                                    <button 
                                        type="button"
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
                                    // Fallback to original via reader if compressor fails somehow
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        onChange([...images, reader.result as string]);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                        />
                        <button type="button" className="btn-action-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                            <Upload size={14} /> Upload
                        </button>
                    </div>

                    {onAnalyzeImage && (
                        <button 
                            type="button" 
                            className="btn-action" 
                            onClick={() => onAnalyzeImage('', images.length)}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Maximize2 size={14} /> Análise Postural
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

export default ImageUpload;
