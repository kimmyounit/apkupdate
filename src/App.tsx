import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Login } from './pages/Login.tsx';
import { Navbar } from './components/Navbar.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.tsx';
import { PrincipalDashboard } from './pages/principal/PrincipalDashboard.tsx';
import { TuDashboard } from './pages/tu/TuDashboard.tsx';
import { ScannerPage } from './pages/attendance/ScannerPage.tsx';
import { PasswordChangeModal } from './components/PasswordChangeModal.tsx';
import { WelcomeAnimation } from './components/WelcomeAnimation.tsx';
import { School } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
            <School className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Terjadi Kendala Memuat Tampilan</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            {this.state.error?.message || 'Sistem mendeteksi kendala pada antarmuka pengguna.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                try {
                  sessionStorage.clear();
                } catch (_) {}
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('tamvesta_auth_token');
                  sessionStorage.clear();
                } catch (_) {}
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading, mustChangePassword } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner'>('dashboard');
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('tamvesta_welcome_shown') !== 'true';
    } catch (_) {
      return false;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 animate-bounce">
          <School className="w-8 h-8 text-amber-300" />
        </div>
        <h2 className="text-xl font-black text-white mt-4 tracking-tight">TAMVESTA</h2>
        <p className="text-xs text-emerald-400 font-medium">Perguruan Tamansiswa Batam</p>
        <p className="text-xs text-slate-500 mt-2">Memuat data sistem sekolah...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Safe normalized user role
  const userRole = (user.role || 'siswa').toLowerCase();

  // Welcome animation gate right after login
  if (showWelcome) {
    return (
      <WelcomeAnimation
        name={user.name || 'Pengguna'}
        onFinish={() => {
          try {
            sessionStorage.setItem('tamvesta_welcome_shown', 'true');
          } catch (_) {}
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Global Navigation */}
      <Navbar
        currentTab={currentView}
        onNavigate={(tab) => {
          if (tab === 'scanner') setCurrentView('scanner');
          else setCurrentView('dashboard');
        }}
      />

      {/* Mandatory Password Change Gate for First Login (Kecuali Akun Admin) */}
      {mustChangePassword && userRole !== 'admin' && (
        <PasswordChangeModal
          isOpen={true}
          isMandatory={true}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {currentView === 'scanner' ? (
          <ScannerPage onBackToDashboard={() => setCurrentView('dashboard')} />
        ) : (
          <ErrorBoundary>
            {userRole === 'admin' && (
              <AdminDashboard onOpenScanner={() => setCurrentView('scanner')} />
            )}

            {userRole === 'guru' && (
              <TeacherDashboard onOpenScanner={() => setCurrentView('scanner')} />
            )}

            {userRole === 'siswa' && <StudentDashboard />}

            {userRole === 'panitia' && (
              <ScannerPage onBackToDashboard={() => setCurrentView('dashboard')} />
            )}

            {userRole === 'tata_usaha' && <TuDashboard />}

            {userRole === 'kepala_sekolah' && (
              <PrincipalDashboard onOpenScanner={() => setCurrentView('scanner')} />
            )}

            {!['admin', 'guru', 'siswa', 'panitia', 'tata_usaha', 'kepala_sekolah'].includes(userRole) && (
              <StudentDashboard />
            )}
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
