import { compressImage } from '../lib/imageCompressor.ts';
import React, { useState } from 'react';
import { X, Image, Video, Sparkles, Send, Camera } from 'lucide-react';
import { api } from '../lib/api.ts';
import type { Story } from '../types/index.ts';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran file media maksimal 25 MB.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');

    if (file.type.startsWith('image/')) {
      compressImage(file).then((compressed) => {
        setMediaUrl(compressed);
      }).catch(() => {
        const reader = new FileReader();
        reader.onload = () => setMediaUrl(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => setMediaUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      alert('Silakan pilih foto atau video terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.createStory({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
      });
      onStoryCreated(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal membagikan Story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-800">Bagikan Cerita (Story 24 Jam)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Media Picker / Preview */}
          <div className="flex flex-col items-center">
            {mediaUrl ? (
              <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} controls className="max-h-full max-w-full object-contain" />
                ) : (
                  <img src={mediaUrl} alt="Preview Story" className="max-h-full max-w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => setMediaUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full aspect-square max-w-[280px] border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 transition flex flex-col items-center justify-center cursor-pointer p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-emerald-600 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Pilih Foto atau Video Story
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dari galeri atau jepret langsung lewat kamera
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan Singkat (Opsional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis pesan untuk teman-temanmu..."
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Story Anda akan otomatis terhapus setelah <strong>24 jam</strong> sejak diunggah.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !mediaUrl}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengunggah...' : 'Bagikan Story'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
