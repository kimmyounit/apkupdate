import React, { useState, useEffect } from 'react';
import { Bell, X, ChevronRight } from 'lucide-react';

interface InAppNotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const InAppNotificationBanner: React.FC = () => {
  const [currentNotif, setCurrentNotif] = useState<InAppNotificationData | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const data = e.detail;
      if (!data || !data.title) return;

      const notifItem: InAppNotificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: data.title,
        body: data.body || '',
        icon: data.icon || '/assets/tamvesta_mascot.jpg',
        tag: data.tag,
      };

      setCurrentNotif(notifItem);
    };

    window.addEventListener('tamvesta_inapp_notification', handleNotification);
    return () => window.removeEventListener('tamvesta_inapp_notification', handleNotification);
  }, []);

  // Auto dismiss after 5.5 seconds
  useEffect(() => {
    if (!currentNotif) return;
    const timer = setTimeout(() => {
      setCurrentNotif(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [currentNotif]);

  if (!currentNotif) return null;

  const handleClick = () => {
    const tag = currentNotif.tag || '';
    setCurrentNotif(null);

    if (tag.startsWith('tamvesta-ann-')) {
      window.dispatchEvent(new CustomEvent('tamvesta_navigate', { detail: 'pengumuman' }));
    } else if (tag.startsWith('tamvesta-post-')) {
      window.dispatchEvent(new CustomEvent('tamvesta_navigate', { detail: 'home' }));
    } else {
      window.dispatchEvent(new CustomEvent('tamvesta_refresh_notifications'));
    }
  };

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 animate-in slide-in-from-top-3 fade-in duration-300">
      <div
        onClick={handleClick}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 cursor-pointer hover:bg-slate-900 transition-all group"
      >
        <div className="relative shrink-0">
          <img
            src={currentNotif.icon || '/assets/tamvesta_mascot.jpg'}
            alt="Mascot"
            className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-xs"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-slate-900 text-[9px]">
            <Bell className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
              TAMVESTA NOTIFIKASI
            </span>
            <span className="text-[9px] text-slate-400">Baru saja</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition">
            {currentNotif.title}
          </h4>
          {currentNotif.body && (
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
              {currentNotif.body}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 self-center">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentNotif(null);
            }}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
            title="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
