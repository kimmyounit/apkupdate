import React, { useState } from 'react';
import {
  School,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Printer,
  Copy,
  ArrowRight,
  ShieldCheck,
  Phone,
  Calendar,
  Lock,
  User,
  MapPin,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  Award,
} from 'lucide-react';
import { api } from '../../lib/api.ts';

interface RegistrationPortalProps {
  onBackToLogin: () => void;
  onLoginWithCredentials?: (username: string) => void;
}

export const RegistrationPortalPage: React.FC<RegistrationPortalProps> = ({
  onBackToLogin,
  onLoginWithCredentials,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'status' | 'info'>('form');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [kelas, setKelas] = useState('Kelas 7');
  const [nisn, setNisn] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [birthPlaceDate, setBirthPlaceDate] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    registrationNumber: string;
    name: string;
    username: string;
    kelas: string;
    registeredAt: string;
  } | null>(null);

  // Status check states
  const [statusQuery, setStatusQuery] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    message?: string;
    user?: {
      name: string;
      username: string;
      registrationNumber: string;
      kelas: string;
      gender: string;
      registeredAt?: string;
      approvedAt?: string;
      approvedBy?: string;
      status: string;
      isActive: boolean;
    };
  } | null>(null);

  const [copiedReg, setCopiedReg] = useState(false);

  // Handle registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nama lengkap calon siswa wajib diisi.');
      return;
    }
    if (!username.trim()) {
      setFormError('Username wajib diisi untuk login akun.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok dengan password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerPortalStudent({
        name: name.trim(),
        username: username.trim(),
        password,
        confirmPassword,
        gender,
        kelas,
        nisn: nisn.trim() || undefined,
        phone: phone.trim() || undefined,
        parentName: parentName.trim() || undefined,
        birthPlaceDate: birthPlaceDate.trim() || undefined,
        address: address.trim() || undefined,
      });

      setRegisteredSuccess({
        registrationNumber: res.registrationNumber,
        name: name.trim(),
        username: username.trim(),
        kelas,
        registeredAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengirim formulir pendaftaran. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status lookup
  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusQuery.trim()) return;

    setCheckingStatus(true);
    setStatusResult(null);
    try {
      const res = await api.checkRegistrationStatus(statusQuery.trim());
      setStatusResult(res);
    } catch (err: any) {
      setStatusResult({
        found: false,
        message: err.message || 'Gagal memeriksa status. Periksa jaringan Anda.',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyRegistrationNumber = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedReg(true);
    setTimeout(() => setCopiedReg(false), 2000);
  };

  const handlePrintProof = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-800 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/assets/tamvesta_mascot.jpg"
                alt="Logo TAMVESTA"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl font-black text-white tracking-tight">
                  YUKTAM!
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Pendaftaran 2026/2027
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Yuk Tamansiswa! Portal Pendaftaran Siswa Baru Perguruan Tamansiswa Batam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>YUKTAM! — Portal Resmi Pendaftaran Siswa Baru</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Selamat Datang di YUKTAM!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Yuk Tamansiswa! Daftarkan diri Anda atau putra/putri Anda secara langsung melalui portal resmi <strong>YUKTAM!</strong>. Data pendaftaran akan otomatis masuk ke sistem sekolah dan menunggu proses verifikasi (ACC) dari Bagian Tata Usaha / Admin.
          </p>
        </div>

        {/* 3 Step Flow Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white">Isi Formulir Lengkap</p>
              <p className="text-[11px] text-slate-400">Lengkapi biodata, kelas pilihan, dan username akun</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">Menunggu ACC Sekolah</p>
              <p className="text-[11px] text-slate-400">Data otomatis tercatat, Tata Usaha memverifikasi pendaftaran</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center font-black text-sm shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white">Akun Aktif & Masuk</p>
              <p className="text-[11px] text-slate-400">Setelah di-ACC, langsung bisa login ke aplikasi TAMVESTA</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'form'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Formulir Pendaftaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Cek Status Pendaftaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'info'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Informasi & Bantuan</span>
          </button>
        </div>

        {/* TAB 1: FORM PENDAFTARAN */}
        {activeTab === 'form' && (
          <div>
            {registeredSuccess ? (
              /* Kartu Bukti Pendaftaran Berhasil */
              <div className="bg-slate-800/80 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Pendaftaran Berhasil Terkirim
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        Tanda Bukti Pendaftaran Siswa
                      </h2>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold self-start sm:self-auto">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>STATUS: MENUNGGU ACC ADMIN / TU</span>
                  </div>
                </div>

                {/* Detail Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Nomor Registrasi Resmi
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                        {registeredSuccess.registrationNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyRegistrationNumber(registeredSuccess.registrationNumber)}
                        className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 font-semibold transition"
                      >
                        {copiedReg ? 'Tersalin!' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Nama Calon Siswa
                    </span>
                    <p className="text-base font-bold text-white mt-1">
                      {registeredSuccess.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Username Akun Login
                    </span>
                    <p className="text-sm font-mono font-semibold text-slate-200 mt-1">
                      @{registeredSuccess.username}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Pilihan Jenjang / Kelas
                    </span>
                    <p className="text-sm font-semibold text-emerald-300 mt-1">
                      {registeredSuccess.kelas}
                    </p>
                  </div>
                </div>

                {/* Notice Info */}
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200 leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Pemberitahuan Penting:</p>
                    <p className="mt-1">
                      Data pendaftaran Anda telah otomatis masuk ke database pusat Perguruan Tamansiswa Batam. Saat ini akun Anda berada dalam tahap <strong>Menunggu Persetujuan (ACC)</strong> oleh Bagian Tata Usaha / Administrator. Akun baru dapat digunakan untuk login ke aplikasi TAMVESTA setelah disetujui secara resmi.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrintProof}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Bukti Pendaftaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusQuery(registeredSuccess.registrationNumber);
                      setActiveTab('status');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>Cek Status Pendaftaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegisteredSuccess(null);
                      setName('');
                      setUsername('');
                      setPassword('');
                      setConfirmPassword('');
                      setPhone('');
                      setNisn('');
                      setParentName('');
                      setBirthPlaceDate('');
                      setAddress('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition"
                  >
                    <span>Daftarkan Siswa Lain</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Formulir Pendaftaran */
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="border-b border-slate-700/80 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      YUKTAM! ONLINE
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    Formulir Pendaftaran Siswa Baru — YUKTAM!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan isi seluruh formulir berikut dengan data yang valid dan benar.
                  </p>
                </div>

                {formError && (
                  <div className="mb-6 p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  {/* SEKSI 1: BIODATA CALON SISWA */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Biodata Calon Siswa
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nama Lengkap Calon Siswa <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Contoh: Dimas Pratama Putra"
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          NISN (Nomor Induk Siswa Nasional)
                        </label>
                        <input
                          type="text"
                          value={nisn}
                          onChange={(e) => setNisn(e.target.value)}
                          placeholder="Nomor NISN (opsional)"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Jenis Kelamin <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Pilihan Jenjang & Kelas <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={kelas}
                          onChange={(e) => setKelas(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <optgroup label="Tingkat SD (Sekolah Dasar)">
                            <option value="Kelas 1">Kelas 1 SD</option>
                            <option value="Kelas 2">Kelas 2 SD</option>
                            <option value="Kelas 3">Kelas 3 SD</option>
                            <option value="Kelas 4">Kelas 4 SD</option>
                            <option value="Kelas 5">Kelas 5 SD</option>
                            <option value="Kelas 6">Kelas 6 SD</option>
                          </optgroup>
                          <optgroup label="Tingkat SMP (Sekolah Menengah Pertama)">
                            <option value="Kelas 7">Kelas 7 SMP</option>
                            <option value="Kelas 8">Kelas 8 SMP</option>
                            <option value="Kelas 9">Kelas 9 SMP</option>
                          </optgroup>
                          <optgroup label="Tingkat SMA / SMK (Kejuruan)">
                            <option value="Kelas 10 RPL">Kelas 10 RPL (Rekayasa Perangkat Lunak)</option>
                            <option value="Kelas 10 TKJ">Kelas 10 TKJ (Teknik Komputer Jaringan)</option>
                            <option value="Kelas 10 Bisnis">Kelas 10 Bisnis Daring & Pemasaran</option>
                            <option value="Kelas 10 Akuntansi">Kelas 10 Akuntansi</option>
                            <option value="Kelas 11 RPL">Kelas 11 RPL</option>
                            <option value="Kelas 11 TKJ">Kelas 11 TKJ</option>
                            <option value="Kelas 12 RPL">Kelas 12 RPL</option>
                            <option value="Kelas 12 TKJ">Kelas 12 TKJ</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tempat & Tanggal Lahir
                        </label>
                        <input
                          type="text"
                          value={birthPlaceDate}
                          onChange={(e) => setBirthPlaceDate(e.target.value)}
                          placeholder="Contoh: Batam, 15 Mei 2011"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Alamat Tinggal di Batam
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Contoh: Perumahan Tamansiswa Blok B No 12"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEKSI 2: KONTAK & INFORMASI WHATSAPP */}
                  <div className="space-y-4 pt-4 border-t border-slate-700/80">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> Kontak WhatsApp & Data Orang Tua
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Masukkan kontak WhatsApp aktif untuk konfirmasi pendaftaran oleh pihak sekolah.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nomor WhatsApp / HP Aktif <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Contoh: 081234567890 (WhatsApp Siswa / Wali)"
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Digunakan sekolah untuk pemberitahuan status ACC</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nama Orang Tua / Wali (Opsional)
                        </label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="Nama Ayah / Ibu / Wali Siswa"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Dapat diisi nama orang tua atau wali</span>
                      </div>
                    </div>
                  </div>

                  {/* SEKSI 3: AKUN APLIKASI TAMVESTA */}
                  <div className="space-y-4 pt-4 border-t border-slate-700/80">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Akun Login Aplikasi TAMVESTA
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Akun ini akan langsung aktif setelah disetujui (di-ACC) oleh pihak sekolah.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Username Akun Siswa <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">@</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                            placeholder="dimas.pratama"
                            required
                            className="w-full px-3.5 py-2.5 pl-7 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Gunakan huruf kecil tanpa spasi</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Password Akun <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            required
                            minLength={6}
                            className="w-full px-3.5 py-2.5 pr-9 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Konfirmasi Password <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password"
                          required
                          minLength={6}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-700/80">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer transition"
                    >
                      {loading ? (
                        <span>Mendaftarkan Calon Siswa...</span>
                      ) : (
                        <>
                          <span>Kirim Pendaftaran Siswa Baru</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-500 mt-2">
                      Dengan mengirimkan formulir, calon siswa menyetujui ketentuan dan proses verifikasi sekolah.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CEK STATUS PENDAFTARAN */}
        {activeTab === 'status' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-700/80 pb-4">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Live Status Tracker Pendaftaran YUKTAM!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ketik Nomor Registrasi (misal: REG-2026-XXXX), Username akun, atau Nomor WhatsApp untuk mengecek status ACC Anda di portal YUKTAM!.
              </p>
            </div>

            <form onSubmit={handleCheckStatus} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="Ketik Nomor Registrasi / Username / No HP..."
                  required
                  className="w-full px-3.5 py-2.5 pl-10 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={checkingStatus}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {checkingStatus ? 'Memeriksa...' : 'Cari Status'}
              </button>
            </form>

            {statusResult && (
              <div className="animate-in fade-in pt-2">
                {statusResult.found && statusResult.user ? (
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Hasil Pengecekan</span>
                        <h3 className="text-lg font-black text-white">{statusResult.user.name}</h3>
                      </div>

                      {statusResult.user.status === 'approved' || statusResult.user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>TELAH DI-ACC (DITERIMA & AKTIF)</span>
                        </span>
                      ) : statusResult.user.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>BELUM DAPAT DISETUJUI / DITOLAK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>MENUNGGU PERSETUJUAN (ACC SEKOLAH)</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-800/60 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">No. Registrasi</span>
                        <span className="font-mono font-bold text-emerald-400 mt-0.5 block">{statusResult.user.registrationNumber}</span>
                      </div>

                      <div className="bg-slate-800/60 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Username</span>
                        <span className="font-mono font-bold text-slate-200 mt-0.5 block">@{statusResult.user.username}</span>
                      </div>

                      <div className="bg-slate-800/60 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Pilihan Kelas</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{statusResult.user.kelas}</span>
                      </div>

                      <div className="bg-slate-800/60 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Status Akun</span>
                        <span className={`font-bold mt-0.5 block ${statusResult.user.isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {statusResult.user.isActive ? 'Aktif' : 'Menunggu ACC'}
                        </span>
                      </div>
                    </div>

                    {statusResult.user.isActive || statusResult.user.status === 'approved' ? (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-emerald-300">
                          <p className="font-bold">Selamat! Pendaftaran Anda telah disetujui (ACC).</p>
                          <p className="text-[11px] text-emerald-400/80 mt-0.5">
                            Akun Anda sudah aktif. Silakan masuk ke aplikasi TAMVESTA menggunakan username dan password Anda.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onLoginWithCredentials && statusResult.user) {
                              onLoginWithCredentials(statusResult.user.username);
                            } else {
                              onBackToLogin();
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition shrink-0 cursor-pointer"
                        >
                          Masuk Sekarang ke TAMVESTA
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                        <p className="font-bold text-amber-300">Status Saat Ini: Menunggu Verifikasi Sekolah</p>
                        <p className="mt-1 leading-relaxed text-[11px]">
                          Pendaftaran Anda sudah tersimpan di sistem. Bagian Tata Usaha Perguruan Tamansiswa Batam sedang meninjau data Anda. Silakan cek halaman ini secara berkala.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-900 border border-slate-700 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">{statusResult.message || 'Data pendaftaran tidak ditemukan.'}</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Pastikan nomor registrasi (contoh: REG-2026-12345) atau username yang Anda masukkan sudah sesuai saat mengisi formulir.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INFORMASI & BANTUAN YUKTAM! */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" /> Syarat & Ketentuan Pendaftaran YUKTAM!
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                <li>Mengisi data calon siswa secara lengkap dan benar sesuai identitas resmi (Akta Kelahiran / Kartu Keluarga).</li>
                <li>Menyertakan nomor WhatsApp atau HP yang aktif agar bagian Tata Usaha dapat menghubungi jika diperlukan konfirmasi.</li>
                <li>Setiap calon siswa membuat username dan password yang nantinya akan digunakan untuk mengakses portal akademik TAMVESTA.</li>
                <li>Setelah pendaftaran berhasil dikirim, akun akan berstatus <strong>Menunggu Persetujuan (ACC)</strong> dan akan diproses dalam waktu 1x24 jam kerja.</li>
              </ul>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" /> Kontak Tata Usaha & Informasi
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lokasi Kampus:</strong>
                    <p className="text-slate-400">Kompleks Perguruan Tamansiswa Batam, Kepulauan Riau</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Layanan Informasi Tata Usaha:</strong>
                    <p className="text-slate-400">Senin - Sabtu: 07.30 - 15.30 WIB</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Layanan Digital TAMVESTA:</strong>
                    <p className="text-slate-400">Tersedia online 24 jam untuk pendaftaran & absensi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Perguruan Tamansiswa Batam. Seluruh hak cipta dilindungi.</p>
        <p className="text-[11px] text-slate-600 mt-1">YUKTAM! • Portal Pendaftaran Resmi Perguruan Tamansiswa Batam</p>
      </footer>
    </div>
  );
};
