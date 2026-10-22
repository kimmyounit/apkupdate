import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  AlertCircle,
  Megaphone,
  BookOpen,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import type { AppNotification } from '../types/index.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAnnouncement?: (id?: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToQuiz?: () => void;
  onRefreshUnreadCount?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAnnouncement,
  onNavigateToSubjects,
  onNavigateToQuiz,
  onRefreshUnreadCount,
}) => {
  const [notifications, setNotifications] = useState<(AppNotification & { isRead: boolean })[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      if (onRefreshUnreadCount) onRefreshUnreadCount();
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    try {
      await api.markNotificationRead(notifId);
      if (onRefreshUnreadCount) onRefreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsRead();
      if (onRefreshUnreadCount) onRefreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    try {
      await api.deleteNotification(notifId);
      if (onRefreshUnreadCount) onRefreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickItem = (notif: AppNotification & { isRead: boolean }) => {
    if (!notif.isRead) {
      handleMarkRead(notif.id);
    }

    if (notif.linkType === 'announcement') {
      onClose();
      if (onNavigateToAnnouncement) onNavigateToAnnouncement(notif.linkId);
    } else if (notif.linkType === 'subject') {
      onClose();
      if (onNavigateToSubjects) onNavigateToSubjects();
    } else if (notif.linkType === 'quiz') {
      onClose();
      if (onNavigateToQuiz) onNavigateToQuiz();
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${mins}m lalu`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}j lalu`;
      const days = Math.floor(hours / 24);
      return `${days} hari lalu`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base">Notifikasi Sekolah</h2>
              <p className="text-[11px] text-teal-100">
                {unreadCount > 0
                  ? `${unreadCount} notifikasi belum dibaca`
                  : 'Semua notifikasi telah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Bulk Actions Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'unread'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2" />
              Memuat notifikasi...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Tidak ada notifikasi saat ini</p>
              <p className="text-[11px] text-slate-400">
                Pemberitahuan pengumuman dan jadwal baru akan muncul di sini.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-start gap-3 group relative ${
                    isUnread
                      ? 'bg-emerald-50/70 border border-emerald-200/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Icon Indicator */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'announcement'
                        ? 'bg-amber-100 text-amber-700'
                        : notif.type === 'subject_change'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {notif.type === 'announcement' ? (
                      <Megaphone className="w-4 h-4" />
                    ) : notif.type === 'subject_change' ? (
                      <BookOpen className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      {notif.isImportant && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-black text-[9px] uppercase tracking-wide">
                          Penting
                        </span>
                      )}
                      <h4
                        className={`text-xs truncate ${
                          isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Delete Action button */}
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteNotif(e, notif.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus dari daftar notifikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
