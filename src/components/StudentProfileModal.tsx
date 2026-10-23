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
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { User } from '../types/index.ts';
import { api, setStoredToken } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface Props {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<Props> = ({ user: initialUser, isOpen, onClose }) => {
  const { refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<'qr' | 'settings'>('qr');

  // QR States
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(true);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Username Update States
  const [newUsername, setNewUsername] = useState(initialUser.username);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset Request Ticket States
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setCurrentUser(initialUser);
    setNewUsername(initialUser.username);
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

    if (!resetReason.trim()) {
      setResetMessage({ type: 'error', text: 'Silakan isi alasan pengajuan perubahan password.' });
      return;
    }

    setSubmittingReset(true);
    try {
      const res = await api.requestPasswordReset({ username: '', reason: resetReason.trim() });
      setResetMessage({
        type: 'success',
        text: res.message || 'Permintaan berhasil diajukan ke Admin. Admin akan melakukan verifikasi sebelum memproses.',
      });
      setResetReason('');
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
                      Kartu Absensi Siswa
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
                <div className="relative shrink-0">
                  <img
                    src={
                      currentUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=0284c7`
                    }
                    alt={currentUser.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-slate-100"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </span>
                </div>
                <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {currentUser.name}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-600">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                      @{currentUser.username}
                    </span>
                    {currentUser.kelas && (
                      <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {currentUser.kelas}
                      </span>
                    )}
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
              <form onSubmit={handleSubmitResetRequest} className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Alasan Pengajuan Perubahan Password:
                </label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Contoh: Lupa password akun / Permintaan perbaruan sandi berkala untuk keamanan..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={submittingReset || !resetReason.trim()}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                >
                  {submittingReset ? (
                    <span>Mengirimkan Tiket ke Admin...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Permintaan Perubahan Password ke Admin</span>
                    </>
                  )}
                </button>
              </form>
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
    </div>
  );
};
