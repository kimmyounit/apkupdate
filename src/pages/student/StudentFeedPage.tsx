import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  RefreshCw,
  QrCode,
  UserPlus,
  UserCheck,
  Sparkles,
  School,
  Clock,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Video,
  Award,
  Bell,
  Megaphone,
  BookOpen,
  Library,
  Camera,
  CheckCircle2,
  GraduationCap,
  Maximize2,
  Gamepad2,
  Reply,
  X,
  Menu,
  LogOut,
  HelpCircle,
  ChevronRight,
  User,
  Pin,
  AlertCircle,
  ShieldAlert,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { StudentPost, PostComment, Story } from '../../types/index.ts';
import { CreatePostModal } from '../../components/CreatePostModal.tsx';
import { UserProfileModal } from '../../components/UserProfileModal.tsx';
import { CreateStoryModal } from '../../components/CreateStoryModal.tsx';
import { StoryViewerModal } from '../../components/StoryViewerModal.tsx';
import { NotificationsModal } from '../../components/NotificationsModal.tsx';
import { ImageLightboxModal } from '../../components/ImageLightboxModal.tsx';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';

interface StudentFeedPageProps {
  onOpenAnnouncements?: () => void;
  onOpenSubjects?: () => void;
  onOpenLibrary?: () => void;
  onOpenQuiz?: () => void;
  onOpenQr?: () => void;
  onOpenProfile?: () => void;
  onOpenArticles?: () => void;
  onOpenGames?: () => void;
  onOpenDm?: () => void;
  onOpenReports?: () => void;
}

