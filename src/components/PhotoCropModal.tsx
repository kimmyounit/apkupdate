import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Move, Camera } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCropSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropSave,
  onCancel,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for Android mobile screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSaveCropped = () => {
    const canvas = document.createElement('canvas');
    const size = 400; // Output high-res 400x400
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx || !imageRef.current) return;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Center pivot
    ctx.translate(size / 2, size / 2);
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);

    const img = imageRef.current;
    const imgAspect = img.width / img.height;
    let renderW = size;
    let renderH = size;
    if (imgAspect > 1) {
      renderW = size * imgAspect;
    } else {
      renderH = size / imgAspect;
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();

    // Convert to JPEG data url
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">Sesuaikan & Potong Foto</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Viewport */}
        <div className="p-4 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-3 text-center">
            Geser foto atau perbesar untuk menyesuaikan posisi yang pas di dalam lingkaran:
          </p>

          <div
            className="relative w-64 h-64 sm:w-72 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/50 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image being adjusted */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Preview"
              draggable={false}
              className="max-w-none transition-transform pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                maxHeight: '100%',
                maxWidth: '100%',
              }}
            />

            {/* Circular Crop Overlay Mask */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] flex items-center justify-center">
                <span className="text-[10px] text-white/40 tracking-wider uppercase font-semibold">
                  Area Foto Profil
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Zoom & Reset */}
          <div className="w-full max-w-xs mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <ZoomOut className="w-4 h-4" /> Perkecil
              </span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(scale * 100)}%</span>
              <span className="flex items-center gap-1 font-semibold">
                Perbesar <ZoomIn className="w-4 h-4" />
              </span>
            </div>

            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Posisi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveCropped}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Foto Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
