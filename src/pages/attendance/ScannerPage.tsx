import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  MapPin,
  ChevronRight,
  UserCheck,
  Laptop,
  Lock,
  Unlock,
  ArrowLeft,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api.ts';
import type { AttendanceEvent, AttendanceRecord, ScanResultPayload } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

// Simple synthesized beep sound using Web Audio API
function playScanSound(isSuccess: boolean) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio might be blocked by browser autoplay policy until user gesture
  }
}

export const ScannerPage: React.FC<{ onBackToDashboard?: () => void }> = ({ onBackToDashboard }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<(AttendanceEvent & { totalAttendees?: number })[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResultPayload | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [processingScan, setProcessingScan] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'tamvesta-qr-reader-laptop';

  // Load events
  const loadEvents = async () => {
    try {
      const data = await api.getAttendanceEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        // default to first active event or first event
        const active = data.find((e) => e.isOpen) || data[0];
        setSelectedEventId(active.id);
      }
    } catch (err) {
      console.error('Failed to load attendance events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load records for selected event
  const loadRecords = async (eventId: string) => {
    if (!eventId) return;
    try {
      const data = await api.getAttendanceRecords(eventId);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRecords(selectedEventId);
    }
  }, [selectedEventId]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Toggle Session Buka / Tutup
  const handleToggleSession = async () => {
    if (!selectedEventId) return;
    try {
      const res = await api.toggleEventSession(selectedEventId);
      // update state
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEventId ? { ...e, isOpen: res.isOpen } : e))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status sesi.');
    }
  };

  // Process QR Data through backend
  const handleProcessQr = async (qrString: string) => {
    if (processingScan || !selectedEventId) return;
    setProcessingScan(true);

    try {
      const result = await api.scanQr({
        qrData: qrString,
        eventId: selectedEventId,
      });

      setLastScanResult(result);

      if (result.status === 'SUCCESS') {
        playScanSound(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        // Refresh records & event live counts immediately
        await loadRecords(selectedEventId);
        await loadEvents();
      } else {
        playScanSound(false);
      }
    } catch (err: any) {
      playScanSound(false);
      setLastScanResult({
        status: 'SERVER_ERROR',
        message: err.message || 'VERIFIKASI GAGAL — SILAKAN COBA LAGI',
        scanTime: new Date().toISOString(),
      });
    } finally {
      setTimeout(() => {
        setProcessingScan(false);
      }, 1200); // 1.2s debounce to prevent fast accidental multi-scans
    }
  };

  // Start Camera
  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessQr(decodedText);
        },
        () => {
          // Frame parse error (ignore standard scan misses)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak oleh browser. Pastikan webcam laptop aktif dan izin kamera telah diberikan.'
      );
      setIsScanning(false);
    }
  };

  // Stop Camera
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setIsScanning(false);
  };

  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessQr(manualCode.trim());
    setManualCode('');
  };

  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      r.username.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (r.kelas && r.kelas.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Station Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition mb-2.5 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Balik ke Halaman Dashboard</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" /> STASIUN PEMINDAI LAPTOP PANITIA
            </span>
            <span className="text-xs text-slate-400">Waktu Server (WIB)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-white">
            Absensi QR Code Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Event Sekolah & Kegiatan OSIS Perguruan Tamansiswa Batam
          </p>
        </div>

        {/* Event Selector & Session Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700">
            <label className="block text-[10px] text-slate-400 uppercase font-bold px-2 mb-1">
              Pilih Kegiatan / Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-900 text-white font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.isOpen ? '🟢 [AKTIF] ' : '🔴 [TUTUP] '} {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedEvent && (
              <>
                <button
                  onClick={handleToggleSession}
                  className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black shadow-md transition active:scale-95 whitespace-nowrap ${
                    selectedEvent.isOpen
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {selectedEvent.isOpen ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Tutup Sesi</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Buka Sesi</span>
                    </>
                  )}
                </button>

                <a
                  href={api.getExportUrl(selectedEvent.id)}
                  download
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-2xl text-xs font-bold shadow-md transition"
                  title="Ekspor CSV Laporan Absensi"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Ekspor CSV</span>
                </a>
              </>
            )}

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 whitespace-nowrap"
                title="Balik ke Halaman"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Balik ke Halaman</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Scanner & Live Verification Card, Right = Live Attendance List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CAMERA & RESULT DISPLAY (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Event Status Bar */}
          {selectedEvent && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                    selectedEvent.isOpen ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{selectedEvent.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedEvent.category} • {selectedEvent.location} • {selectedEvent.eventDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    selectedEvent.isOpen
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {selectedEvent.isOpen ? 'SESI DIBUKA' : 'SESI DITUTUP'}
                </span>
                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hadir</span>
                  <span className="text-lg font-black text-emerald-700 leading-none">
                    {records.length} Siswa
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* LARGE & CLEAR VERIFICATION RESULT DISPLAY (Critical Requirement 9.C & 9.D) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-md overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
                  Panel Hasil Pemindaian & Verifikasi
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {processingScan ? 'Memproses Verifikasi...' : 'Siap Memindai'}
              </span>
            </div>

            {lastScanResult ? (
              <div
                className={`rounded-2xl p-6 border-2 transition-all animate-in zoom-in-95 ${
                  lastScanResult.status === 'SUCCESS'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950'
                    : lastScanResult.status === 'ALREADY_SCANNED'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-950'
                    : 'bg-rose-500/10 border-rose-500 text-rose-950'
                }`}
              >
                {/* Status Big Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {lastScanResult.status === 'SUCCESS' && (
                      <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                    )}
                    {lastScanResult.status === 'ALREADY_SCANNED' && (
                      <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/30">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                    )}
                    {(lastScanResult.status === 'INVALID_QR' ||
                      lastScanResult.status === 'ACCOUNT_INACTIVE' ||
                      lastScanResult.status === 'SESSION_CLOSED' ||
                      lastScanResult.status === 'SERVER_ERROR') && (
                      <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/30">
                        <XCircle className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        STATUS HASIL SCAN
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        {lastScanResult.status === 'SUCCESS' && 'TELAH MASUK — VERIFIKASI BERHASIL'}
                        {lastScanResult.status === 'ALREADY_SCANNED' && 'SUDAH ABSEN'}
                        {lastScanResult.status === 'INVALID_QR' && 'QR CODE TIDAK VALID'}
                        {lastScanResult.status === 'ACCOUNT_INACTIVE' && 'AKUN TIDAK AKTIF'}
                        {lastScanResult.status === 'SESSION_CLOSED' && 'SESI ABSENSI DITUTUP'}
                        {lastScanResult.status === 'SERVER_ERROR' && 'VERIFIKASI GAGAL'}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Verification Fields Grid (Easy to read from a distance for laptop panitia) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 shadow-xs text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Siswa</span>
                    <strong className="text-base sm:text-lg font-black text-slate-900 block truncate">
                      {lastScanResult.student?.name || '-'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Username / Akun</span>
                    <strong className="font-mono text-sm sm:text-base font-bold text-slate-800 block">
                      @{lastScanResult.student?.username || '-'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Status Absensi</span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md text-xs">
                      {lastScanResult.status === 'SUCCESS' ? 'TELAH MASUK' : lastScanResult.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Verifikasi</span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-teal-100 text-teal-800 font-black rounded-md text-xs">
                      {lastScanResult.status === 'SUCCESS' ? 'BERHASIL' : 'DITOLAK / PERINGATAN'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kegiatan</span>
                    <strong className="text-slate-800 block truncate">
                      {lastScanResult.event?.name || selectedEvent?.name || '-'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Masuk</span>
                    <span className="font-mono font-bold text-slate-700 block">
                      {new Date(lastScanResult.scanTime || Date.now()).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}{' '}
                      WIB
                    </span>
                  </div>
                </div>

                <p className="text-xs font-medium mt-3 text-slate-600">
                  Pesan: <strong>{lastScanResult.message}</strong>
                </p>
              </div>
            ) : (
              <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700">Belum Ada QR Code yang Dipindai</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Arahkan kamera webcam laptop ke QR Code pada kartu siswa atau ketik username siswa di bawah.
                </p>
              </div>
            )}
          </div>

          {/* CAMERA VIEWPORT CONTAINER */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Kamera Pemindai Laptop</h3>
                <p className="text-xs text-slate-500">Gunakan webcam laptop terintegrasi atau webcam eksternal</p>
              </div>

              <button
                onClick={isScanning ? stopCameraScanner : startCameraScanner}
                disabled={!selectedEvent?.isOpen && !isScanning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95 ${
                  isScanning
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white'
                }`}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    <span>Hentikan Kamera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Mulai Pemindaian</span>
                  </>
                )}
              </button>
            </div>

            {cameraError && (
              <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                {cameraError}
              </div>
            )}

            {/* Video Viewport */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[280px] flex items-center justify-center border border-slate-800">
              <div id={scannerContainerId} className="w-full h-full max-w-md mx-auto" />
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Kamera Belum Aktif</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik "Mulai Pemindaian" untuk menyalakan kamera laptop
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Check-in Fallback Input */}
            <form onSubmit={handleManualCheckin} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Check-in manual (masukkan username / ID siswa)..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
              <button
                type="submit"
                disabled={processingScan || !manualCode.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition"
              >
                Verifikasi Manual
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ATTENDANCE TABLE & STATS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Kehadiran Siswa</span>
                </h3>
                <p className="text-[11px] text-slate-500">Tersinkronisasi otomatis secara langsung</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedEventId && loadRecords(selectedEventId)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Segarkan data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  {records.length} Hadir
                </span>
              </div>
            </div>

            {/* Search Attendee */}
            <div className="relative">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari nama atau username siswa..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Attendees List / Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[550px]">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  {records.length === 0
                    ? 'Belum ada siswa yang hadir pada kegiatan ini.'
                    : 'Tidak ada siswa yang cocok dengan pencarian.'}
                </div>
              ) : (
                filteredRecords.map((rec, i) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{rec.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          @{rec.username} {rec.kelas ? `• ${rec.kelas}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] border border-emerald-200">
                        TELAH MASUK
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(rec.verifiedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            {selectedEvent && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Panitia: <strong>{user?.username}</strong></span>
                <a
                  href={api.getExportUrl(selectedEvent.id)}
                  download
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Laporan CSV
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
