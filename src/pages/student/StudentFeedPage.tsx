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

interface StudentFeedPageProps {
  onOpenAnnouncements?: () => void;
  onOpenSubjects?: () => void;
  onOpenLibrary?: () => void;
  onOpenQuiz?: () => void;
  onOpenQr?: () => void;
  onOpenProfile?: () => void;
  onOpenArticles?: () => void;
}

export const StudentFeedPage: React.FC<StudentFeedPageProps> = ({
  onOpenAnnouncements,
  onOpenSubjects,
  onOpenLibrary,
  onOpenQuiz,
  onOpenQr,
  onOpenProfile,
  onOpenArticles,
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<StudentPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Modals
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

  // Lightbox Zoom Image state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  const loadFeedData = async (silent = false) => {
    if (!silent && posts.length === 0) setLoading(true);
    try {
      const [fetchedPosts, fetchedStories, notifs] = await Promise.all([
        api.getPosts(),
        api.getStories().catch(() => []),
        api.getNotifications().catch(() => []),
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedData();
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

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await api.addComment(postId, text);
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
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
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
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER UTAMA: SELAMAT DATANG TAMVESTA & HELLO NAMA */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mascot Avatar */}
            <div
              onClick={() => onOpenProfile && onOpenProfile()}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/40 shadow-md shrink-0 bg-slate-900 cursor-pointer hover:scale-105 transition"
            >
              <img
                src={user?.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                alt="Logo Tamvesta"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] sm:text-[11px] font-bold text-emerald-200 border border-white/10">
                <School className="w-3 h-3 text-amber-300" />
                <span>Selamat Datang Tamvesta</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight truncate max-w-[200px] sm:max-w-none">
                Hello!, {user?.name || 'Siswa'}
              </h1>
              <p className="text-[11px] text-teal-100 flex items-center gap-1.5">
                <span>@{user?.username}</span>
                <span>•</span>
                <span className="font-semibold text-amber-300">{user?.kelas || 'Tamansiswa Batam'}</span>
              </p>
            </div>
          </div>

          {/* Right Header Actions: Notification Bell */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 transition active:scale-95"
              title="Notifikasi Sekolah"
            >
              <Bell className="w-5 h-5 text-amber-300" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Hub Navigation: Pengumuman, Mapel, Perpustakaan */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-white text-xs font-bold">
          <button
            onClick={onOpenAnnouncements}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">Pengumuman</span>
          </button>
          <button
            onClick={onOpenSubjects}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span className="truncate">Mata Pelajaran</span>
          </button>
          <button
            onClick={onOpenLibrary}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            <Library className="w-3.5 h-3.5 text-cyan-300" />
            <span className="truncate">Perpustakaan</span>
          </button>
          <button
            onClick={onOpenArticles}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 rounded-xl transition font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">Artikel Guru</span>
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
          {stories
            .filter((s) => s.authorId !== user?.id)
            .map((story, idx) => (
              <div
                key={story.id}
                onClick={() => {
                  const actualIdx = stories.findIndex((s) => s.id === story.id);
                  setSelectedStoryIndex(actualIdx);
                  setIsStoryViewerOpen(true);
                }}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 animate-in fade-in">
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
                <span className="text-[10px] font-medium text-slate-600 truncate max-w-[64px]">
                  {story.authorName.split(' ')[0]}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. QUICK CREATE POST PROMPT */}
      {/* ------------------------------------------------------------- */}
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
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Segarkan Feed</span>
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
            <h3 className="text-sm font-black text-slate-900">Belum Ada Postingan Siswa</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Jadilah yang pertama membagikan cerita belajar atau karya seni di Tamvesta!
            </p>
          </div>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
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

            return (
              <article
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
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
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition flex items-center gap-1"
                        >
                          <span>{post.authorName}</span>
                          {post.authorIsVerified && (
                            <span className="inline-flex items-center text-blue-500" title="Siswa Terverifikasi">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
                            </span>
                          )}
                        </button>
                        {(post as any).authorIsAlumni ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Alumni
                          </span>
                        ) : (
                          post.authorKelas && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                              {post.authorKelas}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>@{post.authorUsername}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Follow / Edit / Delete */}
                  <div className="flex items-center gap-1">
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
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
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
                                  {(comment as any).authorIsVerified && (
                                    <span className="inline-flex items-center text-blue-500" title="Siswa Terverifikasi">
                                      <CheckCircle2 className="w-3 h-3 fill-blue-500 text-white shrink-0" />
                                    </span>
                                  )}
                                </button>
                                <span className="text-[10px] text-slate-400">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-700 mt-1 leading-relaxed text-[11px]">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

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
    </div>
  );
};
