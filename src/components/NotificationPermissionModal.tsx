import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  X,
  Megaphone,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  isNotificationPromptDismissed,
  dismissNotificationPrompt,
  requestNotificationPermission,
} from '../lib/notificationService.ts';

interface NotificationPermissionModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'denied' | 'unsupported';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!isNotificationSupported()) {
      return;
    }

    const perm = getNotificationPermission();
    if (perm === 'default' && !isNotificationPromptDismissed()) {
      // Tampilkan popup setelah delay 1.5 detik agar pengguna tidak kaget saat halaman baru termuat
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    dismissNotificationPrompt(24); // Tunda 24 jam
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleRequest = async () => {
    setLoading(true);
    setStatusMessage(null);

    const result = await requestNotificationPermission();
    setLoading(false);

    if (result === 'granted') {
      setStatusMessage({
        type: 'success',
        text: 'Notifikasi berhasil diaktifkan! Pengumuman dan pesan support akan otomatis masuk ke perangkat Anda.',
      });
      setTimeout(() => {
        setIsOpen(false);
        if (onClose) onClose();
      }, 2200);
    } else if (result === 'denied') {
      setStatusMessage({
        type: 'denied',
        text: 'Izin notifikasi diblokir di browser. Buka Setelan / Info Situs browser Anda untuk mengizinkan notifikasi.',
      });
    } else {
      setStatusMessage({
        type: 'unsupported',
        text: 'Perangkat atau browser ini belum mendukung Web Notification API.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200">
        {/* Dekorasi Aksen Header */}
        <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          title="Tutup dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Ikon & Maskot TAMVESTA */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Bell className="w-8 h-8 text-amber-300 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Info & Notifikasi Sekolah
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5 leading-snug">
                Aktifkan Notifikasi TAMVESTA 🔔
              </h3>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Deskripsi Manfaat */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Izinkan notifikasi agar setiap pengumuman penting sekolah dan pesan dari Tim Support langsung muncul di layar perangkat Anda:
          </p>

          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Pengumuman Resmi Sekolah</h4>
                <p className="text-[11px] text-slate-500">Info libur, ujian, dan kegiatan dari Kepala Sekolah & Guru</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Pesan Resmi Developer & Support</h4>
                <p className="text-[11px] text-slate-500">Pembaruan sistem, info penting akun, dan panduan fitur</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Pengingat Jadwal & Absensi</h4>
                <p className="text-[11px] text-slate-500">Notifikasi kehadiran QR Code dan jadwal kuis aktif</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleRequest}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{loading ? 'Memproses Izin...' : 'Izinkan Notifikasi Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-2xl text-xs font-bold transition"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
