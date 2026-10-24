import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize } from 'lucide-react';

interface Props {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<Props> = ({ imageUrl, title, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!imageUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.6));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `TAMVESTA_Foto_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold truncate max-w-[200px] sm:max-w-md">
          {title || 'Pratinjau Foto'}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Putar 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Ukuran Asli (Reset)"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 hover:bg-white/20 rounded-full transition text-emerald-400"
            title="Unduh Foto"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-white/20 my-auto" />
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-rose-600/80 hover:bg-rose-600 rounded-full transition text-white"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enlarged Image Canvas */}
      <div className="relative max-w-full max-h-[85vh] flex items-center justify-center overflow-auto p-4 select-none">
        <img
          src={imageUrl}
          alt={title || 'Foto diperbesar'}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
          draggable={false}
        />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 text-center text-[11px] text-white/50 pointer-events-none">
        Ketuk tombol perbesar / perkecil di atas atau klik latar belakang untuk menutup
      </div>
    </div>
  );
};
