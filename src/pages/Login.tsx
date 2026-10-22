import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Server,
  Settings2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getServerUrl, pingServer } from '../lib/api.ts';
import { ServerSettings } from './ServerSettings.tsx';

export const Login: React.FC = () => {
  const { login, loginNotice, setLoginNotice } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const ok = await pingServer();
      setServerOnline(ok);
    } catch {
      setServerOnline(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
              Sistem Informasi Sekolah Terpadu & Layanan Absensi QR Code
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100/80 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Masuk ke Portal Sekolah
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan username dan password akun Anda
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Pengaturan Koneksi Server"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {/* Server Connection Status Indicator */}
          <div
            onClick={() => setShowServerModal(true)}
            className={`cursor-pointer px-3 py-2 rounded-xl border flex items-center justify-between text-[11px] font-semibold transition ${
              serverOnline === true
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : serverOnline === false
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                serverOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : serverOnline === false
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`} />
              <span>
                {serverOnline === true
                  ? `Server Laptop Aktif (${getServerUrl().replace(/^https?:\/\//, '')})`
                  : serverOnline === false
                  ? `Server Laptop Tidak Terdeteksi (${getServerUrl().replace(/^https?:\/\//, '')})`
                  : 'Memeriksa Server Laptop...'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hover:text-slate-700 underline font-normal">
              Ubah IP
            </span>
          </div>

          {/* Success banner if redirected back to login after password change */}
          {loginNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800">Password Berhasil Diperbarui!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{loginNotice}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition active:scale-[0.99] disabled:opacity-50"
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

          {/* Official Security Notice - No passwords shown */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-[11px] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Akses Resmi:</strong> Verifikasi login dilakukan secara aman melalui server sekolah. Akun baru diwajibkan mengganti password awal pada login pertama.
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Perguruan Tamansiswa Batam. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sistem Informasi Sekolah TAMVESTA — Produksi Resmi
          </p>
        </div>
      </div>

      {showServerModal && (
        <ServerSettings
          onClose={() => {
            setShowServerModal(false);
            checkServerConnection();
          }}
        />
      )}
    </div>
  );
};
