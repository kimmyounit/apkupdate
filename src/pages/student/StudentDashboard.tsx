import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StudentBottomNav, type StudentNavTab } from '../../components/StudentBottomNav.tsx';
import { StudentFeedPage } from './StudentFeedPage.tsx';
import { StudentArticlesPage } from './StudentArticlesPage.tsx';
import { QuizPage } from './QuizPage.tsx';
import { ArchiveNotesPage } from './ArchiveNotesPage.tsx';
import { StudentQrPage } from './StudentQrPage.tsx';
import { ProfilePage } from '../profile/ProfilePage.tsx';
import { AnnouncementsPage } from './AnnouncementsPage.tsx';
import { SubjectsPage } from './SubjectsPage.tsx';
import { LibraryPage } from './LibraryPage.tsx';
import { GamesPage } from '../games/GamesPage.tsx';
import { DirectMessagesPage } from '../dm/DirectMessagesPage.tsx';
import { SchoolReportsPage } from '../reports/SchoolReportsPage.tsx';
import { StudentContactModal } from '../../components/StudentContactModal.tsx';
import { playQuizExitAlertSound } from '../../lib/audio.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export type StudentViewTab = StudentNavTab | 'articles' | 'announcements' | 'subjects' | 'library' | 'games' | 'dm' | 'reports';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentViewTab>('home');
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [quizWarningNotice, setQuizWarningNotice] = useState<string | null>(null);

  // Prompt contact info (Nomor HP & Gmail) saat pertama kali login jika belum terisi
  const [showContactModal, setShowContactModal] = useState<boolean>(() => {
    if (user?.role === 'siswa') {
      const hasPhone = Boolean(user.phone && user.phone.trim().length >= 9);
      const hasEmail = Boolean(user.email && user.email.includes('@'));
      return !hasPhone || !hasEmail;
    }
    return false;
  });

  const isNavTab = (tab: StudentViewTab): tab is StudentNavTab => {
    return ['home', 'quiz', 'archive', 'games', 'qr', 'profile'].includes(tab as any);
  };

  React.useEffect(() => {
    const handleNavEvent = (e: any) => {
      const tab = e.detail;
      if (tab === 'permainan' || tab === 'games') {
        setActiveTab('games');
      } else if (tab === 'mapel') {
        setActiveTab('subjects');
      } else if (tab === 'perpustakaan') {
        setActiveTab('library');
      } else if (tab === 'pengumuman') {
        setActiveTab('announcements');
      } else if (tab === 'quiz') {
        setActiveTab('quiz');
      } else if (tab === 'dm' || tab === 'pesan') {
        setActiveTab('dm');
      } else if (tab === 'reports' || tab === 'laporan' || tab === 'lost_found') {
        setActiveTab('reports');
      } else if (tab === 'articles' || tab === 'artikel') {
        setActiveTab('articles');
      }
    };
    window.addEventListener('tamvesta_navigate', handleNavEvent);
    return () => window.removeEventListener('tamvesta_navigate', handleNavEvent);
  }, []);

  const handleTabChange = (tab: StudentNavTab) => {
    if (isQuizActive) {
      // Sesi kuis sedang aktif! Cegah navigasi keluar dan bunyikan beep keras
      playQuizExitAlertSound();
      setQuizWarningNotice(
        'PERINGATAN UJIAN: Anda sedang mengerjakan kuis aktif! Dilarang keluar atau berpindah halaman sebelum kuis selesai dikerjakan.'
      );
      setTimeout(() => setQuizWarningNotice(null), 4500);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Quiz Exit Attempt Alert Banner */}
      {quizWarningNotice && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-rose-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-rose-300 animate-bounce">
          <AlertTriangle className="w-6 h-6 shrink-0 text-amber-300" />
          <span className="text-xs sm:text-sm font-black leading-snug">{quizWarningNotice}</span>
        </div>
      )}

      {/* Modal Kontak Informasi Siswa (Nomor HP & Gmail saat pertama login) */}
      <StudentContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* SEPARATE PAGES ROUTER */}
      <div className="flex-1 pb-16">
        {activeTab === 'home' && (
          <StudentFeedPage
            onOpenAnnouncements={() => setActiveTab('announcements')}
            onOpenSubjects={() => setActiveTab('subjects')}
            onOpenLibrary={() => setActiveTab('library')}
            onOpenQuiz={() => setActiveTab('quiz')}
            onOpenQr={() => setActiveTab('qr')}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenArticles={() => setActiveTab('articles')}
            onOpenGames={() => setActiveTab('games')}
            onOpenDm={() => setActiveTab('dm')}
            onOpenReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'dm' && (
          <DirectMessagesPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'reports' && (
          <SchoolReportsPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'games' && (
          <GamesPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'articles' && (
          <StudentArticlesPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'quiz' && (
          <QuizPage
            onBackToDashboard={() => {
              setIsQuizActive(false);
              setActiveTab('home');
            }}
            onQuizActiveChange={(active) => setIsQuizActive(active)}
          />
        )}

        {activeTab === 'archive' && <ArchiveNotesPage />}

        {activeTab === 'qr' && <StudentQrPage />}

        {activeTab === 'profile' && <ProfilePage />}

        {activeTab === 'announcements' && (
          <AnnouncementsPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'subjects' && (
          <SubjectsPage onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'library' && (
          <LibraryPage onBack={() => setActiveTab('home')} />
        )}
      </div>

      {/* PERSISTENT BOTTOM NAVIGATION BAR (Home, Artikel, Quiz, Arsip, QR, Profil) */}
      {/* Disembunyikan saat bermain game agar layar bersih, penuh dan kontrol permainan tidak tertutup */}
      {activeTab !== 'games' && (
        <StudentBottomNav
          activeTab={isNavTab(activeTab) ? activeTab : 'home'}
          onTabChange={handleTabChange}
          isQuizActive={isQuizActive}
        />
      )}
    </div>
  );
};
