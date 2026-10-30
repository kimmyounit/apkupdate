import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  X,
  Shield,
  User as UserIcon,
  QrCode as QrIcon,
  School,
  Sparkles,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Lock,
  Key,
  Check,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Clock,
  ShieldCheck,
  History,
  XCircle,
} from 'lucide-react';
import type { PasswordResetRequest } from '../types/index.ts';
import type { User } from '../types/index.ts';
import { api, setStoredToken } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ImageLightboxModal } from './ImageLightboxModal.tsx';
import { PhotoCropModal } from './PhotoCropModal.tsx';
import { PRESET_AVATARS } from '../constants/presetAvatars.ts';
import { Camera, Image as ImageIcon, Smile, Sparkles as SparklesIcon } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge.tsx';

interface Props {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<Props> = ({ user: initialUser, isOpen, onClose }) => {
  const { refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'qr' | 'settings'>('qr');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // QR States
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(true);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Username Update States
  const [newUsername, setNewUsername] = useState(initialUser.username);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bio States
  const [bioText, setBioText] = useState(initialUser.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset Request Ticket States
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [studentTickets, setStudentTickets] = useState<PasswordResetRequest[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const tickets = await api.getStudentTickets();
      if (Array.isArray(tickets)) {
        setStudentTickets(tickets);
      }
    } catch (_) {
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    setBioMessage(null);
    try {
      await api.updateProfile({ bio: bioText.trim() });
      setCurrentUser((prev) => ({ ...prev, bio: bioText.trim() }));
      await refreshUser();
      setIsEditingBio(false);
      setBioMessage({ type: 'success', text: 'Bio profil siswa berhasil disimpan permanen!' });
      setTimeout(() => setBioMessage(null), 3500);
    } catch (err: any) {
      setBioMessage({ type: 'error', text: err.message || 'Gagal menyimpan bio profil.' });
    } finally {
      setSavingBio(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    setCurrentUser(initialUser);
    setNewUsername(initialUser.username);
    setBioText(initialUser.bio || '');
  }, [initialUser]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setLoadingQr(true);
    setIsZoomed(false);
    const tokenToEncode = currentUser.qrToken || `TAMVESTA:STUDENT:${currentUser.id}:${currentUser.username}`;

    QRCode.toDataURL(tokenToEncode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
        setLoadingQr(false);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        setLoadingQr(false);
      });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_TAMVESTA_${currentUser.username}_${currentUser.gender || "Siswa"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // File selection for profile photo
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file maksimal 20MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTempImageForCrop(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save cropped photo
  const handleCropSave = async (croppedDataUrl: string) => {
    setIsCropModalOpen(false);
    setUpdatingPhoto(true);
    try {
      await api.updateProfile({ avatarUrl: croppedDataUrl });
      setCurrentUser((prev) => ({ ...prev, avatarUrl: croppedDataUrl }));
      await refreshUser();
      setPhotoSuccessMsg('Foto profil berhasil diganti & tersimpan selamanya!');
      setTimeout(() => setPhotoSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan foto profil.');
    } finally {
      setUpdatingPhoto(false);
      setTempImageForCrop(null);
    }
  };

  // Change to preset avatar
  const handleSelectPresetAvatar = async (avatarUrl: string, avatarName: string) => {
    setUpdatingPhoto(true);
    try {
      await api.updateProfile({ avatarUrl });
      setCurrentUser((prev) => ({ ...prev, avatarUrl }));
      await refreshUser();
      setPhotoSuccessMsg(`Foto profil diubah ke "${avatarName}" & tersimpan selamanya!`);
      setTimeout(() => setPhotoSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah foto profil.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  // 1. Update Username
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage(null);
    const trimmed = newUsername.trim();

    if (!trimmed) {
      setUsernameMessage({ type: 'error', text: 'Username tidak boleh kosong.' });
      return;
    }

    if (trimmed === currentUser.username) {
      setUsernameMessage({ type: 'error', text: 'Username baru tidak boleh sama dengan username saat ini.' });
      return;
    }

    setUpdatingUsername(true);
    try {
      const res = await api.updateUsername(trimmed);
      if (res.token) {
        setStoredToken(res.token);
      }
      setCurrentUser(res.user);
      await refreshUser();
      setUsernameMessage({
        type: 'success',
        text: 'Username berhasil diperbarui dan tersimpan di database.',
      });
    } catch (err: any) {
      setUsernameMessage({
        type: 'error',
        text: err.message || 'Gagal mengubah username.',
      });
    } finally {
      setUpdatingUsername(false);
    }
  };

  // 2. Submit Password Reset Request Ticket to Admin
  const handleSubmitResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok.' });
      return;
    }
    if (!resetReason.trim()) {
      setResetMessage({ type: 'error', text: 'Silakan isi alasan pengajuan perubahan password.' });
      return;
    }

    setSubmittingReset(true);
    try {
      const res = await api.requestPasswordReset({
        newPassword: resetNewPassword.trim(),
        confirmPassword: resetConfirmPassword.trim(),
        reason: resetReason.trim(),
      });
      setResetMessage({
        type: 'success',
        text: res.message || 'Permintaan berhasil diajukan ke Admin. Saat Admin meng-ACC tiket di dashboard, password Anda akan resmi berubah.',
      });
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetReason('');
      await loadTickets();
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || 'Gagal mengajukan permintaan perubahan password.',
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header with Balik ke Halaman Button */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/25 shadow-sm shrink-0 bg-slate-900">
              <img
                src="/assets/aistudio/tamvesta_apk_12aad39c.jpeg"
                alt="Logo TAMVESTA"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Profil & Akun Siswa</h3>
              <p className="text-[11px] text-teal-100">TAMVESTA • Perguruan Tamansiswa Batam</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            title="Tutup dan balik ke halaman sebelumnya"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Balik ke Halaman</span>
          </button>
        </div>

        {/* Tab Switcher: QR Card vs Pengaturan Akun */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-black border-b-2 transition ${
              activeTab === 'qr'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrIcon className="w-4 h-4" />
            <span>1. Kartu QR Absensi</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-black border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Pengaturan Akun & Sandi</span>
          </button>
        </div>

        {/* TAB 1: KARTU QR ABSENSI */}
        {activeTab === 'qr' && (
          <div className="p-6 space-y-4">
            <div
              ref={printAreaRef}
              id="student-card-print"
              className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-dashed border-emerald-300 p-5 shadow-sm text-center relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-300 shadow-xs shrink-0">
                    <img
                      src="/assets/aistudio/tamvesta_apk_12aad39c.jpeg"
                      alt="Logo Tamvesta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 tracking-wide uppercase">
                      {currentUser.isAlumni ? 'Kartu Alumni Siswa' : 'Kartu Absensi Siswa'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">TAMVESTA • Tamansiswa Batam</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> RESMI
                </span>
              </div>

              {/* Student Info & Photo */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 text-left">
                <div className="relative shrink-0 group">
                  <div
                    onClick={() =>
                      setLightboxImage(
                        currentUser.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=0284c7`
                      )
                    }
                    className="cursor-zoom-in"
                    title="Klik untuk memperbesar foto profil"
                  >
                    <img
                      src={
                        currentUser.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=0284c7`
                      }
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-slate-100 group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Tombol Ganti Foto Kamera */}
                  <label
                    className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition active:scale-90 flex items-center justify-center border-2 border-white z-10"
                    title="Ganti Foto Profil (Bisa diganti kapan saja jika bosan)"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                  <h3 className="font-black text-slate-900 text-base leading-tight flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span>{currentUser.name}</span>
                    {currentUser.isVerified && <VerifiedBadge size="md" />}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-600">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                      @{currentUser.username}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      currentUser.isAlumni
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {currentUser.isAlumni ? 'Alumni' : (currentUser.kelas || 'Siswa Aktif')}
                    </span>
                    {currentUser.isVerified && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 fill-blue-500 text-white" />
                        <span>Siswa Terverifikasi</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await refreshUser();
                          const fresh = await api.getMe();
                          if (fresh?.user) setCurrentUser(fresh.user);
                        } catch (_) {}
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition shadow-xs"
                      title="Segarkan sinyal dari admin dashboard"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-blue-600" />
                      <span>Segarkan Sinyal</span>
                    </button>
                  </div>
                  {currentUser.gender && (
                    <p className="text-xs text-slate-500">{currentUser.gender}</p>
                  )}
                </div>
              </div>

              {/* QR Code Container - Clickable to zoom */}
              <div
                onClick={() => setIsZoomed(!isZoomed)}
                className="group relative bg-white p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 shadow-inner inline-block my-1 mx-auto cursor-pointer transition-all duration-200 hover:shadow-lg"
                title="Klik untuk memperbesar / mengecilkan QR Code"
              >
                {loadingQr ? (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    Membuat QR Code...
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={qrDataUrl}
                      alt="QR Code Absensi Siswa"
                      className={`object-contain mx-auto transition-all duration-300 ${
                        isZoomed ? 'w-64 h-64 sm:w-72 sm:h-72 scale-105' : 'w-44 h-44 group-hover:scale-102'
                      }`}
                    />
                    <div className="absolute bottom-1 right-1 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg opacity-80 group-hover:opacity-100 transition text-[10px] flex items-center gap-1 px-1.5">
                      {isZoomed ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
                      <span>{isZoomed ? 'Perkecil' : 'Perbesar'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <QrIcon className="w-3.5 h-3.5 text-emerald-600" /> Gunakan Untuk Absensi Event & OSIS
                </span>
              </div>
            </div>

            {/* Action Buttons: Unduh & Cetak */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPng}
                disabled={loadingQr || !qrDataUrl}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                Unduh PNG
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Balik ke Halaman</span>
            </button>
          </div>
        )}

        {/* TAB 2: PENGATURAN AKUN SESUAI KETENTUAN SISTEM REVISI 5 */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Foto Profil & Pilihan Avatar Keren (Selamanya Tidak Menghilang & Bisa Diganti Kapan Saja) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/90 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Foto Profil Akun</h4>
                    <p className="text-[10px] text-slate-500">Tersimpan permanen & dapat diganti kapan saja</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Permanen Selamanya</span>
                </span>
              </div>

              {photoSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{photoSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-4 bg-white/90 p-3 rounded-xl border border-emerald-100">
                <img
                  src={
                    currentUser.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=0284c7`
                  }
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0 bg-slate-100"
                />
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    Foto saat ini aktif di kartu siswa, barcode, dan portal sekolah.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition active:scale-95 shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{updatingPhoto ? 'Memproses...' : 'Ganti Foto dari HP / Laptop'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      disabled={updatingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Pilihan Avatar Keren (Jika Bosan) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bosan? Pilih Avatar Keren Instan:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">1x klik untuk ganti</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(av.url, av.name)}
                      disabled={updatingPhoto}
                      className="group relative flex flex-col items-center p-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition active:scale-90 text-center"
                      title={`Ganti ke avatar ${av.name}`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-10 h-10 rounded-lg object-cover mb-1 border border-slate-100 group-hover:scale-105 transition"
                      />
                      <span className="text-[9px] font-bold text-slate-600 group-hover:text-emerald-700 truncate w-full block">
                        {av.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio Profil Siswa (Disimpan Permanen) */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bio Siswa (Permanen)</span>
                </div>
                {!isEditingBio ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    {currentUser.bio ? 'Ubah Bio' : '+ Tulis Bio'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioText(currentUser.bio || '');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                  >
                    Batal
                  </button>
                )}
              </div>

              {bioMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    bioMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {bioMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{bioMessage.text}</span>
                </div>
              )}

              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.substring(0, 160))}
                    placeholder="Tuliskan bio profil kamu (motto belajar, hobi, cita-cita)..."
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{bioText.length}/160 karakter</span>
                    <button
                      type="button"
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      {savingBio ? 'Menyimpan...' : 'Simpan Bio'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{currentUser.bio || 'Belum ada bio. Tambahkan bio singkat tentang dirimu!'}"
                </p>
              )}
            </div>

            {/* 1. Nama Lengkap (Terkunci / Read-Only untuk Siswa) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nama Lengkap Siswa</span>
                </label>
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                  <Lock className="w-3 h-3" />
                  <span>Terkunci</span>
                </span>
              </div>
              <input
                type="text"
                value={currentUser.name}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                *Diambil secara otomatis dari data induk sekolah. Tidak dapat diubah oleh siswa. Perubahan nama hanya dapat dilakukan oleh <strong>Administrator</strong>.
              </p>
            </div>

            {/* 2. Username (Dapat diubah siswa, unik, tercatat 30 hari) */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Username Akun Siswa
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Dapat Diubah
                </span>
              </div>

              {usernameMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    usernameMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {usernameMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{usernameMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUsername} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    placeholder="masukkan_username_baru"
                    className="w-full pl-8 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">
                    *Maksimal 1 kali perubahan setiap 30 hari. Wajib unik.
                  </span>
                  <button
                    type="submit"
                    disabled={updatingUsername || newUsername.trim() === currentUser.username}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shrink-0"
                  >
                    {updatingUsername ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Simpan Username</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Password: Tidak dapat diganti langsung, wajib ajukan ke Admin */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <Key className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold">Keamanan Password & Sandi</h4>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  Ketentuan Kebijakan Keamanan Sekolah:
                </p>
                <p>
                  • Siswa <strong>tidak dapat mengganti password secara langsung</strong> melalui aplikasi.
                </p>
                <p>
                  • Permintaan perubahan password harus diajukan kepada <strong>Admin atau Bagian Administrasi</strong> untuk diverifikasi demi keamanan akun.
                </p>
                <p>
                  • Password Anda disimpan dengan metode <strong>PBKDF2 SHA-512 Kriptografi Salted Hashing</strong> (bukan teks biasa).
                </p>
              </div>

              {resetMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    resetMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {resetMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              {/* Formulir Pengajuan Tiket Perubahan Sandi ke Admin */}
              <form onSubmit={handleSubmitResetRequest} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Kata Sandi Baru yang Diajukan *
                  </label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Ulangi Kata Sandi Baru *
                  </label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang sandi baru"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Alasan Pengajuan Perubahan Password:
                  </label>
                  <textarea
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="Contoh: Permintaan ganti sandi baru / Menjaga keamanan akun..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReset || !resetNewPassword || !resetConfirmPassword}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                >
                  {submittingReset ? (
                    <span>Mengirimkan Tiket ke Admin...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Tiket Perubahan Sandi Baru ke Admin</span>
                    </>
                  )}
                </button>
              </form>

              {/* Riwayat Pengajuan Tiket Sandi (Termasuk Status Ditolak) */}
              <div className="pt-3 border-t border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span>Riwayat Tiket Sandi Perangkat</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadTickets}
                    disabled={loadingTickets}
                    className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingTickets ? 'animate-spin' : ''}`} />
                    <span>Perbarui Status</span>
                  </button>
                </div>

                {studentTickets.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-3 bg-white/90 rounded-xl border border-amber-100 text-center">
                    Belum ada riwayat pengajuan tiket sandi di perangkat ini.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {studentTickets.map((tkt) => {
                      const isRejected = tkt.status === 'rejected';
                      const isApproved = tkt.status === 'approved' || (tkt.status as string) === 'acc';

                      return (
                        <div
                          key={tkt.id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                            isRejected
                              ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                              : isApproved
                              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                              : 'bg-amber-50/95 border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                                {tkt.ticketNumber || tkt.id}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Diajukan: {new Date(tkt.createdAt).toLocaleString('id-ID')}
                              </p>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                isRejected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : isApproved
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-amber-500 text-white animate-pulse'
                              }`}
                            >
                              {isRejected ? 'DITOLAK' : isApproved ? 'ACC' : 'MENUNGGU VERIFIKASI'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 bg-white/70 p-1.5 rounded-lg border border-slate-100">
                            <span className="font-bold">Alasan Pengajuan:</span> {tkt.reason || '-'}
                          </p>

                          {isRejected && (
                            <div className="p-2.5 bg-rose-100/90 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                                <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>Status: Ditolak oleh Admin (Tercatat di History Device)</span>
                              </div>
                              {tkt.processedAt && (
                                <p className="text-[10px] text-rose-700">
                                  Ditolak pada: {new Date(tkt.processedAt).toLocaleString('id-ID')} {tkt.processedBy ? `oleh ${tkt.processedBy}` : ''}
                                </p>
                              )}
                              <p className="text-[11px] font-medium pt-0.5">
                                <strong className="text-rose-950">Alasan Penolakan:</strong> {tkt.adminNote || 'Tidak memenuhi kriteria verifikasi identitas'}
                              </p>
                            </div>
                          )}

                          {isApproved && (
                            <div className="p-2.5 bg-emerald-100/90 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                <span>Status: ACC (Disetujui oleh Admin)</span>
                              </div>
                              <p className="text-[10px] text-emerald-700">
                                Kata sandi baru Anda telah aktif dan otomatis diterapkan. Anda dapat masuk langsung menggunakan kata sandi baru.
                              </p>
                              {tkt.processedAt && (
                                <p className="text-[10px] text-emerald-700">
                                  Disetujui pada: {new Date(tkt.processedAt).toLocaleString('id-ID')}
                                </p>
                              )}
                              {tkt.adminNote && (
                                <p className="text-[11px]">
                                  <strong>Catatan:</strong> {tkt.adminNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Balik ke Halaman</span>
            </button>
          </div>
        )}
      </div>

      {/* Pembesar Foto Profil */}
      <ImageLightboxModal
        imageUrl={lightboxImage}
        title={`Foto Profil • ${currentUser.name}`}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
