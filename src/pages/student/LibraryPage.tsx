import React, { useState, useRef, useEffect } from 'react';
import {
  Library,
  BookOpen,
  ArrowLeft,
  Globe,
  RefreshCw,
  Copy,
  CheckCircle2,
  BookCheck,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { resolveUrl } from '../../lib/api.ts';

interface LibraryPageProps {
  onBack?: () => void;
  role?: 'guru' | 'siswa' | 'admin' | 'tata_usaha' | string;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onBack, role = 'siswa' }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('https://buku.kemendikdasmen.go.id/');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [isSlowLoading, setIsSlowLoading] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Timer untuk mendeteksi jaringan lambat saat memuat SIBI
  useEffect(() => {
    setIsSlowLoading(false);
    if (!iframeLoading) return;

    const timer = setTimeout(() => {
      if (iframeLoading) {
        setIsSlowLoading(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [iframeKey, iframeLoading]);

  const navigateTo = (url: string) => {
    setCurrentUrl(url);
    setIframeLoading(true);
    setIsSlowLoading(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setIframeLoading(true);
    setIsSlowLoading(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // URL iframe yang melewati proxy backend TAMVESTA (otomatis menggunakan backend production bila di APK)
  const proxyIframeSrc = resolveUrl(`/api/proxy/kemendikdasmen?url=${encodeURIComponent(currentUrl)}`);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 flex flex-col' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6'}`}>
      {/* Header Halaman Perpustakaan SIBI Kemendikdasmen */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </button>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-xs font-black text-emerald-200 border border-emerald-400/30">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>PERPUSTAKAAN SIBI KEMENDIKDASMEN RI</span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                Portal Buku & Modul Kemendikdasmen (In-App)
              </h1>

              <p className="text-xs sm:text-sm text-cyan-100 max-w-2xl leading-relaxed">
                Website Sistem Informasi Perbukuan Indonesia (SIBI) resmi dibuka langsung <strong>di dalam aplikasi TAMVESTA</strong> tanpa perlu keluar ke Google Chrome. Seluruh buku teks Kurikulum Merdeka, buku panduan guru, dan modul belajar dapat dicari dan diunduh langsung di sini.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-2 rounded-2xl bg-white/10 text-emerald-300 font-bold text-xs backdrop-blur-md border border-white/15 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>In-App Browser Aktif</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar Kontrol Navigasi & Pintasan Kategori SIBI */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-md space-y-3 shrink-0">
        {/* Bilah Alamat URL & Tombol Navigasi Cepat */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="w-full sm:flex-1 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <span className="text-teal-400 font-black shrink-0">SIBI:</span>
              <span className="font-mono text-slate-300 truncate select-all">{currentUrl}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              title="Salin Alamat Website"
            >
              {copiedUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salin</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              title="Muat Ulang Halaman SIBI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${iframeLoading ? 'animate-spin text-teal-400' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kecilkan</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Layar Penuh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tombol Pintasan Cepat Kategori SIBI Kemendikdasmen */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl === 'https://buku.kemendikdasmen.go.id/'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Beranda SIBI</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl.includes('buku-kurikulum-merdeka')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Kurikulum Merdeka</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/katalog/buku-teks-k13')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl.includes('buku-teks-k13')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <BookCheck className="w-3 h-3" />
            <span>Buku Teks K-13</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/katalog/buku-non-teks')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl.includes('buku-non-teks')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Buku Non-Teks</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/pencarian')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl.includes('pencarian')
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Cari Buku</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('https://buku.kemendikdasmen.go.id/katalog')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentUrl === 'https://buku.kemendikdasmen.go.id/katalog'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Library className="w-3 h-3" />
            <span>Semua Katalog</span>
          </button>
        </div>
      </div>

      {/* Frame Tampilan Website SIBI Kemendikdasmen di Dalam APK */}
      <div className={`relative w-full rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-200 transition-all ${
        isFullscreen ? 'flex-1 h-full' : 'h-[78vh] sm:h-[84vh]'
      }`}>
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xs text-white p-4 space-y-3">
            <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-slate-200 animate-pulse text-center">
              Memuat situs SIBI Kemendikdasmen langsung di dalam aplikasi...
            </p>
            <span className="text-[11px] text-teal-400 font-mono px-3 py-1 bg-slate-950 rounded-xl max-w-sm truncate">
              {currentUrl}
            </span>

            {isSlowLoading && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl max-w-md text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Koneksi ke Kemendikdasmen agak lambat</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Server SIBI Kemendikdasmen sedang merespons data buku. Jika terlalu lama, Anda dapat memuat ulang atau menekan tombol di bawah.
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Coba Muat Ulang</span>
                </button>
              </div>
            )}
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={proxyIframeSrc}
          className="w-full h-full border-0 bg-white"
          title="Portal SIBI Kemendikdasmen In-App"
          onLoad={() => setIframeLoading(false)}
        />
      </div>

      {/* Footer Info */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium px-2 pb-2">
          <span>© Sistem Informasi Perbukuan Indonesia (SIBI) — Kementerian Pendidikan Dasar dan Menengah RI</span>
          <span className="text-teal-700 font-bold">Terbuka di dalam Aplikasi TAMVESTA</span>
        </div>
      )}
    </div>
  );
};
