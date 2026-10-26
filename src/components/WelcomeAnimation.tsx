import React, { useEffect, useState } from 'react';
import { School, Sparkles } from 'lucide-react';

interface WelcomeAnimationProps {
  name: string;
  onFinish: () => void;
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ name, onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Failsafe timer: maximum 2 seconds
    const maxTimer = setTimeout(() => {
      onFinish();
    }, 2200);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onFinish();
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      clearTimeout(maxTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
      {/* Background glowing orbs */}
      <div className="absolute w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm space-y-6">
        {/* Animated App Icon Mascot */}
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 border-3 border-emerald-400/50 bg-slate-900 mx-auto animate-bounce duration-1000">
            <img
              src="/assets/tamvesta_mascot.jpg"
              alt="TAMVESTA Mascot"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg animate-spin">
            <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
          </div>
        </div>

        {/* Text Greetings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <School className="w-3.5 h-3.5 text-amber-300" />
            <span>Perguruan Tamansiswa Batam</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Selamat Datang di TAMVESTA
          </h2>

          <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent leading-snug">
            Hello, {name || 'Siswa'}!
          </p>

          <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
            Mempersiapkan beranda dan materi sekolah untuk Anda...
          </p>
        </div>

        {/* Smooth Loading Bar */}
        <div className="w-56 bg-slate-800/80 rounded-full h-2 overflow-hidden border border-emerald-500/30">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={onFinish}
          className="px-4 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition"
        >
          Lewati &gt;
        </button>
      </div>
    </div>
  );
};