export const StudentFeedPage: React.FC<StudentFeedPageProps> = ({
  onOpenAnnouncements,
  onOpenSubjects,
  onOpenLibrary,
  onOpenQuiz,
  onOpenQr,
  onOpenProfile,
  onOpenArticles,
  onOpenGames,
  onOpenDm,
  onOpenReports,
}) => {
  const { user, refreshUser, logout } = useAuth();
  const isSupportUser =
    user?.role === 'support' ||
    user?.isDeveloper ||
    user?.username?.toLowerCase() === 'tamvesta' ||
    user?.id === 'user_support_tamvesta';
  const [posts, setPosts] = useState<StudentPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{
    type: 'pending' | 'success' | 'error';
    message: string;
  } | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  // Moderasi Foto Profil Siswa State (Support / Admin)
  const [moderatingUser, setModeratingUser] = useState<{ id: string; name: string; username: string } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  // Modals & Menu
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Post Editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');

  // Comment state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<
    Record<string, { commentId: string; authorName: string; authorUsername: string; authorId: string } | null>
  >({});

  // Lightbox Zoom Image state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  const loadFeedData = async (silent = false) => {
    if (!silent && posts.length === 0) setLoading(true);
    try {
      const [fetchedPosts, fetchedStories, notifs, convs] = await Promise.all([
        api.getPosts(),
        api.getStories().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getDMConversations().catch(() => []),
      ]);
      setPosts((prev) => {
        if (fetchedPosts.length === 0 && prev.length > 0) return prev;
        return fetchedPosts;
      });
      setStories((prev) => {
        if (fetchedStories.length === 0 && prev.length > 0) return prev;
        return fetchedStories;
      });
      setUnreadNotifCount(notifs.filter((n: { isRead: boolean }) => !n.isRead).length);
      if (Array.isArray(convs)) {
        const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadDmCount(totalUnread);
      }
    } catch (err) {
      console.error('Failed to load feed data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedData();

    // Auto-refresh feed dan story setiap 8 detik agar postingan dari akun lain langsung muncul otomatis
    const interval = setInterval(() => {
      loadFeedData(true);
    }, 8000);

    const onFocus = () => loadFeedData(true);
    window.addEventListener('focus', onFocus);

    // Sinyal langsung dari Admin Dashboard (Centang Biru & Perubahan Data)
    try {
      const channel = new BroadcastChannel('tamvesta_admin_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'REFRESH_ALL' || event.data?.userId === user?.id) {
          refreshUser();
          loadFeedData(true);
        }
      };
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
        try { channel.close(); } catch (_) {}
      };
    } catch (_) {
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [user?.id]);

  // 1. Refresh Terhubung ke Admin Dashboard via Backend
  const handleRefresh = async () => {
    if (refreshing) return; // Mencegah pencatatan berulang
    setRefreshing(true);
    setRefreshStatus({
      type: 'pending',
      message: 'Menghubungkan sinyal ke Admin Dashboard...',
    });

    try {
      const [signalRes] = await Promise.all([
        api.sendRefreshSignal({
          userName: user?.name,
          userKelas: user?.kelas,
        }),
        refreshUser(),
        loadFeedData(false),
      ]);

      // Tampilkan status berhasil hanya setelah backend mengonfirmasi penerimaan sinyal
      setRefreshStatus({
        type: 'success',
        message: signalRes?.message || 'Permintaan Refresh Berhasil Diterima Admin!',
      });

      // Siarkan ke channel admin untuk pembaruan instan jika di browser yang sama
      try {
        const syncChannel = new BroadcastChannel('tamvesta_admin_sync');
        syncChannel.postMessage({ type: 'REFRESH_SIGNAL_SENT', user: user?.username });
        syncChannel.close();
      } catch (_) {}

      setTimeout(() => {
        setRefreshStatus(null);
      }, 4000);
    } catch (err: any) {
      setRefreshStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim sinyal ke Admin Dashboard. Coba lagi.',
      });
      setTimeout(() => {
        setRefreshStatus(null);
      }, 4000);
    } finally {
      setRefreshing(false);
    }
  };

  // 2. Konfirmasi Keluar Akun Siswa (Tanpa menghapus data)
  const handleConfirmLogout = () => {
    const isConfirmed = window.confirm(
      'Apakah Anda yakin ingin keluar dari akun TAMVESTA? Data akun Anda tetap aman tersimpan.'
    );
    if (isConfirmed) {
      logout();
    }
  };

  // 3. Sematkan ke Profil / Lepas Sematan (Pinned Post)
  const handleTogglePinPost = async (postId: string) => {
    try {
      const res = await api.togglePinPost(postId);
      const isPinned = res?.post?.isPinned ?? (res as any)?.isPinned;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isPinned } : p))
      );
      await loadFeedData(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status sematan postingan.');
    }
  };

  // 4. Moderasi Foto Profil Siswa oleh Akun Support / Admin
  const handleExecuteAvatarModeration = async () => {
    if (!moderatingUser) return;
    if (!moderationReason.trim()) {
      alert('Mohon masukkan alasan moderasi foto profil.');
      return;
    }
    setIsModerating(true);
    try {
      await api.resetStudentAvatar(moderatingUser.id, moderationReason.trim());
      alert(`Foto profil ${moderatingUser.name} berhasil di-reset ke default TAMVESTA.`);
      setModeratingUser(null);
      setModerationReason('');
      await loadFeedData(true);
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan moderasi foto profil.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likes.includes(user.id);
        const updatedLikes = alreadyLiked
          ? post.likes.filter((id) => id !== user.id)
          : [...post.likes, user.id];
        return { ...post, likes: updatedLikes };
      })
    );

    try {
      await api.toggleLikePost(postId);
    } catch (err) {
      console.error('Like action failed:', err);
      loadFeedData();
    }
  };

  const handleToggleFollow = async (authorId: string) => {
    if (!user || authorId === user.id) return;
    const isCurrentlyFollowing = followingIds.includes(authorId);
    setFollowingIds((prev) =>
      isCurrentlyFollowing ? prev.filter((id) => id !== authorId) : [...prev, authorId]
    );

    try {
      await api.toggleFollow(authorId);
    } catch (err) {
      console.error('Follow action failed:', err);
      setFollowingIds((prev) =>
        isCurrentlyFollowing ? [...prev, authorId] : prev.filter((id) => id !== authorId)
      );
    }
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSendComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;

    const currentReply = replyingTo[postId];
    const replyData = currentReply
      ? {
          replyToCommentId: currentReply.commentId,
          replyToUsername: currentReply.authorUsername,
          replyToAuthorName: currentReply.authorName,
          replyToAuthorId: currentReply.authorId,
        }
      : undefined;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await api.addComment(postId, text, replyData);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            comments: [...(post.comments || []), newComment],
          };
        })
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      try {
        window.dispatchEvent(new CustomEvent('tamvesta_refresh_notifications'));
      } catch (_) {}
    } catch (err: any) {
      alert(err.message || 'Gagal mengirimkan komentar.');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus postingan.');
    }
  };

  const handleStartEditPost = (post: StudentPost) => {
    setEditingPostId(post.id);
    setEditingCaption(post.caption);
  };

  const handleSaveEditPost = async (postId: string) => {
    if (!editingCaption.trim()) return;
    try {
      const updated = await api.updatePost(postId, editingCaption);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setEditingPostId(null);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah postingan.');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await api.deleteStory(storyId);
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus Story.');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSecs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSecs < 60) return 'Baru saja';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}j lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}h lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  // Group stories by author
  const myStories = stories.filter((s) => s.authorId === user?.id);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 sm:space-y-5 pb-32 sm:pb-36">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER UTAMA: SELAMAT DATANG TAMVESTA & HELLO NAMA */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mascot Avatar */}
            <div
              onClick={() => onOpenProfile && onOpenProfile()}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/40 shadow-md shrink-0 bg-slate-900 cursor-pointer hover:scale-105 transition"
            >
              <img
                src={user?.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                alt="Logo Tamvesta"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-0.5 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-200 border border-white/15">
                Selamat Datang di TAMVESTA
              </span>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate flex items-center gap-1.5 flex-wrap">
                <span className="truncate">Hello!, {user?.name || 'Siswa'}</span>
                {user?.isVerified && (
                  <VerifiedBadge
                    size="sm"
                    isDeveloper={user?.role === 'support' || user?.isDeveloper || user?.username?.toLowerCase() === 'tamvesta'}
                  />
                )}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100 flex items-center gap-1.5 truncate">
                <span className="truncate">@{user?.username}</span>
                <span>•</span>
                <span className="font-semibold text-amber-300 truncate">{user?.kelas || 'Tamansiswa Batam'}</span>
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TOMBOL PUSAT KONTROL & MENU GARIS TIGA */}
          {/* ------------------------------------------------------------- */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Cepat Lonceng Pusat Kontrol Notifikasi Siswa */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2.5 sm:p-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 backdrop-blur-md shadow-lg transition flex items-center justify-center group cursor-pointer"
              title="Pusat Kontrol & Notifikasi Siswa"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 group-hover:scale-110 transition shrink-0" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-md animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* TOMBOL GARIS TIGA UTAMA (MENU KEBAWAH: Notifikasi, Refresh, Akun, Keluar) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                className="relative p-2.5 sm:p-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 backdrop-blur-md shadow-lg transition flex items-center justify-center group cursor-pointer"
                title="Menu Garis Tiga Siswa (Notifikasi, Refresh, Akun, Keluar)"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 group-hover:scale-110 transition shrink-0" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-md animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

            {/* DROPDOWN MENU KEBAWAH */}
            {isMenuDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs"
                  onClick={() => setIsMenuDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200/90 z-50 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-3 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Menu TAMVESTA</p>
                      <p className="text-[11px] text-slate-400">@{user?.username} • {user?.kelas || 'Siswa'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMenuDropdownOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. NOTIFIKASI SEKOLAH */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDropdownOpen(false);
                      setIsNotificationsOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-amber-50 text-slate-700 hover:text-amber-900 transition group text-left border border-transparent hover:border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition relative">
                        <Bell className="w-4 h-4" />
                        {unreadNotifCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Notifikasi Sekolah</span>
                        <span className="text-[11px] text-slate-400 block">
                          {unreadNotifCount > 0 ? `${unreadNotifCount} belum dibaca` : 'Lihat semua notifikasi'}
                        </span>
                      </div>
                    </div>
                    {unreadNotifCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                        {unreadNotifCount}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                    )}
                  </button>

                  {/* 2. REFRESH DATA & SINYAL ADMIN */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDropdownOpen(false);
                      handleRefresh();
                    }}
                    disabled={refreshing}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition group text-left border border-transparent hover:border-emerald-200 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Refresh Data</span>
                        <span className="text-[11px] text-slate-400 block">
                          {refreshing ? 'Menyinkronkan data...' : 'Muat ulang & sinyal ke Admin'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* 3. AKUN & PROFIL SISWA */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile();
                      else setSelectedProfileUsername(user?.username || null);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-sky-50 text-slate-700 hover:text-sky-900 transition group text-left border border-transparent hover:border-sky-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-100 text-sky-700 rounded-xl group-hover:scale-105 transition">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Akun & Profil</span>
                        <span className="text-[11px] text-slate-400 block">Biodata, foto & kelas</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* 4. FITUR KELUAR */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuDropdownOpen(false);
                        handleConfirmLogout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-rose-50 text-rose-600 transition group text-left border border-transparent hover:border-rose-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-105 transition">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-bold block text-rose-600">Keluar</span>
                          <span className="text-[11px] text-rose-400 block">Keluar dari akun siswa</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* QUICK SHORTCUT ROW DI BAWAH SAMBUTAN */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/15 w-full">
          {/* Quick Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 transition active:scale-95 disabled:opacity-60 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Menyinkron...' : 'Refresh'}</span>
          </button>

          {/* Quick Garis Tiga Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMenuDropdownOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-amber-200 backdrop-blur-sm border border-white/20 transition active:scale-95 text-xs font-bold relative"
          >
            <Menu className="w-3.5 h-3.5 text-amber-300" />
            <span>Menu Garis Tiga</span>
            {unreadNotifCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                {unreadNotifCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Sinyal Refresh Terhubung ke Admin */}
        {refreshStatus && (
          <div
            className={`mt-3 p-3 rounded-2xl text-xs font-bold flex items-center justify-between border backdrop-blur-md animate-in fade-in transition ${
              refreshStatus.type === 'pending'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                : refreshStatus.type === 'success'
                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-100'
                : 'bg-rose-500/25 border-rose-400/50 text-rose-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {refreshStatus.type === 'pending' ? (
                <RefreshCw className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
              ) : refreshStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              )}
              <span className="leading-snug">{refreshStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setRefreshStatus(null)}
              className="p-1 text-white/80 hover:text-white shrink-0 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Hub Navigation: Pengumuman, Mapel, Perpustakaan, Permainan, Artikel, DM, Laporan */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-white/10 text-white text-xs font-bold">
          <button
            onClick={onOpenAnnouncements}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Pengumuman</span>
          </button>
          <button
            onClick={onOpenSubjects}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Mata Pelajaran</span>
          </button>
          <button
            onClick={onOpenLibrary}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <Library className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">Perpustakaan</span>
          </button>
          <button
            onClick={onOpenGames}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border border-purple-400/40 rounded-xl transition font-black shadow-sm"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-300 shrink-0 animate-pulse" />
            <span className="truncate">Permainan</span>
          </button>
          <button
            onClick={onOpenArticles}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 rounded-xl transition font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Artikel Guru</span>
          </button>
          {/* DM / Pesan tepat di samping menu Artikel */}
          <button
            onClick={onOpenDm}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/30 rounded-xl transition font-bold relative"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">Pesan DM</span>
            {unreadDmCount > 0 && (
              <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                {unreadDmCount}
              </span>
            )}
          </button>
          {/* Laporan Sekolah & Lost and Found */}
          <button
            onClick={onOpenReports}
            className="flex items-center justify-center gap-1.5 py-2 px-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-xl transition font-bold"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">Laporan</span>
          </button>
        </div>
      </div>

      {/* Featured Banner: Permainan Siswa (Who's the Spy & Mafia) */}
      <div
        onClick={onOpenGames}
        className="cursor-pointer group relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border border-indigo-800/40 hover:border-indigo-500/60 transition shadow-lg text-white"
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">
                  Permainan Siswa: Who's the Spy & Mafia
                </span>
                <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.2 rounded-full font-bold">
                  Multiplayer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mainkan bersama teman saat jam istirahat atau jam kosong!
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenGames && onOpenGames();
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow whitespace-nowrap"
          >
            Mainkan
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STORY BAR (24-Hour Expiration Stories) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {/* Add Story Button / My Story */}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
            <div
              onClick={() => {
                if (myStories.length > 0) {
                  setSelectedStoryIndex(stories.findIndex((s) => s.authorId === user?.id));
                  setIsStoryViewerOpen(true);
                } else {
                  setIsCreateStoryOpen(true);
                }
              }}
              className="relative w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-emerald-500"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user?.name || 'Siswa'
                    )}&backgroundColor=0284c7`
                  }
                  alt={user?.name}
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateStoryOpen(true);
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs hover:scale-110 transition"
                title="Tambah Story Baru"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[64px]">
              {myStories.length > 0 ? 'Story Anda' : 'Tambah Story'}
            </span>
          </div>

          {/* Friends' Stories */}
          {(() => {
            const seen = new Set<string>();
            const uniqueStories: Story[] = [];
            stories
              .filter((s) => s.authorId !== user?.id)
              .forEach((s) => {
                if (!seen.has(s.authorId)) {
                  seen.add(s.authorId);
                  uniqueStories.push(s);
                }
              });

            return uniqueStories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  const actualIdx = stories.findIndex((s) => s.id === story.id);
                  setSelectedStoryIndex(actualIdx);
                  setIsStoryViewerOpen(true);
                }}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 animate-in fade-in shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                    <img
                      src={
                        story.authorAvatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          story.authorName
                        )}&backgroundColor=0284c7`
                      }
                      alt={story.authorName}
                      className="w-full h-full rounded-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[64px]">
                  {story.authorName.split(' ')[0]}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. QUICK CREATE POST PROMPT (Disesuaikan untuk Akun Support) */}
      {/* ------------------------------------------------------------- */}
      {isSupportUser ? (
        <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-900 shadow-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/10 border border-slate-900/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-slate-900 fill-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black">Panel Siaran Developer & Support TAMVESTA</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-amber-300 font-black uppercase">
                  Akun Developer Resmi
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-semibold mt-0.5">
                Posting pesan atau pengumuman yang akan langsung masuk ke feed seluruh siswa Tamansiswa Batam.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatePostOpen(true)}
            className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-300 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
            <span>Siarkan Pesan Support</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <img
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                user?.name || 'Siswa'
              )}&backgroundColor=0284c7`
            }
            alt={user?.name}
            className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
          />
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-500 transition font-medium truncate"
          >
            Bagikan cerita atau kegiatan belajarmu hari ini...
          </button>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
            title="Tambah Foto atau Video"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FEED HEADER & REFRESH */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
            Feed Siswa Tamansiswa
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 font-bold transition disabled:opacity-50 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          title="Segarkan sinyal dari admin dashboard dan muat feed terbaru"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{refreshing ? 'Menyinkronkan...' : 'Segarkan Feed & Sinyal Admin'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. POST LIST */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memuat postingan siswa Tamvesta...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Belum Ada Postingan Siswa</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Jadilah yang pertama membagikan cerita belajar atau karya seni di TAMVESTA!
            </p>
          </div>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Postingan Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = user?.id === post.authorId;
            const isLiked = user ? post.likes.includes(user.id) : false;
            const isFollowing = followingIds.includes(post.authorId);
            const isCommentsOpen = !!expandedComments[post.id];
            const isSupportPost =
              post.authorIsDeveloper ||
              (post as any).authorBadgeType === 'developer' ||
              post.authorUsername?.toLowerCase() === 'tamvesta' ||
              post.authorId === 'user_support_tamvesta';

            return (
              <article
                key={post.id}
                className={`rounded-3xl overflow-hidden transition-all duration-200 ${
                  isSupportPost
                    ? 'bg-gradient-to-b from-amber-50/70 via-white to-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-white border border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Official Support Post Top Banner */}
                {isSupportPost && (
                  <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-900 px-4 py-2 flex items-center justify-between text-xs font-black shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-900/15 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                      </div>
                      <span className="tracking-wide">PESAN & PENGUMUMAN RESMI SUPPORT TAMVESTA</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {post.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-black flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5 fill-amber-300" /> DIPIN
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-white/70 text-slate-900 text-[10px] font-extrabold uppercase">
                        Info Resmi
                      </span>
                    </div>
                  </div>
                )}
                {/* Post Author Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProfileUsername(post.authorUsername)}
                      className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 shrink-0 hover:scale-105 transition"
                    >
                      <img
                        src={
                          post.authorAvatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            post.authorName
                          )}&backgroundColor=0284c7`
                        }
                        alt={post.authorName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileUsername(post.authorUsername)}
                          className="font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 transition flex items-center gap-1"
                        >
                          <span>{post.authorName}</span>
                          {/* Lencana Centang Kuning Resmi Developer vs Centang Biru Siswa */}
                          {post.authorIsDeveloper ||
                          (post as any).authorBadgeType === 'developer' ||
                          post.authorUsername?.toLowerCase() === 'tamvesta' ? (
                            <VerifiedBadge size="xs" isDeveloper={true} />
                          ) : (
                            post.authorIsVerified && <VerifiedBadge size="xs" />
                          )}
                        </button>
                        {post.authorIsDeveloper ||
                        (post as any).authorBadgeType === 'developer' ||
                        post.authorUsername?.toLowerCase() === 'tamvesta' ? (
                          <span className="px-1.5 py-0.2 rounded text-[11px] bg-amber-500/15 text-amber-800 font-bold border border-amber-300">
                            Developer Resmi
                          </span>
                        ) : (post as any).authorIsAlumni ? (
                          <span className="px-1.5 py-0.2 rounded text-[11px] bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Alumni
                          </span>
                        ) : (
                          post.authorKelas && (
                            <span className="px-1.5 py-0.2 rounded text-[11px] bg-slate-100 text-slate-600 font-semibold">
                              {post.authorKelas}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>@{post.authorUsername}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Follow / Pin / Edit / Delete / Moderasi */}
                  <div className="flex items-center gap-1">
                    {/* Sematkan Postingan (📌) KHUSUS Akun Support TAMVESTA */}
                    {(user?.role === 'support' || user?.username?.toLowerCase() === 'tamvesta' || user?.isDeveloper) && (
                      <button
                        type="button"
                        onClick={() => handleTogglePinPost(post.id)}
                        className={`p-1.5 rounded-xl transition ${
                          post.isPinned
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-amber-600'
                        }`}
                        title={post.isPinned ? 'Lepas Sematan Postingan' : 'Sematkan Postingan (Khusus Support)'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${post.isPinned ? 'fill-amber-600 text-amber-600' : ''}`} />
                      </button>
                    )}

                    {/* Moderasi Foto Profil oleh Support TAMVESTA / Admin */}
                    {!isAuthor &&
                      (user?.role === 'support' || user?.role === 'admin' || user?.isDeveloper) &&
                      post.authorUsername?.toLowerCase() !== 'tamvesta' && (
                        <button
                          type="button"
                          onClick={() =>
                            setModeratingUser({
                              id: post.authorId,
                              name: post.authorName,
                              username: post.authorUsername,
                            })
                          }
                          className="p-1.5 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition"
                          title={`Moderasi Foto Profil @${post.authorUsername}`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}

                    {!isAuthor && user && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(post.authorId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                          isFollowing
                            ? 'bg-slate-100 text-slate-600 hover:text-rose-600'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mengikuti</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Ikuti</span>
                          </>
                        )}
                      </button>
                    )}

                    {isAuthor && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditPost(post)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="Edit Caption"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus Postingan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Indikator Postingan Disematkan (📌 Pinned) */}
                {post.isPinned && (
                  <div className="px-4 pb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-800 text-[10px] font-black">
                      <Pin className="w-3 h-3 fill-amber-600 text-amber-600" />
                      <span>Disematkan ke Profil</span>
                    </div>
                  </div>
                )}

                {/* Caption (or edit input) */}
                <div className="px-4 pb-3">
                  {editingPostId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditPost(post.id)}
                          className="px-3.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-slate-800 whitespace-pre-line leading-relaxed">
                      {post.caption}
                    </p>
                  )}
                </div>

                {/* Media (Photo or Video) */}
                {post.mediaUrl && (
                  <div className="bg-black/5 border-y border-slate-100 flex items-center justify-center max-h-[480px] overflow-hidden">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="w-full max-h-[480px] object-contain" />
                    ) : (
                      <div
                        onClick={() => setLightboxImage({ url: post.mediaUrl!, title: `Foto oleh ${post.authorName}` })}
                        className="relative group cursor-zoom-in w-full flex items-center justify-center"
                        title="Klik untuk memperbesar foto"
                      >
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full max-h-[480px] object-cover sm:object-contain group-hover:brightness-95 transition"
                        />
                        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition shadow-lg backdrop-blur-xs">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Perbesar Foto</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Bar (Like, Comment, Count) */}
                <div className="p-3 sm:px-4 flex items-center justify-between border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition active:scale-125 ${
                        isLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-600 stroke-none' : ''}`} />
                      <span>{post.likes.length} Suka</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-emerald-700 transition"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments?.length || 0} Komentar</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
                    {/* List of comments */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {(post.comments || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-2">
                          Belum ada komentar. Berikan apresiasi atau tanggapan pertama!
                        </p>
                      ) : (
                        post.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedProfileUsername(comment.authorUsername)}
                              className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5"
                            >
                              <img
                                src={
                                  comment.authorAvatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                    comment.authorName
                                  )}&backgroundColor=0284c7`
                                }
                                alt={comment.authorName}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex-1">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProfileUsername(comment.authorUsername)}
                                  className="font-bold text-[11px] text-slate-900 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <span>{comment.authorName}</span>
                                  {comment.authorUsername?.toLowerCase() === 'tamvesta' ||
                                  (comment as any).authorIsDeveloper ||
                                  (comment as any).authorBadgeType === 'developer' ? (
                                    <VerifiedBadge size="xs" isDeveloper={true} />
                                  ) : (comment as any).authorIsVerified ? (
                                    <VerifiedBadge size="xs" />
                                  ) : null}
                                </button>
                                <span className="text-[10px] text-slate-400">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                              {/* Indikator Balasan */}
                              {comment.replyToUsername && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-100">
                                  <Reply className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Membalas @{comment.replyToUsername}</span>
                                </div>
                              )}

                              <p className="text-slate-700 mt-1 leading-relaxed text-[11px]">
                                {comment.content}
                              </p>

                              {/* Tombol Balas */}
                              <div className="mt-1 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo((prev) => ({
                                      ...prev,
                                      [post.id]: {
                                        commentId: comment.id,
                                        authorName: comment.authorName,
                                        authorUsername: comment.authorUsername,
                                        authorId: comment.authorId,
                                      },
                                    }));
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-0.5 rounded-lg transition active:scale-95"
                                  title={`Balas komentar ${comment.authorName}`}
                                >
                                  <Reply className="w-3 h-3" />
                                  <span>Balas</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Banner */}
                    {replyingTo[post.id] && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in">
                        <div className="flex items-center gap-1.5 truncate">
                          <Reply className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] truncate">
                            Membalas <strong className="font-bold text-emerald-950">@{replyingTo[post.id]!.authorUsername}</strong> ({replyingTo[post.id]!.authorName})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Batalkan balasan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Comment Input Box */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendComment(post.id);
                        }}
                        placeholder="Tulis komentar positif..."
                        className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}
      {/* 1. Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
      />

      {/* 2. Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={(newStory) => setStories((prev) => [newStory, ...prev])}
      />

      {/* 3. Story Viewer Modal */}
      <StoryViewerModal
        isOpen={isStoryViewerOpen}
        stories={stories}
        initialIndex={selectedStoryIndex}
        currentUserId={user?.id}
        onClose={() => setIsStoryViewerOpen(false)}
        onDeleteStory={handleDeleteStory}
      />

      {/* 4. User Profile Modal */}
      {selectedProfileUsername && (
        <UserProfileModal
          isOpen={true}
          username={selectedProfileUsername}
          currentUserId={user?.id}
          onClose={() => setSelectedProfileUsername(null)}
          onEditProfile={onOpenProfile}
        />
      )}

      {/* 5. Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToAnnouncement={onOpenAnnouncements}
        onNavigateToSubjects={onOpenSubjects}
        onNavigateToQuiz={onOpenQuiz}
        onRefreshUnreadCount={loadFeedData}
      />

      {/* 6. Lightbox Zoom Image Modal */}
      <ImageLightboxModal
        imageUrl={lightboxImage ? lightboxImage.url : null}
        title={lightboxImage ? lightboxImage.title : undefined}
        onClose={() => setLightboxImage(null)}
      />

      {/* 6b. Modal Moderasi Foto Profil Siswa oleh Support / Admin */}
      {moderatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Moderasi Foto Profil</h3>
                <p className="text-[11px] text-slate-500">Akun Siswa: @{moderatingUser.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan me-reset foto profil <strong>{moderatingUser.name}</strong> kembali ke foto default maskot TAMVESTA dan mencatatnya ke log moderasi admin.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Alasan Moderasi:</label>
              <textarea
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Contoh: Foto profil tidak pantas / melanggar norma tata tertib sekolah..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModeratingUser(null);
                  setModerationReason('');
                }}
                disabled={isModerating}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAvatarModeration}
                disabled={isModerating}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition active:scale-95 disabled:opacity-50 shadow-md shadow-amber-600/20"
              >
                {isModerating ? 'Memproses...' : 'Reset Foto Profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. DRAWER MENU (GARIS TIGA) SISWA DARI BANNER SELAMAT DATANG */}
      {/* ------------------------------------------------------------- */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsSideMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight text-white">Menu Tamvesta</h3>
                  <p className="text-[10px] text-emerald-200">Navigasi Siswa Tamansiswa</p>
                </div>
              </div>
              <button
                onClick={() => setIsSideMenuOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info Card in Drawer */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                  alt={user?.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs text-slate-800 truncate flex items-center gap-1">
                    <span>{user?.name}</span>
                    {user?.isVerified && <VerifiedBadge size="xs" />}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">@{user?.username}</p>
                  <span className="inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {user?.kelas || 'Siswa Tamvesta'}
                  </span>
                </div>
              </div>

              {/* Segarkan Sinyal Button */}
              <button
                onClick={() => {
                  handleRefresh();
                  setIsSideMenuOpen(false);
                }}
                disabled={refreshing}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Menyinkron Sinyal...' : 'Segarkan Sinyal & Centang Biru'}</span>
              </button>
            </div>

            {/* Navigation Menu List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 pb-1">
                Navigasi Pembelajaran
              </p>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenSubjects?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 transition group text-left border border-transparent hover:border-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Mata Pelajaran</span>
                    <span className="text-[10px] text-slate-400 block">Materi & tugas sekolah</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenLibrary?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-teal-50/70 text-slate-700 hover:text-teal-800 transition group text-left border border-transparent hover:border-teal-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 text-teal-700 rounded-xl group-hover:scale-105 transition">
                    <Library className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Perpustakaan Digital</span>
                    <span className="text-[10px] text-slate-400 block">Koleksi e-book & buku</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenAnnouncements?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-amber-50/70 text-slate-700 hover:text-amber-800 transition group text-left border border-transparent hover:border-amber-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Pengumuman Sekolah</span>
                    <span className="text-[10px] text-slate-400 block">Kabar resmi dari guru</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenQuiz?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/70 text-slate-700 hover:text-blue-800 transition group text-left border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Quiz & Ujian Online</span>
                    <span className="text-[10px] text-slate-400 block">Token ujian & CBT</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenGames?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-purple-50/70 text-slate-700 hover:text-purple-800 transition group text-left border border-transparent hover:border-purple-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Permainan Edukasi</span>
                    <span className="text-[10px] text-slate-400 block">Who's the Spy & Mafia</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenArticles?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50/70 text-slate-700 hover:text-orange-800 transition group text-left border border-transparent hover:border-orange-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-xl group-hover:scale-105 transition">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Artikel Sekolah</span>
                    <span className="text-[10px] text-slate-400 block">Karya tulis & berita</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              {/* Menu Pesan & DM tepat di samping / bawah Artikel */}
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenDm?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 transition group text-left border border-transparent hover:border-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition relative">
                    <MessageCircle className="w-4 h-4" />
                    {unreadDmCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                        {unreadDmCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Pesan & DM</span>
                    <span className="text-[10px] text-slate-400 block">Percakapan, Catatan & Voice Note</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              {/* Menu Layanan Laporan & Lost and Found */}
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenReports?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-800 transition group text-left border border-transparent hover:border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-105 transition">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Laporan & Lost/Found</span>
                    <span className="text-[10px] text-slate-400 block">Barang hilang, izin tempat & bantuan</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 pt-3 pb-1">
                Akun & Notifikasi
              </p>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenProfile?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 text-slate-700 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Profil Saya</span>
                    <span className="text-[10px] text-slate-400 block">Biodata & foto akun</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onOpenQr?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 text-slate-700 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Kartu Pelajar & QR</span>
                    <span className="text-[10px] text-slate-400 block">Presensi & identitas</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setIsNotificationsOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 text-slate-700 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition relative">
                    <Bell className="w-4 h-4" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Notifikasi</span>
                    <span className="text-[10px] text-slate-400 block">{unreadNotifCount} pesan belum dibaca</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition active:scale-98 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
