import React, { useState, useEffect } from 'react';
import {
  Camera,
  User as UserIcon,
  Shield,
  Lock,
  Edit3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  Grid,
  Heart,
  MessageCircle,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { PhotoCropModal } from '../../components/PhotoCropModal.tsx';
import { PRESET_AVATARS } from '../../constants/presetAvatars.ts';
import { Smile } from 'lucide-react';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';
import { ImageLightboxModal } from '../../components/ImageLightboxModal.tsx';
import type { StudentPost } from '../../types/index.ts';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Photo Cropping States
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  // Bio States
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [bioLoading, setBioLoading] = useState(false);

  // Username edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Contact Info states (Phone & Gmail)
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // User posts & stats
  const [myPosts, setMyPosts] = useState<StudentPost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Password reset request ticket states
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleSyncStatus = async () => {
    setSyncingStatus(true);
    setSyncSuccessMsg(null);
    try {
      await refreshUser();
      setSyncSuccessMsg('Sinyal Admin Terhubung! Status akun berhasil diperbarui.');
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } catch (_) {
    } finally {
      setSyncingStatus(false);
    }
  };

  useEffect(() => {
    // Refresh user data immediately to pull latest verified badge status
    refreshUser();

    // Sinyal sinkronisasi otomatis dari Admin Dashboard
    try {
      const channel = new BroadcastChannel('tamvesta_admin_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'REFRESH_ALL' || event.data?.userId === user?.id) {
          refreshUser();
        }
      };
      return () => {
        try { channel.close(); } catch (_) {}
      };
    } catch (_) {}
  }, [user?.id]);

  const loadMyTickets = async () => {
    try {
      const res = await api.getStudentTickets();
      if (Array.isArray(res)) setMyTickets(res);
    } catch (_) {}
  };

  useEffect(() => {
    if (!user) return;
    setBioText(user.bio || '');
    setNewUsername(user.username);
    setPhoneNumber(user.phone || '');
    setEmailAddress(user.email || '');

    // Load user's posts & public stats
    loadMyTickets();
    api
      .getPublicProfile(user.username)
      .then((res: any) => {
        if (res) {
          setMyPosts(res.posts || []);
          setFollowersCount(res.followersCount || 0);
          setFollowingCount(res.followingCount || 0);
        }
      })
      .catch((err: any) => console.error('Failed to load profile details:', err));
  }, [user]);

  if (!user) return null;

  // -------------------------------------------------------------
  // USERNAME 30-DAY COOLDOWN LOGIC
  // -------------------------------------------------------------
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  let canChangeUsername = true;
  let daysRemaining = 0;
  let nextAllowedDate: Date | null = null;

  if (user.lastUsernameChange) {
    const lastChangeTime = new Date(user.lastUsernameChange).getTime();
    const elapsed = Date.now() - lastChangeTime;
    if (elapsed < THIRTY_DAYS_MS) {
      canChangeUsername = false;
      daysRemaining = Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000));
      nextAllowedDate = new Date(lastChangeTime + THIRTY_DAYS_MS);
    }
  }

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess(null);
    setResetError(null);

    if (!resetNewPass || resetNewPass.length < 6) {
      setResetError('Password baru minimal 6 karakter.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.requestPasswordReset({
        newPassword: resetNewPass,
        confirmPassword: resetConfirmPass,
        reason: resetReason.trim() || 'Pengajuan ganti sandi berkala',
      });
      setResetSuccess(res.message || 'Pengajuan ganti sandi berhasil dikirim! Menunggu persetujuan Admin.');
      setResetNewPass('');
      setResetConfirmPass('');
      setResetReason('');
      loadMyTickets();
    } catch (err: any) {
      setResetError(err.message || 'Gagal mengajukan perubahan kata sandi.');
    } finally {
      setResetLoading(false);
    }
  };

  // File selection for photo profile
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file maksimal 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImageForCrop(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Crop saved -> Send to server
  const handleCropSave = async (croppedDataUrl: string) => {
    setIsCropModalOpen(false);
    setUpdatingPhoto(true);
    try {
      await api.updateProfile({ avatarUrl: croppedDataUrl });
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan foto profil.');
    } finally {
      setUpdatingPhoto(false);
      setTempImageForCrop(null);
    }
  };

  // Save Bio
  const handleSaveBio = async () => {
    setBioLoading(true);
    try {
      await api.updateProfile({ bio: bioText });
      await refreshUser();
      setIsEditingBio(false);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui bio.');
    } finally {
      setBioLoading(false);
    }
  };

  // Save Contact Info (Phone & Gmail)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    setContactError(null);
    try {
      await api.updateProfile({ phone: phoneNumber, email: emailAddress });
      await refreshUser();
      setContactSuccess('Nomor Telepon & Gmail berhasil diperbarui!');
      setTimeout(() => setContactSuccess(null), 3000);
    } catch (err: any) {
      setContactError(err.message || 'Gagal menyimpan data kontak.');
    } finally {
      setContactLoading(false);
    }
  };

  // Update Username
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const trimmed = newUsername.trim().toLowerCase();
    if (!trimmed) {
      setUsernameError('Username baru wajib diisi.');
      return;
    }

    if (trimmed === user.username.toLowerCase()) {
      setIsEditingUsername(false);
      return;
    }

    setUsernameLoading(true);
    try {
      const res = await api.updateUsername(trimmed);
      setUsernameSuccess(res.message);
      await refreshUser();
      setIsEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err.message || 'Gagal mengubah username.');
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Photo Crop Modal */}
      {isCropModalOpen && tempImageForCrop && (
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempImageForCrop}
          onCropSave={handleCropSave}
          onCancel={() => {
            setIsCropModalOpen(false);
            setTempImageForCrop(null);
          }}
        />
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-3 border-emerald-500/40 shadow-xl bg-slate-100 flex items-center justify-center cursor-zoom-in"
              onClick={() =>
                setLightboxImage(
                  user.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user.name || 'User'
                    )}&backgroundColor=0284c7`
                )
              }
              title="Klik foto untuk memperbesar"
            >
              {updatingPhoto ? (
                <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              ) : (
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user.name || 'User'
                    )}&backgroundColor=0284c7`
                  }
                  alt={user.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              )}
            </div>

            {/* Ganti Foto Profil Button */}
            <label
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer transition active:scale-90 flex items-center justify-center"
              title="Ganti Foto Profil (Potong & Sesuaikan)"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                {user.username?.toLowerCase() === 'tamvesta' || user.isDeveloper || user.role === 'support' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-wider shadow-xs">
                    <span>⭐</span>
                    <span>Developer Resmi TAMVESTA</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    <School className="w-3 h-3 text-emerald-600" />
                    <span>{user.isAlumni ? 'Alumni Perguruan Tamansiswa' : 'Akun Siswa Resmi'}</span>
                  </div>
                )}
                {user.isVerified && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold shadow-xs">
                    <VerifiedBadge
                      size="xs"
                      isDeveloper={user.username?.toLowerCase() === 'tamvesta' || user.isDeveloper || user.role === 'support'}
                    />
                    <span>
                      {user.username?.toLowerCase() === 'tamvesta' || user.isDeveloper || user.role === 'support'
                        ? 'Developer Resmi (Centang Kuning)'
                        : 'Siswa Terverifikasi'}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span>{user.name}</span>
                {user.isVerified && (
                  <VerifiedBadge
                    size="lg"
                    isDeveloper={user.username?.toLowerCase() === 'tamvesta' || user.isDeveloper || user.role === 'support'}
                  />
                )}
              </h1>
              <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
            </div>

            {/* Preset Avatars for Instant Switch */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bosan dengan foto saat ini? Pilih Avatar Keren Instan:</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Tersimpan Selamanya
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={async () => {
                      setUpdatingPhoto(true);
                      try {
                        await api.updateProfile({ avatarUrl: av.url });
                        await refreshUser();
                      } catch (err: any) {
                        alert(err.message || 'Gagal mengubah foto profil.');
                      } finally {
                        setUpdatingPhoto(false);
                      }
                    }}
                    disabled={updatingPhoto}
                    className="group relative flex flex-col items-center p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition active:scale-95 text-center"
                    title={`Ganti ke avatar ${av.name}`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-11 h-11 rounded-lg object-cover mb-1 border border-slate-100 group-hover:scale-105 transition"
                    />
                    <span className="text-[9px] font-bold text-slate-600 group-hover:text-emerald-700 truncate w-full block">
                      {av.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bio Section */}
            {isEditingBio ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Tuliskan bio singkat tentang dirimu (hobi, motto belajar)..."
                  maxLength={160}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{bioText.length}/160 karakter</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBio}
                      disabled={bioLoading}
                      className="px-3.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {bioLoading ? 'Menyimpan...' : 'Simpan Bio'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{user.bio || 'Belum ada bio. Tambahkan bio singkat tentang dirimu!'}"
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{user.bio ? 'Ubah Bio' : 'Tulis Bio'}</span>
                </button>
              </div>
            )}

            {/* Stats Counter */}
            <div className="flex items-center justify-center sm:justify-start gap-5 pt-2 text-xs border-t border-slate-100">
              <div>
                <span className="font-black text-slate-900">{myPosts.length}</span>{' '}
                <span className="text-slate-500">Postingan</span>
              </div>
              <div>
                <span className="font-black text-slate-900">
                  {user.username?.toLowerCase() === 'tamvesta' || user.isDeveloper || user.role === 'support'
                    ? user.followersCountDisplay || '1,1 Juta'
                    : followersCount}
                </span>{' '}
                <span className="text-slate-500">Pengikut</span>
              </div>
              <div>
                <span className="font-black text-slate-900">{followingCount}</span>{' '}
                <span className="text-slate-500">Mengikuti</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details & Settings Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-emerald-600" />
          <span>Informasi Akun Siswa</span>
        </h3>

        {/* 1. Nama Lengkap (Admin Assigned - Read Only) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>{user.role === 'guru' ? 'Nama Lengkap Guru' : 'Nama Lengkap Siswa'}</span>
              {user.isVerified && <VerifiedBadge size="sm" />}
            </label>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
              Ditetapkan Sekolah (Tidak dapat diubah)
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 cursor-not-allowed"
            />
            {user.isVerified && (
              <span className="absolute right-3">
                <VerifiedBadge size="sm" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Nama resmi sesuai buku induk dapodik sekolah. Jika ada kekeliruan, hubungi bagian tata usaha.
          </p>
        </div>

        {/* 2. Kelas & NISN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Kelas</label>
            <input
              type="text"
              value={user.kelas || 'Tamansiswa Batam'}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Jenis Kelamin</label>
            <input
              type="text"
              value={user.gender || 'Laki-laki'}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Status Kategori & Verifikasi Akun Siswa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Akun Siswa</label>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
              user.isAlumni
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <School className="w-3.5 h-3.5" />
              <span>{user.isAlumni ? 'Alumni Tamansiswa Batam' : 'Siswa Aktif Tamansiswa'}</span>
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 block">Status Verifikasi Resmi</label>
              <button
                type="button"
                onClick={handleSyncStatus}
                disabled={syncingStatus}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition shadow-xs disabled:opacity-50"
                title="Segarkan sinyal verifikasi centang biru dari Admin Dashboard"
              >
                <RefreshCw className={`w-3 h-3 ${syncingStatus ? 'animate-spin text-blue-600' : ''}`} />
                <span>{syncingStatus ? 'Menyinkron...' : 'Segarkan Sinyal Admin'}</span>
              </button>
            </div>
            {syncSuccessMsg && (
              <p className="text-[11px] text-emerald-600 font-bold mb-1.5 animate-in fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{syncSuccessMsg}</span>
              </p>
            )}
            {user.isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                <VerifiedBadge size="sm" />
                <span>{user.role === 'guru' ? 'Guru Sudah Terverifikasi (Centang Biru Aktif)' : 'Siswa Sudah Terverifikasi (Centang Biru Aktif)'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold">
                <span>Belum Terverifikasi (Klik Segarkan Sinyal jika Admin telah mendaftarkan)</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Kontak Siswa: Nomor Telepon & Gmail */}
        <form onSubmit={handleSaveContact} className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Kontak Siswa (WhatsApp & Gmail)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                  Bisa Diperbarui
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">Digunakan untuk informasi akademik dan konfirmasi administrasi sekolah</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Gmail / Alamat Email</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="nama.siswa@gmail.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {contactSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{contactSuccess}</span>
            </div>
          )}

          {contactError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{contactError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={contactLoading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{contactLoading ? 'Menyimpan...' : 'Simpan Kontak'}</span>
            </button>
          </div>
        </form>

        {/* 3. Username (1x per 30 Days Cooldown) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Username Akun</label>
            {canChangeUsername ? (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tersedia untuk diubah
              </span>
            ) : (
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Terkunci {daysRemaining} hari lagi
              </span>
            )}
          </div>

          {usernameSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{usernameSuccess}</span>
            </div>
          )}

          {usernameError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{usernameError}</span>
            </div>
          )}

          {isEditingUsername ? (
            <form onSubmit={handleUpdateUsername} className="space-y-3">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="Masukkan username baru (huruf, angka, titik)"
                required
                pattern="^[a-zA-Z0-9._]+$"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={usernameLoading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {usernameLoading ? 'Memeriksa...' : 'Simpan Username'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-800">
                @{user.username}
              </span>
              {canChangeUsername ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(true)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 transition"
                >
                  Ubah Username
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  {nextAllowedDate
                    ? `Dapat diubah pada ${nextAllowedDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : 'Maks 1x per 30 hari'}
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Username dapat diubah maksimal <strong>1 kali dalam 30 hari</strong> dan harus unik di seluruh sekolah.
          </p>
        </div>

        {/* 4. Fitur Pengajuan Ganti Sandi Siswa */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Pengajuan Ganti Sandi Akun</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Persetujuan Administrator
            </span>
          </div>

          <form onSubmit={handleRequestPasswordReset} className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Siswa</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full px-3 py-2 bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Username Siswa</label>
                <input
                  type="text"
                  value={`@${user.username}`}
                  disabled
                  className="w-full px-3 py-2 bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Password Baru (Min. 6) *</label>
                <input
                  type="password"
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Alasan Pengajuan (Opsional)</label>
              <textarea
                rows={2}
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Contoh: Mengganti sandi berkala untuk keamanan akun..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}
            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={resetLoading}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>{resetLoading ? 'Mengirim Tiket...' : 'Kirim Pengajuan Ganti Sandi'}</span>
              </button>
            </div>
          </form>

          {/* Status & Riwayat Tiket Ganti Sandi */}
          {myTickets.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700">Status & Riwayat Tiket Pengajuan Sandi</h4>
              <div className="space-y-2">
                {myTickets.map((tkt) => (
                  <div key={tkt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{tkt.ticketNumber || tkt.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          tkt.status === 'approved' || tkt.status === 'acc' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          tkt.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {tkt.status === 'approved' || tkt.status === 'acc' ? 'Telah Disetujui' : tkt.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Diajukan: {new Date(tkt.createdAt).toLocaleString('id-ID')}
                        {tkt.adminNote && <span> • Catatan: {tkt.adminNote}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Postingan Siswa Milik Sendiri */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Grid className="w-4 h-4 text-emerald-600" />
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
            Postingan Saya ({myPosts.length})
          </h3>
        </div>

        {myPosts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            Anda belum pernah membuat postingan. Bagikan cerita belajarmu di Beranda!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 hover:shadow-md transition"
              >
                {post.isPinned && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow-sm flex items-center gap-1">
                    <span>📌</span>
                    <span>Disematkan</span>
                  </div>
                )}
                {post.mediaUrl ? (
                  post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
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

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pembesar Foto Profil */}
      <ImageLightboxModal
        imageUrl={lightboxImage}
        title={`Foto Profil • ${user.name}`}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
