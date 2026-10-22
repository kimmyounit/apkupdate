import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  Copy,
  Check,
  School,
  Sparkles,
  User,
  ShieldCheck,
  Search,
  Upload,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserProfileModal } from '../../components/UserProfileModal.tsx';

export const StudentQrPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_qr' | 'scanner'>('my_qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Scanner state
  const [scannedUsername, setScannedUsername] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Safe QR payload without password or secrets
  const qrContent = user ? `tamvesta://profile/${user.username}` : '';

  useEffect(() => {
    if (qrContent) {
      QRCode.toDataURL(qrContent, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b', // Deep emerald
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [qrContent]);

  // Setup html5-qrcode scanner when scanner tab is opened
  useEffect(() => {
    if (activeTab === 'scanner') {
      const scannerId = 'tamvesta-qr-reader';
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            scannerId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
            },
            false
          );

          scanner.render(
            (decodedText) => {
              // Parse scanned QR
              handleProcessScannedText(decodedText);
            },
            (error) => {
              // Normal continuous scan status, no need to alert
            }
          );

          scannerRef.current = scanner;
        } catch (err: any) {
          console.warn('Scanner init error:', err);
          setScannerError('Kamera tidak dapat diakses atau izin belum diberikan.');
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [activeTab]);

  const handleProcessScannedText = (text: string) => {
    let username = '';
    if (text.startsWith('tamvesta://profile/')) {
      username = text.replace('tamvesta://profile/', '').trim();
    } else if (text.startsWith('tamvesta://student/')) {
      username = text.replace('tamvesta://student/', '').trim();
    } else if (text.startsWith('TAMVESTA:STUDENT:')) {
      // Legacy QR token format: extract username or student id
      const parts = text.split(':');
      username = parts[2] || '';
    } else {
      username = text.trim();
    }

    if (username) {
      setScannedUsername(username);
    }
  };

  const handleCopyQrLink = () => {
    if (qrContent) {
      navigator.clipboard.writeText(qrContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Top Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('my_qr')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'my_qr'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Siswa Saya</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'scanner'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Pindai QR Teman</span>
        </button>
      </div>

      {activeTab === 'my_qr' ? (
        /* ---------------- MY QR STUDENT CARD ---------------- */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Header Sekolah */}
            <div className="w-full pb-4 border-b border-slate-100 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/20 shadow-xs">
                  <img
                    src="/assets/tamvesta_mascot.jpg"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900">
                    KARTU IDENTITAS DIGITAL
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Perguruan Tamansiswa Batam
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Resmi
              </span>
            </div>

            {/* Student Info */}
            <div className="my-5 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-md mb-2 bg-slate-100">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user?.name || 'Siswa'
                    )}&backgroundColor=0284c7`
                  }
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-lg font-black text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">@{user?.username}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 font-semibold">
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                  Kelas: {user?.kelas || 'Tamansiswa'}
                </span>
                {user?.nisn && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono">
                    NISN: {user.nisn}
                  </span>
                )}
              </div>
            </div>

            {/* QR Code Graphic */}
            <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/20 shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Student QR Code"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
                />
              ) : (
                <div className="w-52 h-52 bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 max-w-xs leading-relaxed">
              Tunjukkan QR Code ini kepada teman untuk saling mengikuti atau saat pemindaian absensi kegiatan sekolah.
            </p>

            {/* Safe Security Notice */}
            <div className="w-full mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>QR Code ini terlindungi dan tidak mengandung data rahasia.</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCopyQrLink}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tautan QR Disalin!' : 'Salin Tautan Profil QR'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- SCANNER TAB ---------------- */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm text-slate-900">
                Pindai QR Code Siswa atau Guru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Arahkan kamera ke kartu QR teman Anda untuk langsung melihat profilnya
              </p>
            </div>

            {/* html5-qrcode scanner viewport */}
            <div
              id="tamvesta-qr-reader"
              className="rounded-2xl overflow-hidden border border-slate-200"
            />

            {scannerError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                {scannerError}
              </div>
            )}

            {/* Manual Username Search as Fallback */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Atau Cari Berdasarkan Username:
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ketik username siswa (misal: bintang.siswa)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  onClick={() => {
                    if (manualInput.trim()) {
                      setScannedUsername(manualInput.trim());
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Buka
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal when scanned */}
      {scannedUsername && (
        <UserProfileModal
          isOpen={true}
          username={scannedUsername}
          currentUserId={user?.id}
          onClose={() => setScannedUsername(null)}
        />
      )}
    </div>
  );
};
