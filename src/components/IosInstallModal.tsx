import React from 'react';
import { X, Share2, PlusSquare, Smartphone, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3" /> PWA untuk iPhone & iPad
              </div>
              <h3 className="text-lg font-black tracking-tight">Pasang di iOS (iPhone)</h3>
              <p className="text-xs text-slate-300">Menjadikan TAMVESTA aplikasi di layar iPhone Anda</p>
            </div>
          </div>
        </div>

        {/* Content Steps */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Pengguna iPhone & iPad dapat memasang TAMVESTA menjadi <strong>aplikasi layar penuh tanpa bilah browser Safari</strong> dalam 3 langkah mudah:
          </p>

          {/* Step 1 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              1
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900">Buka di Browser Safari</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pastikan Anda membuka website <span className="font-mono text-emerald-700 font-semibold">apkupdate-indol.vercel.app</span> melalui aplikasi browser bawaan <strong>Safari</strong> (bukan Chrome/browser dalam aplikasi media sosial).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              2
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <span>Ketuk Ikon Bagikan / Share</span>
                <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ketuk tombol <strong>Bagikan</strong> (ikon kotak dengan panah ke atas) yang berada di bilah menu bagian bawah layar Safari Anda.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-700/30">
              3
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <span>Pilih "Tambah ke Layar Utama"</span>
                <PlusSquare className="w-3.5 h-3.5 text-emerald-700 inline" />
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Gulir ke bawah pada menu yang muncul, lalu pilih <strong>"Tambah ke Layar Utama"</strong> (atau <em>"Add to Home Screen"</em>), kemudian ketuk <strong>"Tambah"</strong> di pojok kanan atas.
              </p>
            </div>
          </div>

          {/* Benefit Badge */}
          <div className="p-3 bg-slate-100 rounded-2xl flex items-center gap-2.5 text-slate-700 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              <strong>Selesai!</strong> Ikon TAMVESTA akan langsung muncul di layar utama iPhone Anda dan berjalan dengan mode layar penuh (layaknya aplikasi App Store).
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition active:scale-[0.99]"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
