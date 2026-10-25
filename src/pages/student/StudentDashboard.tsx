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
import { playQuizExitAlertSound } from '../../lib/audio.ts';

export type StudentViewTab = StudentNavTab | 'announcements' | 'subjects' | 'library';

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudentViewTab>('home');
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [quizWarningNotice, setQuizWarningNotice] = useState<string | null>(null);

  const isNavTab = (tab: StudentViewTab): tab is StudentNavTab => {
    return ['home', 'articles', 'quiz', 'archive', 'qr', 'profile'].includes(tab);
  };

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
          />
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
      <StudentBottomNav
        activeTab={isNavTab(activeTab) ? activeTab : 'home'}
        onTabChange={handleTabChange}
        isQuizActive={isQuizActive}
      />
    </div>
  );
};
