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
  UserPlus,
  LogIn,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';

export const Login: React.FC = () => {
  const { login, loginNotice, setLoginNotice } = useAuth();
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register states
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [regKelas, setRegKelas] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const name = regName.trim();
    const uname = regUsername.trim().toLowerCase();

    if (!name) {
      setRegError('Nama lengkap siswa wajib diisi.');
      return;
    }
    if (!regGender) {
      setRegError('Silakan pilih jenis kelamin (Laki-laki / Perempuan).');
      return;
    }
    if (!regKelas) {
      setRegError('Silakan pilih kelas siswa (Kelas 1 sampai Kelas 9).');
      return;
    }
    if (!uname || uname.length < 3) {
      setRegError('Username minimal 3 karakter.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password minimal 6 karakter demi keamanan akun.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.registerStudent({
        name,
        gender: regGender,
        kelas: regKelas,
        username: uname,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      // Sukses mendaftar
      setRegSuccess(res.message || 'Pendaftaran akun siswa berhasil! Akun Anda siap digunakan.');
      setUsername(uname);
      setPassword('');
      // Reset form daftar
      setRegName('');
      setRegGender('');
      setRegKelas('');
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');

      // Arahkan ke tab login setelah 1 detik atau langsung
      setTimeout(() => {
        setActiveMode('login');
      }, 1200);
    } catch (err: any) {
      setRegError(err.message || 'Pendaftaran gagal diproses. Silakan coba kembali.');
    } finally {
      setRegLoading(false);
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

        {/* Card Form with Mode Switcher */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-100/80 space-y-4">
          {/* Switcher Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition ${
                activeMode === 'login'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition ${
                activeMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Siswa Baru</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* 1. TAB MASUK / LOGIN                                      */}
          {/* ========================================================= */}
          {activeMode === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
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

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-800">Pendaftaran Berhasil!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{regSuccess}</p>
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
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition active:scale-[0.99] disabled:opacity-50"
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
                    <strong>Akses Resmi:</strong> Verifikasi login dilakukan langsung ke server basis data sekolah. Password terenkripsi secara aman.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. TAB DAFTAR SISWA BARU                                  */}
          {/* ========================================================= */}
          {activeMode === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                    Pendaftaran Mandiri Siswa
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Registrasi Akun Siswa Baru
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data diri untuk mendaftarkan akun siswa resmi
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleRegisterSubmit}>
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Muhammad Rizky"
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>

                {/* 2. Gender & Kelas (Dropdown) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                    >
                      <option value="">Pilih Gender</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kelas Siswa *
                    </label>
                    <select
                      value={regKelas}
                      onChange={(e) => setRegKelas(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                    >
                      <option value="">Pilih Kelas</option>
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="Kelas 4">Kelas 4</option>
                      <option value="Kelas 5">Kelas 5</option>
                      <option value="Kelas 6">Kelas 6</option>
                      <option value="Kelas 7">Kelas 7</option>
                      <option value="Kelas 8">Kelas 8</option>
                      <option value="Kelas 9">Kelas 9</option>
                    </select>
                  </div>
                </div>

                {/* 3. Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Akun (Unik) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                      placeholder="rizky.tamvesta"
                      required
                      className="w-full pl-8 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Gunakan huruf kecil, angka, titik atau underscore.</p>
                </div>

                {/* 4. Password & Konfirmasi Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password (Min. 6) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 pr-9 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Konfirmasi Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {regLoading ? (
                      <span>Mendaftarkan ke Database...</span>
                    ) : (
                      <>
                        <span>Daftar Akun Siswa</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Perguruan Tamansiswa Batam. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sistem Informasi Sekolah TAMVESTA — Produksi Resmi
          </p>
        </div>
      </div>
    </div>
  );
};
