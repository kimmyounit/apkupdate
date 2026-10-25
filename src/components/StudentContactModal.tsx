import React, { useState } from 'react';
import { Phone, Mail, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentContactModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg('Nomor WhatsApp / HP aktif minimal 9 digit angka (contoh: 081234567890).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Alamat Gmail / Email tidak valid (contoh: siswa@gmail.com).');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateProfile({
        phone: cleanPhone,
        email: cleanEmail,
      });

      await refreshUser();

      setSuccessMsg('Terima kasih! Kontak Anda berhasil disimpan. Anda siap menerima informasi sekolah.');

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan nomor HP dan Gmail. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header with decorative badge */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 border border-white/25">
            INFORMASI KONTAK SISWA
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight">
            Selamat Datang di Portal Siswa
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto leading-relaxed">
            Halo, <strong>{user.name}</strong>! Masukkan nomor WhatsApp dan Gmail Anda agar selalu mendapatkan informasi pengumuman & kegiatan sekolah.
          </p>
        </div>

        {/* Content & Form */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input WhatsApp / HP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nomor WhatsApp / HP Aktif *</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Digunakan untuk notifikasi pengumuman resmi & informasi sekolah.
              </p>
            </div>

            {/* Input Gmail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                <span>Alamat Gmail Aktif *</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Contoh: nama.siswa@gmail.com"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Digunakan untuk informasi hasil kuis, barcode kehadiran, dan arsip belajar.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data kontak tersimpan aman dan terenkripsi pada sistem TAMVESTA.</span>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Menyimpan Kontak...</span>
                ) : (
                  <>
                    <span>Simpan & Dapatkan Informasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
