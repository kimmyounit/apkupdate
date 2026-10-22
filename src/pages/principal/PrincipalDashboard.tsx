import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  ScanLine,
  Search,
  Key,
  Copy,
  ExternalLink,
  ShieldCheck,
  Shield,
  Sparkles,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  Filter,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  School,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type {
  User,
  AttendanceEvent,
  TeacherArticle,
  TuitionTransaction,
  Subject,
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const PrincipalDashboard: React.FC<{ onOpenScanner: () => void }> = ({ onOpenScanner }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'articles' | 'finance'>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [articles, setArticles] = useState<TeacherArticle[]>([]);
  const [transactions, setTransactions] = useState<TuitionTransaction[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Teacher management state
  const [teacherSearch, setTeacherSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Article filter state
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('semua');
  const [selectedArticle, setSelectedArticle] = useState<TeacherArticle | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [staffList, studentList, attEvents, artList, trxList, subjList] = await Promise.all([
        api.getStaff(),
        api.getStudents(),
        api.getAttendanceEvents(),
        api.getArticles(),
        api.getTuitionTransactions(),
        api.getSubjects(),
      ]);

      setTeachers(staffList);
      setStudents(studentList);
      setAttendanceEvents(attEvents);
      setArticles(artList);
      setTransactions(trxList);
      setSubjects(subjList);
    } catch (err: any) {
      console.error('Failed to load Principal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleVerified = async (teacher: User) => {
    try {
      const res = await api.toggleVerified(teacher.id);
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? { ...t, isVerified: res.isVerified } : t))
      );
      setActionSuccess(`Status centang biru ${teacher.name} diubah menjadi ${res.isVerified ? 'Terverifikasi' : 'Biasa'}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal mengubah status verifikasi.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleResetPassword = async (teacher: User) => {
    if (!confirm(`Reset kata sandi ${teacher.name} ke password awal resmi sistem?`)) return;
    try {
      const res = await api.resetStaffToInitialPassword(teacher.id);
      setActionSuccess(res.message || `Password ${teacher.name} berhasil direset ke password awal.`);
      await loadAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal mereset kata sandi.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      (t.jabatan && t.jabatan.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const activeStudents = students.filter((s) => !s.isAlumni);
  const alumniStudents = students.filter((s) => s.isAlumni);
  const totalIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceEvents.filter((ev) => (ev.timestamp || ev.createdAt || '').startsWith(todayStr));
  const attendedCount = todayAttendance.length;
  const attendanceRate = activeStudents.length > 0 ? Math.round((attendedCount / activeStudents.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner Utama Kepala Sekolah */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold tracking-wide">
              <School className="w-4 h-4 text-purple-300" />
              <span>DASHBOARD KEPALA SEKOLAH — TAMVESTA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Komando & Pengawasan Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Selamat datang, <strong>{user?.name || 'Kepala Sekolah'}</strong>. Pantau performa akademik, kehadiran harian siswa, tata kelola akun guru, dan rekapitulasi operasional Perguruan Tamansiswa Batam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition active:scale-95 border border-purple-400/40"
            >
              <ScanLine className="w-4 h-4 text-amber-300" />
              <span>Buka Scanner QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Pengawasan Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Kelola Akun Guru ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'articles'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Artikel & Metode Pembelajaran ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'finance'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pengawasan Keuangan TU</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center justify-between gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-2 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW PENGAWASAN SEKOLAH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Ringkasan Statistik Eksekutif */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Siswa Aktif</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">{activeStudents.length}</div>
              <div className="text-[11px] text-slate-500">
                Alumni tercatat: <strong className="text-slate-700">{alumniStudents.length}</strong>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Guru & Staf</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <GraduationCap className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900">{teachers.length}</div>
              <div className="text-[11px] text-slate-500">
                Pendidik aktif Tamansiswa Batam
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Kehadiran Hari Ini</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-800">{attendedCount} Siswa</div>
              <div className="text-[11px] text-emerald-600 font-bold">
                Tingkat kehadiran: {attendanceRate}%
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Artikel Pendidik</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <BookOpen className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-900">{articles.length}</div>
              <div className="text-[11px] text-slate-500">
                {articles.filter((a) => a.isPublished).length} telah terbit ke siswa
              </div>
            </div>
          </div>

          {/* Pengawasan Kehadiran Terkini */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-700" />
                  <span>Log Kehadiran & Pengawasan Real-Time Siswa</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Catatan absensi siswa terkini via scanner QR Code dan pencatatan kelas
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                {attendanceEvents.length} Riwayat Absensi
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Waktu / Tanggal</th>
                    <th className="p-3.5 text-center">Tipe Absensi</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {attendanceEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada data rekaman absensi hari ini.
                      </td>
                    </tr>
                  ) : (
                    attendanceEvents.slice(0, 15).map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">{ev.studentName || ev.name}</td>
                        <td className="p-3.5 text-slate-700">{ev.studentKelas || '-'}</td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {new Date(ev.timestamp || ev.createdAt || Date.now()).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {ev.type === 'masuk' ? 'Presensi Masuk' : (ev.type || 'Presensi')}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Hadir (Tepat Waktu)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGELOLAAN AKUN GURU (KEPALA SEKOLAH) */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-700" />
                  <span>Daftar Guru & Tenaga Kependidikan Tamansiswa Batam</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Wewenang Kepala Sekolah: Verifikasi centang biru, pengawasan kredensial, dan supervisi pendidik
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Cari nama guru, username, jabatan..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nama Guru</th>
                    <th className="p-3.5">Jabatan / Mapel</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Password Awal</th>
                    <th className="p-3.5 text-center">Centang Biru</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Aksi Pimpinan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada guru yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((tch, idx) => {
                      const isRevealed = !!revealedPasswords[tch.id];
                      const displayPass = tch.initialPassword || 'GuruTamvesta123';

                      return (
                        <tr key={tch.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tch.name}</span>
                              {tch.isVerified && (
                                <span className="inline-flex items-center text-blue-600" title="Akun Resmi Terverifikasi">
                                  <ShieldCheck className="w-4 h-4 fill-blue-600 text-white" />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">ID: {tch.id}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {tch.jabatan || 'Guru Pengampu'}
                          </td>
                          <td className="p-3.5">
                            <code className="font-mono text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                              {tch.username}
                            </code>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {isRevealed ? displayPass : '••••••••••••'}
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({
                                    ...prev,
                                    [tch.id]: !prev[tch.id],
                                  }))
                                }
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition"
                                title={isRevealed ? 'Sembunyikan' : 'Lihat'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleVerified(tch)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition inline-flex items-center gap-1 ${
                                tch.isVerified
                                  ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Klik untuk mengubah centang biru resmi"
                            >
                              <ShieldCheck className={`w-3.5 h-3.5 ${tch.isVerified ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span>{tch.isVerified ? 'VERIFIED' : 'BELUM'}</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleResetPassword(tch)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                title="Reset sandi guru ke sandi resmi pimpinan"
                              >
                                <Key className="w-3 h-3 text-amber-600" />
                                <span>Reset Sandi</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ARTIKEL & METODE PEMBELAJARAN GURU */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-700" />
                  <span>Karya Tulis & Metode Pembelajaran Guru</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Pengawasan artikel dan metode pembelajaran yang diterbitkan guru untuk konsumsi siswa
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setArticleCategoryFilter('semua')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    articleCategoryFilter === 'semua'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setArticleCategoryFilter('Artikel Guru')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    articleCategoryFilter === 'Artikel Guru'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Artikel Guru
                </button>
                <button
                  onClick={() => setArticleCategoryFilter('Metode Pembelajaran')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    articleCategoryFilter === 'Metode Pembelajaran'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Metode Pembelajaran
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles
                .filter((a) => articleCategoryFilter === 'semua' || a.category === articleCategoryFilter)
                .map((art) => (
                  <div
                    key={art.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            art.category === 'Metode Pembelajaran'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {art.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            art.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {art.isPublished ? 'Terbit ke Siswa' : 'Draf'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{art.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-3">{art.summary}</p>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <span>{art.authorName}</span>
                      </div>
                      <button
                        onClick={() => setSelectedArticle(art)}
                        className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Baca Penuh</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAPITULASI KEUANGAN TU */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                  <span>Pengawasan Arus Kas & Laporan Finansial Tata Usaha</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan transaksi penerimaan SPP dan pengeluaran operasional Tamansiswa Batam
                </p>
              </div>

              <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-right">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Total Pemasukan Kas</span>
                <span className="text-base font-black text-emerald-800">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Kategori / Keterangan</th>
                    <th className="p-3.5">Siswa / Pihak Terkait</th>
                    <th className="p-3.5">Metode</th>
                    <th className="p-3.5 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada riwayat transaksi finansial tercatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 15).map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono text-slate-500">
                          {new Date(trx.createdAt || trx.verifiedAt || Date.now()).toLocaleDateString('id-ID')}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900">{trx.category}</span>
                          {trx.notes && <p className="text-[10px] text-slate-400">{trx.notes}</p>}
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {trx.studentName ? `${trx.studentName} (${trx.studentKelas || '-'})` : '-'}
                        </td>
                        <td className="p-3.5 text-slate-600 uppercase font-mono text-[10px]">
                          {trx.paymentMethod || 'Tunai'}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-700">
                          + Rp {trx.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reader Modal for Article */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">{selectedArticle.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>Penulis: <strong>{selectedArticle.authorName}</strong></span>
                <span>•</span>
                <span>{new Date(selectedArticle.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {selectedArticle.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
