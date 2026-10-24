import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { IosInstallModal } from '../components/IosInstallModal.tsx';

export const Login: React.FC = () => {
  const { login, loginNotice, setLoginNotice } = useAuth();

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Harap isi username dan password Anda.');
      return;
    }

    setLoading(true);
    try {
      if (loginNotice) setLoginNotice(null);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      {/* Background aesthetic blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/25 border-2 border-emerald-400/40 bg-slate-900 mx-auto group">
            <img
              src="/assets/tamvesta_mascot.jpg"
              alt="Logo TAMVESTA Tamansiswa Batam"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              TAMVESTA
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-400 tracking-wide uppercase">
              Perguruan Tamansiswa Batam
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Sistem Informasi Sekolah Terpadu & Layanan Absensi Siswa
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-100/80 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900">
              Masuk ke Portal Sekolah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan username dan password akun Anda
            </p>
          </div>

          {loginNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800">Pemberitahuan</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{loginNotice}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Akun
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Memverifikasi Kredensial...</span>
                ) : (
                  <>
                    <span>Masuk ke TAMVESTA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security info */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-[11px] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Akses Terdaftar:</strong> Akun siswa dan staf didaftarkan secara resmi oleh Administrator Sekolah Tamansiswa Batam.
              </span>
            </div>
          </div>
        </div>

        {/* Mobile App Access Banner (Android APK & iOS iPhone PWA) */}
        <div className="mt-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-800 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Akses Aplikasi di HP
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Versi Mobile
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="/TAMVESTA.apk"
              download="TAMVESTA.apk"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Android (APK)</span>
            </a>

            <button
              type="button"
              onClick={() => setShowIosModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition shadow-sm active:scale-[0.98]"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>iPhone (iOS)</span>
            </button>
          </div>
        </div>

        {/* Modal Panduan iOS */}
        <IosInstallModal
          isOpen={showIosModal}
          onClose={() => setShowIosModal(false)}
        />

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 Perguruan Tamansiswa Batam. All rights reserved.</p>
          <p className="text-[11px] text-slate-600">Aplikasi Versi Resmi TAMVESTA</p>
        </div>
      </div>
    </div>
  );
};
