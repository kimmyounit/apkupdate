import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  FileText,
  Shield,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  User,
  School,
  Building,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Info,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type {
  LostFoundItem,
  LostFoundClaim,
  LostFoundType,
  ActivityPermission,
  AppReport,
  AppReportType,
} from '../../types/index.ts';

interface SchoolReportsPageProps {
  onBack?: () => void;
  defaultTab?: 'lost_found' | 'school_services';
}

export const SchoolReportsPage: React.FC<SchoolReportsPageProps> = ({
  onBack,
  defaultTab = 'lost_found',
}) => {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<'lost_found' | 'school_services'>(defaultTab);

  // -------------------------------------------------------------
  // TAB 1: LOST AND FOUND STATE
  // -------------------------------------------------------------
  const [lfItems, setLfItems] = useState<LostFoundItem[]>([]);
  const [lfFilterType, setLfFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [lfSearch, setLfSearch] = useState('');
  const [loadingLf, setLoadingLf] = useState(true);

  // Modal Buat Laporan Barang
  const [isLfModalOpen, setIsLfModalOpen] = useState(false);
  const [lfType, setLfType] = useState<LostFoundType>('lost');
  const [lfItemName, setLfItemName] = useState('');
  const [lfCategory, setLfCategory] = useState<any>('elektronik');
  const [lfDescription, setLfDescription] = useState('');
  const [lfLocation, setLfLocation] = useState('');
  const [lfStorageStatus, setLfStorageStatus] = useState<'masih_di_penemu' | 'diserahkan_ke_satpam'>('masih_di_penemu');
  const [lfPhotoUrl, setLfPhotoUrl] = useState<string | undefined>(undefined);
  const [isSubmittingLf, setIsSubmittingLf] = useState(false);

  // Modal Klaim Barang
  const [selectedItemToClaim, setSelectedItemToClaim] = useState<LostFoundItem | null>(null);
  const [claimReason, setClaimReason] = useState('');
  const [claimFeatures, setClaimFeatures] = useState('');
  const [claimInfo, setClaimInfo] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Detail Modal Barang
  const [viewingLfItem, setViewingLfItem] = useState<LostFoundItem | null>(null);

  // -------------------------------------------------------------
  // TAB 2: PERIZINAN & LAPORAN SEKOLAH STATE
  // -------------------------------------------------------------
  const [serviceSubTab, setServiceSubTab] = useState<'permission' | 'app_report'>('permission');

  // Activity Permissions
  const [permissions, setPermissions] = useState<ActivityPermission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permOrg, setPermOrg] = useState('');
  const [permName, setPermName] = useState('');
  const [permPurpose, setPermPurpose] = useState('');
  const [permLocation, setPermLocation] = useState('Aula Utama');
  const [permDate, setPermDate] = useState('');
  const [permStartTime, setPermStartTime] = useState('14:00');
  const [permEndTime, setPermEndTime] = useState('16:00');
  const [permCount, setPermCount] = useState(15);
  const [permTeacher, setPermTeacher] = useState('');
  const [permNotes, setPermNotes] = useState('');
  const [isSubmittingPerm, setIsSubmittingPerm] = useState(false);

  // App Reports
  const [appReports, setAppReports] = useState<AppReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<AppReportType>('error_bug');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportTargetHandler, setReportTargetHandler] = useState<'administrasi' | 'support'>('support');
  const [reportScreenshot, setReportScreenshot] = useState<string | undefined>(undefined);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Load Data
  const loadLfData = async () => {
    try {
      const items = await api.getLostFoundItems();
      setLfItems(items);
    } catch (_) {}
    setLoadingLf(false);
  };

  const loadServiceData = async () => {
    setLoadingPerms(true);
    setLoadingReports(true);
    try {
      const [pList, rList] = await Promise.all([
        api.getActivityPermissions().catch(() => []),
        api.getAppReports().catch(() => []),
      ]);
      setPermissions(pList);
      setAppReports(rList);
    } catch (_) {}
    setLoadingPerms(false);
    setLoadingReports(false);
  };

  useEffect(() => {
    loadLfData();
    loadServiceData();
  }, []);

  // Submit Lost & Found
  const handleSubmitLf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lfItemName.trim() || !lfDescription.trim() || !lfLocation.trim()) {
      alert('Nama barang, deskripsi, dan lokasi wajib diisi.');
      return;
    }

    setIsSubmittingLf(true);
    try {
      const created = await api.createLostFoundItem({
        type: lfType,
        itemName: lfItemName.trim(),
        category: lfCategory,
        photoUrl: lfPhotoUrl,
        description: lfDescription.trim(),
        location: lfLocation.trim(),
        dateTime: new Date().toISOString(),
        storageStatus: lfType === 'found' ? lfStorageStatus : undefined,
      });
      setLfItems((prev) => [created, ...prev]);
      setIsLfModalOpen(false);
      setLfItemName('');
      setLfDescription('');
      setLfLocation('');
      setLfPhotoUrl(undefined);
      alert('Laporan berhasil dikirim dan otomatis masuk ke Dashboard Guru, Pos Satpam, dan Tata Usaha (TU)!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan barang.');
    } finally {
      setIsSubmittingLf(false);
    }
  };

  // Submit Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemToClaim || !claimReason.trim() || !claimFeatures.trim()) {
      alert('Alasan klaim dan ciri-ciri khusus wajib diisi.');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const updated = await api.claimLostFoundItem(selectedItemToClaim.id, {
        reason: claimReason.trim(),
        identifyingFeatures: claimFeatures.trim(),
        additionalInfo: claimInfo.trim() || undefined,
      });
      setLfItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedItemToClaim(null);
      setClaimReason('');
      setClaimFeatures('');
      setClaimInfo('');
      alert('Pengajuan klaim berhasil dikirim! Guru, Satpam, dan Tata Usaha (TU) akan memeriksa bukti kepemilikan Anda.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pengajuan klaim.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Submit Activity Permission
  const handleSubmitPerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permOrg.trim() || !permName.trim() || !permDate || !permLocation.trim()) {
      alert('Organisasi, nama kegiatan, lokasi, dan tanggal wajib diisi.');
      return;
    }

    setIsSubmittingPerm(true);
    try {
      const perm = await api.createActivityPermission({
        organizationOrClass: permOrg.trim(),
        activityName: permName.trim(),
        purpose: permPurpose.trim(),
        requestedLocation: permLocation.trim(),
        activityDate: permDate,
        startTime: permStartTime,
        endTime: permEndTime,
        participantCount: Number(permCount) || 1,
        supervisorTeacher: permTeacher.trim(),
        additionalNotes: permNotes.trim() || undefined,
      });
      setPermissions((prev) => [perm, ...prev]);
      setIsPermModalOpen(false);
      setPermOrg('');
      setPermName('');
      setPermPurpose('');
      setPermDate('');
      setPermTeacher('');
      setPermNotes('');
      alert('Pengajuan izin kegiatan berhasil dikirim! Menunggu verifikasi pemeriksaan Satpam & persetujuan Kepala Sekolah.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim izin kegiatan.');
    } finally {
      setIsSubmittingPerm(false);
    }
  };

  // Submit App Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDesc.trim()) {
      alert('Judul dan penjelasan laporan wajib diisi.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const rep = await api.createAppReport({
        reportType,
        title: reportTitle.trim(),
        description: reportDesc.trim(),
        targetHandler: reportTargetHandler,
        screenshotUrl: reportScreenshot,
        incidentTime: new Date().toISOString(),
      });
      setAppReports((prev) => [rep, ...prev]);
      setIsReportModalOpen(false);
      setReportTitle('');
      setReportDesc('');
      setReportScreenshot(undefined);
      alert(`Laporan Anda telah dikirim ke tim ${reportTargetHandler === 'support' ? 'Support TAMVESTA' : 'Tata Usaha'}!`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan aplikasi.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Image Upload Helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Filtered Lost & Found items
  const filteredLfItems = lfItems.filter((i) => {
    const matchType = lfFilterType === 'all' || i.type === lfFilterType;
    const matchSearch =
      i.itemName.toLowerCase().includes(lfSearch.toLowerCase()) ||
      i.location.toLowerCase().includes(lfSearch.toLowerCase()) ||
      i.description.toLowerCase().includes(lfSearch.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-200/80 rounded-2xl text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Layanan & Sistem Laporan Sekolah
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Lost & Found, Perizinan Tempat/Kegiatan, dan Bantuan Aplikasi SMP Tamansiswa Batam
            </p>
          </div>
        </div>
      </div>

      {/* 2 MAIN TABS NAVIGASI */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl mb-6 max-w-md">
        <button
          onClick={() => setActiveMainTab('lost_found')}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeMainTab === 'lost_found'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Lost and Found</span>
        </button>

        <button
          onClick={() => setActiveMainTab('school_services')}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeMainTab === 'school_services'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Izin & Laporan</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LOST AND FOUND (BARANG HILANG & DITEMUKAN)             */}
      {/* ------------------------------------------------------------- */}
      {activeMainTab === 'lost_found' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setLfFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  lfFilterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({lfItems.length})
              </button>
              <button
                onClick={() => setLfFilterType('lost')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  lfFilterType === 'lost'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Barang Hilang
              </button>
              <button
                onClick={() => setLfFilterType('found')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  lfFilterType === 'found'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Barang Ditemukan
              </button>
            </div>

            {/* Search and Report Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lfSearch}
                  onChange={(e) => setLfSearch(e.target.value)}
                  placeholder="Cari barang atau lokasi..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={() => setIsLfModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Laporkan Barang
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingLf ? (
            <div className="text-center py-12 text-xs text-slate-400">Memuat data barang...</div>
          ) : filteredLfItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Laporan Barang</h3>
              <p className="text-xs text-slate-400 mt-1">
                Semua barang hilang atau ditemukan yang dilaporkan akan diverifikasi oleh Satpam Sekolah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLfItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image Thumbnail */}
                    {item.photoUrl ? (
                      <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                        <img
                          src={item.photoUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-md ${
                            item.type === 'found' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {item.type === 'found' ? 'Ditemukan' : 'Hilang'}
                        </span>
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-xs ${
                            item.type === 'found' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {item.type === 'found' ? 'Ditemukan' : 'Hilang'}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                          {item.itemName}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0 capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>

                      <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Pelapor: {item.reporterName} ({item.reporterKelas || '-'})
                          </span>
                        </div>
                        {item.storageStatus && (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {item.storageStatus === 'diserahkan_ke_satpam'
                                ? 'Diserahkan ke Pos Satpam'
                                : 'Masih di Penemu'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Action Buttons */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                        item.status === 'barang_telah_dikembalikan'
                          ? 'bg-slate-100 text-slate-600'
                          : item.status === 'barang_ditemukan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>

                    {/* Klaim Button: Only for found items and not yet returned */}
                    {item.type === 'found' &&
                      item.status !== 'barang_telah_dikembalikan' &&
                      item.reporterId !== user?.id && (
                        <button
                          onClick={() => setSelectedItemToClaim(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          Klaim Barang Ini
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PERIZINAN TEMPAT & LAPORAN SEKOLAH                     */}
      {/* ------------------------------------------------------------- */}
      {activeMainTab === 'school_services' && (
        <div className="space-y-4">
          {/* Sub Navigation */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setServiceSubTab('permission')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  serviceSubTab === 'permission'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <School className="w-4 h-4" />
                Izin Tempat & Kegiatan
              </button>

              <button
                onClick={() => setServiceSubTab('app_report')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  serviceSubTab === 'app_report'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Laporan Aplikasi TAMVESTA
              </button>
            </div>

            {serviceSubTab === 'permission' ? (
              <button
                onClick={() => setIsPermModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Ajukan Izin Tempat
              </button>
            ) : (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Buat Laporan / Tiket
              </button>
            )}
          </div>

          {/* Sub Tab A: Activity Permissions */}
          {serviceSubTab === 'permission' && (
            <div className="space-y-3">
              {loadingPerms ? (
                <div className="text-center py-10 text-xs text-slate-400">Memuat data perizinan...</div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6">
                  <p className="text-xs text-slate-500">
                    Belum ada pengajuan izin tempat kegiatan ekstrakurikuler, latihan musik, atau pentas seni.
                  </p>
                </div>
              ) : (
                permissions.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          {p.organizationOrClass}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{p.activityName}</h3>
                        <p className="text-xs text-slate-500">{p.purpose}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                            p.status === 'disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'ditolak'
                              ? 'bg-rose-100 text-rose-800'
                              : p.status === 'perlu_revisi'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.status === 'disetujui' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {p.status === 'ditolak' && <XCircle className="w-3.5 h-3.5" />}
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Tempat:</span>
                        <span className="font-bold text-slate-800">{p.requestedLocation}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Tanggal:</span>
                        <span className="font-bold text-slate-800">{p.activityDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Waktu:</span>
                        <span className="font-bold text-slate-800">
                          {p.startTime} - {p.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Guru Pembimbing:</span>
                        <span className="font-bold text-slate-800">{p.supervisorTeacher || '-'}</span>
                      </div>
                    </div>

                    {/* Step Timeline Indicator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>
                          Satpam:{' '}
                          <strong className={p.satpamReview ? 'text-emerald-700' : 'text-slate-400'}>
                            {p.satpamReview ? 'Sudah Diperiksa' : 'Menunggu Pemeriksaan'}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <School className="w-4 h-4 text-purple-600" />
                        <span>
                          Kepala Sekolah:{' '}
                          <strong className={p.principalDecision ? 'text-emerald-700' : 'text-slate-400'}>
                            {p.principalDecision ? (p.principalDecision.approved ? 'Disetujui' : 'Ditolak/Revisi') : 'Menunggu Keputusan'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Catatan Kepsek / Satpam jika ada */}
                    {(p.satpamReview?.notes || p.principalDecision?.revisionNote || p.principalDecision?.rejectionReason) && (
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                        {p.satpamReview?.notes && (
                          <p className="text-slate-700">
                            <strong>Catatan Satpam:</strong> {p.satpamReview.notes}
                          </p>
                        )}
                        {p.principalDecision?.revisionNote && (
                          <p className="text-amber-800 font-medium">
                            <strong>Catatan Revisi Kepsek:</strong> {p.principalDecision.revisionNote}
                          </p>
                        )}
                        {p.principalDecision?.rejectionReason && (
                          <p className="text-rose-800 font-medium">
                            <strong>Alasan Penolakan:</strong> {p.principalDecision.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub Tab B: App Reports */}
          {serviceSubTab === 'app_report' && (
            <div className="space-y-3">
              {loadingReports ? (
                <div className="text-center py-10 text-xs text-slate-400">Memuat tiket laporan...</div>
              ) : appReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6">
                  <p className="text-xs text-slate-500">
                    Belum ada tiket laporan aplikasi yang dibuat. Jika mengalami kendala teknis atau pertanyaan administrasi, silakan ajukan laporan.
                  </p>
                </div>
              ) : (
                appReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              r.targetHandler === 'support'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            Tujuan: {r.targetHandler === 'support' ? 'Support TAMVESTA' : 'Tata Usaha'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900">{r.title}</h3>
                        <p className="text-xs text-slate-600 mt-1">{r.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                            r.status === 'selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'ditolak'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Screenshot if any */}
                    {r.screenshotUrl && (
                      <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200">
                        <img src={r.screenshotUrl} alt="Screenshot" className="w-full object-cover max-h-36" />
                      </div>
                    )}

                    {/* Official Response from TU or Support */}
                    {(r.adminResponse || r.supportResponse) && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
                        {r.adminResponse && (
                          <div>
                            <span className="font-bold text-teal-900 block">
                              Tanggapan Tata Usaha ({r.adminResponse.respondedBy}):
                            </span>
                            <p className="text-slate-700">{r.adminResponse.message}</p>
                          </div>
                        )}
                        {r.supportResponse && (
                          <div>
                            <span className="font-bold text-cyan-900 block">
                              Tanggapan Support TAMVESTA ({r.supportResponse.respondedBy}):
                            </span>
                            <p className="text-slate-700">{r.supportResponse.technicalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL BUAT LAPORAN BARANG HILANG / DITEMUKAN                 */}
      {/* ------------------------------------------------------------- */}
      {isLfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                Laporan Lost and Found
              </h3>
              <button onClick={() => setIsLfModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLf} className="mt-4 space-y-3.5">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setLfType('lost')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    lfType === 'lost' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Saya Kehilangan Barang
                </button>
                <button
                  type="button"
                  onClick={() => setLfType('found')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    lfType === 'found' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Saya Menemukan Barang
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={lfItemName}
                  onChange={(e) => setLfItemName(e.target.value)}
                  placeholder="Misal: Dompet Hitam, Kunci Motor Honda, Jam Tangan Casio..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={lfCategory}
                    onChange={(e) => setLfCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="elektronik">Elektronik / HP</option>
                    <option value="alat_tulis">Alat Tulis</option>
                    <option value="buku_dokumen">Buku / Dokumen</option>
                    <option value="pakaian_aksesoris">Pakaian / Aksesoris</option>
                    <option value="uang_dompet">Uang / Dompet</option>
                    <option value="kunci">Kunci Kendaraan / Ruangan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi Kejadian *</label>
                  <input
                    type="text"
                    required
                    value={lfLocation}
                    onChange={(e) => setLfLocation(e.target.value)}
                    placeholder="Misal: Kantin, Lab IPA, Lapangan..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {lfType === 'found' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Keberadaan Barang</label>
                  <select
                    value={lfStorageStatus}
                    onChange={(e) => setLfStorageStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="masih_di_penemu">Masih saya simpan sendiri</option>
                    <option value="diserahkan_ke_guru">Sudah diserahkan ke Bapak/Ibu Guru</option>
                    <option value="diserahkan_ke_satpam">Sudah diserahkan ke Pos Satpam Sekolah</option>
                    <option value="diserahkan_ke_tu">Sudah diserahkan ke Ruang Tata Usaha (TU)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Lengkap *</label>
                <textarea
                  required
                  rows={3}
                  value={lfDescription}
                  onChange={(e) => setLfDescription(e.target.value)}
                  placeholder="Jelaskan warna, tanda khusus, perkiraan jam hilang/ditemukan..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Foto Upload */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Foto Barang (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, setLfPhotoUrl)}
                  className="w-full text-xs file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 file:font-bold hover:file:bg-slate-200"
                />
                {lfPhotoUrl && (
                  <img src={lfPhotoUrl} alt="Preview" className="mt-2 h-24 rounded-xl object-cover border" />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLfModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLf}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingLf ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL KLAIM KEPEMILIKAN BARANG                                */}
      {/* ------------------------------------------------------------- */}
      {selectedItemToClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Klaim Kepemilikan Barang
              </h3>
              <button onClick={() => setSelectedItemToClaim(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-emerald-50 rounded-2xl text-xs text-emerald-950">
              Anda mengklaim barang: <strong>{selectedItemToClaim.itemName}</strong>. Bukti kepemilikan Anda akan diverifikasi oleh Satpam Sekolah.
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alasan & Kronologi Kehilangan *
                </label>
                <textarea
                  required
                  rows={2}
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  placeholder="Kapan dan di mana Anda merasa kehilangan barang ini..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ciri-Ciri Khusus / Bukti Rahasia yang Hanya Anda Tahu *
                </label>
                <textarea
                  required
                  rows={3}
                  value={claimFeatures}
                  onChange={(e) => setClaimFeatures(e.target.value)}
                  placeholder="Misal: Nomor seri di casing, warna gantungan, goresan di sudut, isi struk/uang di dalam dompet..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor HP / WhatsApp untuk Dihubungi Satpam
                </label>
                <input
                  type="text"
                  value={claimInfo}
                  onChange={(e) => setClaimInfo(e.target.value)}
                  placeholder="0812xxxx..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemToClaim(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingClaim ? 'Mengirim...' : 'Kirim Klaim ke Satpam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL AJUKAN IZIN TEMPAT & KEGIATAN                           */}
      {/* ------------------------------------------------------------- */}
      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                Pengajuan Izin Tempat & Kegiatan
              </h3>
              <button onClick={() => setIsPermModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPerm} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Organisasi / Kelas *</label>
                  <input
                    type="text"
                    required
                    value={permOrg}
                    onChange={(e) => setPermOrg(e.target.value)}
                    placeholder="Misal: Ekskul Musik, Tari, OSIS, Kelas 8A..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={permName}
                    onChange={(e) => setPermName(e.target.value)}
                    placeholder="Misal: Latihan Tari Kreasi, Rapat Acara..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tujuan Kegiatan</label>
                <input
                  type="text"
                  value={permPurpose}
                  onChange={(e) => setPermPurpose(e.target.value)}
                  placeholder="Persiapan lomba, latihan mingguan, atau kegiatan pentas seni..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tempat yang Diajukan *</label>
                  <select
                    value={permLocation}
                    onChange={(e) => setPermLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Aula Utama">Aula Utama Tamansiswa</option>
                    <option value="Lapangan Olahraga">Lapangan Olahraga</option>
                    <option value="Ruang Tari & Kesenian">Ruang Tari & Kesenian</option>
                    <option value="Ruang Musik & Band">Ruang Musik & Band</option>
                    <option value="Lab Komputer">Lab Komputer</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={permDate}
                    onChange={(e) => setPermDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={permStartTime}
                    onChange={(e) => setPermStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={permEndTime}
                    onChange={(e) => setPermEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Peserta (Orang)</label>
                  <input
                    type="number"
                    min={1}
                    value={permCount}
                    onChange={(e) => setPermCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Guru Pendamping / Pembina</label>
                <input
                  type="text"
                  value={permTeacher}
                  onChange={(e) => setPermTeacher(e.target.value)}
                  placeholder="Misal: Ibu Nining, Pak Eko..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPerm}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSubmittingPerm ? 'Mengirim...' : 'Kirim Pengajuan Izin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL LAPORAN APLIKASI TAMVESTA                               */}
      {/* ------------------------------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Laporan Bantuan & Kendala TAMVESTA
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jenis Kendala *</label>
                <select
                  value={reportType}
                  onChange={(e) => {
                    const val = e.target.value as AppReportType;
                    setReportType(val);
                    if (val === 'error_bug' || val === 'tidak_bisa_login' || val === 'fitur_tidak_berfungsi') {
                      setReportTargetHandler('support');
                    } else {
                      setReportTargetHandler('administrasi');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="error_bug">Error / Bug Teknis Aplikasi</option>
                  <option value="tidak_bisa_login">Tidak Bisa Login / Kendala Sandi</option>
                  <option value="akun_bermasalah">Data Akun Sekolah Tidak Sesuai</option>
                  <option value="fitur_tidak_berfungsi">Fitur Tidak Berfungsi</option>
                  <option value="saran_fitur">Saran / Permintaan Fitur Baru</option>
                  <option value="kendala_penggunaan">Pertanyaan Penggunaan Umum</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tujuan Penanganan Laporan</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setReportTargetHandler('support')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      reportTargetHandler === 'support' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Support TAMVESTA (Teknis/Bug)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTargetHandler('administrasi')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      reportTargetHandler === 'administrasi' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tata Usaha (Administrasi)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Laporan *</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Misal: Tombol submit tidak merespons, NISN di profil salah..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Penjelasan Detail Kendala *</label>
                <textarea
                  required
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Tuliskan kronologi dan halaman tempat kendala muncul..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tangkapan Layar (Screenshot)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, setReportScreenshot)}
                  className="w-full text-xs file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 file:font-bold hover:file:bg-slate-200"
                />
                {reportScreenshot && (
                  <img src={reportScreenshot} alt="Preview" className="mt-2 h-24 rounded-xl object-cover border" />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  {isSubmittingReport ? 'Mengirim...' : 'Kirim Tiket Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
