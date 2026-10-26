import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  Edit3,
  Calendar,
  Grid,
  Heart,
  MessageCircle,
  Sparkles,
  School,
  Lock,
  CheckCircle2,
  ZoomIn,
  ShieldAlert,
  Pin,
} from 'lucide-react';
import { api, offlineStore } from '../lib/api.ts';
import type { StudentPost, User } from '../types/index.ts';
import { ImageLightboxModal } from './ImageLightboxModal.tsx';
import { VerifiedBadge } from './VerifiedBadge.tsx';

interface UserProfileModalProps {
  isOpen: boolean;
  username: string | null;
  currentUserId?: string;
  onClose: () => void;
  onEditProfile?: () => void;
  onPostClick?: (post: StudentPost) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  username,
  currentUserId,
  onClose,
  onEditProfile,
  onPostClick,
}) => {
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [posts, setPosts] = useState<StudentPost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);

  // Moderasi Foto Profil (Admin / Support TAMVESTA)
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  const currentUser = offlineStore.getCurrentUser();
  const isSupportOrDev =
    profileUser?.username?.toLowerCase() === 'tamvesta' ||
    profileUser?.isDeveloper ||
    profileUser?.role === 'support';
  const displayFollowers = isSupportOrDev
    ? profileUser?.followersCountDisplay || '1,1M'
    : followersCount;
  const canModerate =
    Boolean(currentUser &&
      (currentUser.role === 'admin' ||
        currentUser.role === 'support' ||
        currentUser.isDeveloper) &&
      !isSelf &&
      !isSupportOrDev);

  useEffect(() => {
    if (!isOpen || !username) return;

    setLoading(true);
    api
      .getUserProfile(username)
      .then((res) => {
        setProfileUser(res.user);
        setPosts(res.posts || []);
        setFollowersCount(res.followersCount || 0);
        setFollowingCount(res.followingCount || 0);
        setIsFollowing(res.isFollowing);
        setIsSelf(res.isSelf);
      })
      .catch((err: unknown) => {
        console.error('Failed to load user profile:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  if (!isOpen || !username) return null;

  const handleToggleFollow = async () => {
    if (!profileUser?.id || isSelf) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowersCount((c) => (prev ? c - 1 : c + 1));

    try {
      await api.toggleFollow(profileUser.id);
    } catch (err: unknown) {
      // Revert
      setIsFollowing(prev);
      setFollowersCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleModerateAvatar = async () => {
    if (!profileUser?.id) return;
    if (!moderationReason.trim()) {
      alert('Mohon masukkan alasan moderasi foto profil.');
      return;
    }
    setIsModerating(true);
    try {
      await api.resetStudentAvatar(profileUser.id, moderationReason.trim());
      setProfileUser((prev) =>
        prev ? { ...prev, avatarUrl: '/assets/tamvesta_mascot.jpg' } : prev
      );
      alert(
        `Foto profil ${profileUser.name} berhasil di-reset ke default maskot TAMVESTA dan dicatat di log moderasi admin.`
      );
      setShowModerationModal(false);
      setModerationReason('');
    } catch (err: any) {
      alert(err.message || 'Gagal mereset foto profil.');
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              @{username}
            </span>
            {isSupportOrDev && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-300 text-[10px] font-black">
                Developer Resmi
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat profil pengguna...</p>
            </div>
          ) : !profileUser ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-bold">Pengguna tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Profile Bio Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Large Profile Picture */}
                <div
                  className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-md shrink-0 bg-slate-100 cursor-zoom-in relative group"
                  onClick={() =>
                    setLightboxImage(
                      profileUser.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          profileUser.name || 'User'
                        )}&backgroundColor=0284c7`
                    )
                  }
                  title="Klik untuk memperbesar foto profil"
                >
                  <img
                    src={
                      profileUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        profileUser.name || 'User'
                      )}&backgroundColor=0284c7`
                    }
                    alt={profileUser.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-snug flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                      <span>{profileUser.name}</span>
                      {isSupportOrDev ? (
                        <VerifiedBadge size="md" isDeveloper={true} />
                      ) : (
                        profileUser.isVerified && <VerifiedBadge size="md" />
                      )}
                    </h2>
                    <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 flex-wrap">
                      <span>@{profileUser.username}</span>
                      <span>•</span>
                      {isSupportOrDev ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-800 border border-amber-300">
                          Developer Resmi TAMVESTA
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
                            profileUser.isAlumni
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {profileUser.isAlumni
                            ? 'Alumni'
                            : profileUser.kelas ||
                              (profileUser.role === 'guru' ? 'Guru' : 'Tamansiswa')}
                        </span>
                      )}
                      {!isSupportOrDev && profileUser.isVerified && (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 fill-blue-500 text-white" />
                          <span>Terverifikasi</span>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                    {profileUser.bio || 'Siswa Perguruan Tamansiswa Batam. Belum ada bio.'}
                  </p>

                  {/* Stats Counter */}
                  <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                    <div>
                      <span className="font-black text-slate-900">{posts.length}</span>{' '}
                      <span className="text-slate-500">Post</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-900">{displayFollowers}</span>{' '}
                      <span className="text-slate-500">Pengikut</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-900">{followingCount}</span>{' '}
                      <span className="text-slate-500">Mengikuti</span>
                    </div>
                  </div>

                  {/* Follow, Edit & Moderasi Action */}
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {isSelf ? (
                      <button
                        onClick={() => {
                          onClose();
                          if (onEditProfile) onEditProfile();
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profil Saya</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleToggleFollow}
                        className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
                          isFollowing
                            ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mengikuti</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Ikuti Siswa</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Tombol Moderasi Foto Profil (Khusus Admin / Akun Support TAMVESTA) */}
                    {canModerate && (
                      <button
                        type="button"
                        onClick={() => setShowModerationModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                        title="Reset foto profil siswa ini jika melanggar ketentuan sekolah"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>Moderasi Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Posts Grid */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500">
                  <Grid className="w-4 h-4" />
                  <span>Semua Postingan ({posts.length})</span>
                </div>

                {posts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Belum ada postingan yang diunggah oleh siswa ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onPostClick && onPostClick(post)}
                        className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition"
                      >
                        {/* Pinned Badge (📌) */}
                        {post.isPinned && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow-sm flex items-center gap-1">
                            <span>📌</span>
                            <span>Disematkan</span>
                          </div>
                        )}

                        {post.mediaUrl ? (
                          post.mediaType === 'video' ? (
                            <video
                              src={post.mediaUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={post.mediaUrl}
                              alt={post.caption}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )
                        ) : (
                          <div className="w-full h-full p-3 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-center">
                            <p className="text-[11px] text-slate-700 font-medium line-clamp-4">
                              {post.caption}
                            </p>
                          </div>
                        )}

                        {/* Hover Overlay with Likes & Comments */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-white" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Moderasi Foto Profil */}
      {showModerationModal && profileUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Moderasi Foto Profil</h3>
                <p className="text-[11px] text-slate-500">Akun: @{profileUser.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin me-reset foto profil <strong>{profileUser.name}</strong> kembali ke maskot TAMVESTA?
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Alasan Tindakan:</label>
              <textarea
                rows={3}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Contoh: Foto tidak pantas / melanggar norma tata tertib sekolah..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModerationModal(false);
                  setModerationReason('');
                }}
                disabled={isModerating}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleModerateAvatar}
                disabled={isModerating}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition active:scale-95 disabled:opacity-50 shadow-md shadow-amber-600/20"
              >
                {isModerating ? 'Memproses...' : 'Reset Foto Profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pembesar Foto Profil */}
      <ImageLightboxModal
        imageUrl={lightboxImage}
        title={profileUser?.name ? `Foto Profil • ${profileUser.name}` : 'Foto Profil'}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
