import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose?: () => void;
}

export const PasswordChangeModal: React.FC<Props> = ({ isOpen, isMandatory = false, onClose }) => {
  const { user, setMustChangePassword, refreshUser, logout, setLoginNotice } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || user?.role === 'admin') return null;

  const handleBackToLogin = () => {
    logout();
    if (onClose) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter demi keamanan akun Anda.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Password baru harus berbeda dari password sebelumnya.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword({ oldPassword, newPassword });
      setMustChangePassword(false);
      setSuccess('Password baru berhasil disimpan! Menyiapkan aplikasi...');

      // Tetap bisa langsung masuk tanpa diminta login ulang
      await refreshUser();

      setTimeout(() => {
        setSuccess(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onClose) onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengganti password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isMandatory ? 'Wajib Ganti Password Awal' : 'Ganti Password Akun'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isMandatory
                  ? 'Ganti password bawaan untuk langsung masuk ke aplikasi'
                  : 'Perbarui password untuk menjaga keamanan data'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isMandatory && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Perhatian:</strong> Akun Anda sedang menggunakan password awal dari sekolah. Demi keamanan, silakan buat password baru Anda untuk langsung masuk ke aplikasi.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password Lama / Password Awal
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Masukkan password awal Anda"
                className="w-full px-3.5 py-2.5 pl-10 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password Baru (Minimal 6 karakter)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Buat password baru yang aman"
                className="w-full px-3.5 py-2.5 pl-10 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ulangi password baru"
                className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-100">
            {isMandatory ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Batal & Keluar</span>
              </button>
            ) : (
              onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
              )
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Langsung Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
