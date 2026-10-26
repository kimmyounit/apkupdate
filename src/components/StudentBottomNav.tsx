import React from 'react';
import { Home, BookOpen, HelpCircle, Archive, QrCode, User, Lock, Gamepad2 } from 'lucide-react';

export type StudentNavTab = 'home' | 'quiz' | 'archive' | 'games' | 'qr' | 'profile';

interface StudentBottomNavProps {
  activeTab: StudentNavTab;
  onTabChange: (tab: StudentNavTab) => void;
  isQuizActive?: boolean;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  activeTab,
  onTabChange,
  isQuizActive = false,
}) => {
  const navItems = [
    {
      id: 'home' as const,
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'quiz' as const,
      label: 'Quiz',
      icon: HelpCircle,
    },
    {
      id: 'archive' as const,
      label: 'Arsip',
      icon: Archive,
    },
    {
      id: 'games' as const,
      label: 'Game',
      icon: Gamepad2,
    },
    {
      id: 'qr' as const,
      label: 'QR',
      icon: QrCode,
    },
    {
      id: 'profile' as const,
      label: 'Profil',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Student Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pt-2 pb-5 sm:pb-3 px-2 min-h-[68px] sm:min-h-[62px]"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 20px))' }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 select-none relative group ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active Indicator Top Glow */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-xs" />
              )}

              {/* Icon Container with subtle background when active */}
              <div
                className={`w-10 h-7 sm:w-11 sm:h-7.5 flex items-center justify-center rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-emerald-100/90 text-emerald-700 scale-105 shadow-xs'
                    : isQuizActive
                    ? 'text-slate-400 group-hover:scale-105 opacity-60'
                    : 'text-slate-400 group-hover:scale-105'
                }`}
              >
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${
                    isActive ? 'stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {isQuizActive && !isActive && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-1 truncate ${
                  isActive ? 'text-emerald-800 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
