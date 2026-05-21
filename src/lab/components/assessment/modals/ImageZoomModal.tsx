"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ImageZoomModalProps {
  imageSrc: string;
  onClose: () => void;
}

export default function ImageZoomModal({ imageSrc, onClose }: ImageZoomModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="image-zoom-overlay"
    >
      <div className="zoom-close">
        <X size={32} />
      </div>
      <motion.img 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        src={imageSrc} 
        alt="Zoom" 
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}
