import React, { useState } from 'react';
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

export type StudentViewTab = StudentNavTab | 'announcements' | 'subjects' | 'library';

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudentViewTab>('home');

  const isNavTab = (tab: StudentViewTab): tab is StudentNavTab => {
    return ['home', 'articles', 'quiz', 'archive', 'qr', 'profile'].includes(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          <QuizPage onBackToDashboard={() => setActiveTab('home')} />
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
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};
