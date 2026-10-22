import React, { useState } from 'react';
import {
  LogOut,
  Key,
  QrCode,
  ScanLine,
  User as UserIcon,
  Shield,
  School,
  Menu,
  X,
  BookOpen,
  Library,
  Bell,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { StudentProfileModal } from './StudentProfileModal.tsx';

interface Props {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab = 'mapel', onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!user) return null;

  const userRole = (user.role || 'siswa').toLowerCase();

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'ADMINISTRATOR', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    guru: { label: 'GURU PENGAMPU', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    siswa: { label: 'SISWA', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    kepala_sekolah: { label: 'KEPALA SEKOLAH', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    panitia: { label: 'PANITIA OSIS', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    tata_usaha: { label: 'TATA USAHA', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  };

  const badge = roleLabels[userRole] || {
    label: (userRole || 'PENGGUNA').toUpperCase(),
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const handleNav = (tab: string) => {
    if (tab === 'profil') {
      setIsProfileModalOpen(true);
      setMobileMenuOpen(false);
      return;
    }
    if (onNavigate) onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div
            onClick={() => handleNav(user.role === 'siswa' ? 'mapel' : 'dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform border border-emerald-600/30 bg-emerald-700 flex items-center justify-center">
              <img
                src="/assets/aistudio/tamvesta_apk_12aad39c.jpeg"
                alt="Logo TAMVESTA"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition">
                  TAMVESTA
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hidden xs:inline-block">
                  BATAM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                Perguruan Tamansiswa
              </p>
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            {user.role === 'siswa' && (
              <>
                <button
                  onClick={() => handleNav('mapel')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'mapel'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Mata Pelajaran</span>
                </button>

                <button
                  onClick={() => handleNav('perpustakaan')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'perpustakaan'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  <span>Perpustakaan Digital</span>
                </button>

                <button
                  onClick={() => handleNav('pengumuman')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'pengumuman'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Pengumuman</span>
                </button>

                <button
                  onClick={() => handleNav('quiz')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'quiz'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Kuis & Ujian (Token)</span>
                </button>
              </>
            )}

            {(user.role === 'admin' || user.role === 'kepala_sekolah') && (
              <>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Dashboard Admin</span>
                </button>

                <button
                  onClick={() => handleNav('scanner')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'scanner'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scanner QR Absensi</span>
                </button>
              </>
            )}

            {user.role === 'guru' && (
              <>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Manajemen Quiz</span>
                </button>

                <button
                  onClick={() => handleNav('scanner')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    currentTab === 'scanner'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scanner QR</span>
                </button>
              </>
            )}

            {user.role === 'panitia' && (
              <button
                onClick={() => handleNav('scanner')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'scanner'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                <span>Scanner Absensi Laptop</span>
              </button>
            )}
          </div>

          {/* Right User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profil Saya Button */}
            <button
              onClick={() => handleNav('profil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                currentTab === 'profil'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <UserIcon className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Profil & QR</span>
            </button>

            {/* Role badge */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
                {user.name}
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-bold transition"
              title="Keluar dari Aplikasi"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between mb-3 border border-slate-100">
            <div>
              <p className="font-bold text-xs text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">@{user.username}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          {user.role === 'siswa' && (
            <>
              <button
                onClick={() => handleNav('mapel')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'mapel' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Halaman Mata Pelajaran</span>
              </button>

              <button
                onClick={() => handleNav('perpustakaan')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'perpustakaan' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>2. Halaman Perpustakaan Digital</span>
              </button>

              <button
                onClick={() => handleNav('pengumuman')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'pengumuman' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>3. Halaman Pengumuman</span>
              </button>

              <button
                onClick={() => handleNav('quiz')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'quiz' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>4. Halaman Quiz (Dengan Token)</span>
              </button>
            </>
          )}

          {(user.role === 'admin' || user.role === 'kepala_sekolah') && (
            <>
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Dashboard Admin</span>
              </button>

              <button
                onClick={() => handleNav('scanner')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'scanner' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                <span>Scanner QR Absensi Laptop</span>
              </button>
            </>
          )}

          {user.role === 'guru' && (
            <>
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Manajemen Quiz Guru</span>
              </button>

              <button
                onClick={() => handleNav('scanner')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'scanner' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                <span>Scanner QR</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleNav('profil')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              currentTab === 'profil' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4 text-emerald-600" />
            <span>Halaman Profil Saya & QR</span>
          </button>
        </div>
      )}

      {/* Global Student Profile & QR Modal */}
      <StudentProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
