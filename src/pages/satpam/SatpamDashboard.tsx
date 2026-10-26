import React, { useState, useEffect } from 'react';
import {
  Shield,
  HelpCircle,
  School,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Building,
  Calendar,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type {
  LostFoundItem,
  LostFoundClaim,
  ActivityPermission,
} from '../../types/index.ts';

export const SatpamDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'lost_found' | 'facility_checks'>('lost_found');

  // Lost and Found
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');

  // Claim Review Modal
  const [reviewingClaim, setReviewingClaim] = useState<{
    item: LostFoundItem;
    claim: LostFoundClaim;
  } | null>(null);
  const [satpamNoteInput, setSatpamNoteInput] = useState('');
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Facility / Activity Permissions
  const [permissions, setPermissions] = useState<ActivityPermission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(true);

  // Permission Review Modal
  const [reviewingPerm, setReviewingPerm] = useState<ActivityPermission | null>(null);
  const [safetyChecked, setSafetyChecked] = useState(true);
  const [facilityAvailable, setFacilityAvailable] = useState(true);
  const [permNotes, setPermNotes] = useState('');
  const [isProcessingPerm, setIsProcessingPerm] = useState(false);

  const loadData = async () => {
    try {
      const [lfList, permList] = await Promise.all([
        api.getLostFoundItems().catch(() => []),
        api.getActivityPermissions().catch(() => []),
      ]);
      setItems(lfList);
      setPermissions(permList);
    } catch (_) {}
    setLoadingItems(false);
    setLoadingPerms(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update Item Status
  const handleUpdateItemStatus = async (itemId: string, newStatus: any) => {
    try {
      const updated = await api.updateLostFoundItem(itemId, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    }
  };

  // Process Claim
  const handleProcessClaim = async (status: 'disetujui' | 'ditolak' | 'barang_telah_dikembalikan') => {
    if (!reviewingClaim) return;
    setIsProcessingClaim(true);
    try {
      const updated = await api.updateLostFoundClaim(
        reviewingClaim.item.id,
        reviewingClaim.claim.id,
        {
          status,
          satpamNotes: satpamNoteInput.trim() || undefined,
        }
      );
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setReviewingClaim(null);
      setSatpamNoteInput('');
      alert(`Klaim barang berhasil diperbarui: ${status.replace(/_/g, ' ')}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses klaim');
    } finally {
      setIsProcessingClaim(false);
    }
  };

  // Process Permission Review
  const handleReviewPermission = async () => {
    if (!reviewingPerm) return;
    setIsProcessingPerm(true);
    try {
      const updated = await api.reviewActivityPermissionSatpam(reviewingPerm.id, {
        safetyChecked,
        facilityAvailable,
        notes: permNotes.trim() || undefined,
      });
      setPermissions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setReviewingPerm(null);
      setPermNotes('');
      alert('Pemeriksaan Satpam selesai dan diteruskan ke Kepala Sekolah!');
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pemeriksaan izin');
    } finally {
      setIsProcessingPerm(false);
    }
  };

  const filteredItems = items.filter((i) => {
    const matchType = filterType === 'all' || i.type === filterType;
    const matchSearch =
      i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Header Pos Satpam */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
            <Shield className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
              Keamanan & Ketertiban Sekolah
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              Pos Satpam SMP Tamansiswa Batam
            </h1>
            <p className="text-xs text-amber-100">
              Petugas: <strong>{user?.name || 'Angga (Satpam Sekolah)'}</strong> • Pengelolaan Lost & Found dan Keamanan Fasilitas
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-white/20"
        >
          <RefreshCw className="w-4 h-4" />
          Segarkan Data
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('lost_found')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === 'lost_found'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-600" />
          Lost and Found ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('facility_checks')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === 'facility_checks'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4 text-amber-600" />
          Pemeriksaan Fasilitas ({permissions.filter((p) => p.status === 'menunggu_satpam').length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: LOST AND FOUND VERIFICATION & CLAIMS               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'lost_found' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Semua Laporan
              </button>
              <button
                onClick={() => setFilterType('lost')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterType === 'lost' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Barang Hilang
              </button>
              <button
                onClick={() => setFilterType('found')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  filterType === 'found' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Barang Ditemukan
              </button>
            </div>

            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barang atau pelapor..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Items List */}
          {loadingItems ? (
            <div className="text-center py-10 text-xs text-slate-400">Memuat laporan barang...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 text-xs text-slate-500">
              Belum ada laporan barang yang masuk ke Pos Satpam.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                            item.type === 'found' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {item.type === 'found' ? 'Ditemukan' : 'Hilang'}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{item.itemName}</h3>
                        <p className="text-xs text-slate-600">{item.description}</p>
                      </div>

                      {item.photoUrl && (
                        <img
                          src={item.photoUrl}
                          alt={item.itemName}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Pelapor:</span>
                        <span className="font-bold text-slate-800">
                          {item.reporterName} ({item.reporterKelas || '-'})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Lokasi:</span>
                        <span className="font-bold text-slate-800">{item.location}</span>
                      </div>
                      {item.storageStatus && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block font-semibold">Penyimpanan:</span>
                          <span className="font-bold text-amber-800">
                            {item.storageStatus === 'diserahkan_ke_satpam'
                              ? 'Telah diserahkan ke Pos Satpam'
                              : 'Masih di tangan penemu'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Claims Section */}
                    {item.claims && item.claims.length > 0 && (
                      <div className="pt-2 border-t border-amber-100 bg-amber-50/60 p-3 rounded-2xl space-y-2">
                        <span className="text-[11px] font-black text-amber-900 block">
                          Daftar Siswa Mengklaim Kepemilikan ({item.claims.length}):
                        </span>
                        {item.claims.map((claim) => (
                          <div
                            key={claim.id}
                            className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {claim.claimantName} ({claim.claimantKelas || '-'})
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                Ciri: {claim.identifyingFeatures}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setReviewingClaim({ item, claim });
                                setSatpamNoteInput(claim.satpamNotes || '');
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0"
                            >
                              Periksa Klaim
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown Controls for Satpam */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status Laporan:</span>
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateItemStatus(item.id, e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="menunggu_pemeriksaan">Menunggu Pemeriksaan</option>
                      <option value="sedang_ditindaklanjuti">Sedang Ditindaklanjuti</option>
                      <option value="barang_ditemukan">Barang Ditemukan</option>
                      <option value="menunggu_pengambilan">Menunggu Pengambilan</option>
                      <option value="barang_telah_dikembalikan">Barang Telah Dikembalikan</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: PEMERIKSAAN FASILITAS & IZIN TEMPAT               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'facility_checks' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium">
            Tugas Satpam: Periksa ketersediaan ruangan/fasilitas dan pastikan keamanan lingkungan sebelum diteruskan untuk persetujuan akhir Kepala Sekolah.
          </div>

          {loadingPerms ? (
            <div className="text-center py-10 text-xs text-slate-400">Memuat pengajuan izin...</div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 text-xs text-slate-500">
              Tidak ada pengajuan izin tempat kegiatan yang perlu diperiksa.
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {perm.organizationOrClass}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">{perm.activityName}</h3>
                      <p className="text-xs text-slate-500">{perm.purpose}</p>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full uppercase shrink-0 ${
                        perm.status === 'menunggu_satpam'
                          ? 'bg-amber-100 text-amber-800'
                          : perm.status === 'disetujui'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {perm.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Tempat:</span>
                      <strong className="text-slate-800">{perm.requestedLocation}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Tanggal & Jam:</span>
                      <strong className="text-slate-800">
                        {perm.activityDate} ({perm.startTime}-{perm.endTime})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Jumlah Peserta:</span>
                      <strong className="text-slate-800">{perm.participantCount} Siswa</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Guru Pembimbing:</span>
                      <strong className="text-slate-800">{perm.supervisorTeacher || '-'}</strong>
                    </div>
                  </div>

                  {/* Actions for Satpam */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Pemohon: <strong>{perm.applicantName}</strong> ({perm.applicantKelas || '-'})
                    </span>

                    {perm.status === 'menunggu_satpam' ? (
                      <button
                        onClick={() => {
                          setReviewingPerm(perm);
                          setSafetyChecked(true);
                          setFacilityAvailable(true);
                          setPermNotes('');
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
                      >
                        Periksa & Teruskan ke Kepsek
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Pemeriksaan Satpam Selesai
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL PEMERIKSAAN KLAIM BARANG (SATPAM)                       */}
      {/* ------------------------------------------------------------- */}
      {reviewingClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Pemeriksaan Bukti Klaim Barang
              </h3>
              <button onClick={() => setReviewingClaim(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Barang:</span>
                <strong className="text-slate-800 text-sm">{reviewingClaim.item.itemName}</strong>
                <span className="text-slate-500 block text-[11px] mt-0.5">Lokasi Ditemukan: {reviewingClaim.item.location}</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-amber-900 font-bold block text-xs">Siswa yang Mengklaim:</span>
                <span className="text-slate-900 font-black block">
                  {reviewingClaim.claim.claimantName} ({reviewingClaim.claim.claimantKelas || '-'})
                </span>
                <span className="text-slate-700 block mt-1.5">
                  <strong>Kronologi:</strong> {reviewingClaim.claim.reason}
                </span>
                <span className="text-amber-900 font-bold block mt-1.5">
                  <strong>Ciri-Ciri Rahasia:</strong> {reviewingClaim.claim.identifyingFeatures}
                </span>
                {reviewingClaim.claim.additionalInfo && (
                  <span className="text-slate-500 block text-[10px] mt-1">
                    Kontak: {reviewingClaim.claim.additionalInfo}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Satpam / Verifikator</label>
              <textarea
                rows={2}
                value={satpamNoteInput}
                onChange={(e) => setSatpamNoteInput(e.target.value)}
                placeholder="Misal: Ciri fisik cocok dengan barang yang disimpan..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessClaim('ditolak')}
                  disabled={isProcessingClaim}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                >
                  Tolak Klaim
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessClaim('disetujui')}
                  disabled={isProcessingClaim}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Setujui Klaim
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleProcessClaim('barang_telah_dikembalikan')}
                disabled={isProcessingClaim}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Catat Serah Terima (Barang Telah Dikembalikan)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL PEMERIKSAAN FASILITAS KEGIATAN (SATPAM)                 */}
      {/* ------------------------------------------------------------- */}
      {reviewingPerm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Pemeriksaan Fasilitas & Keamanan
              </h3>
              <button onClick={() => setReviewingPerm(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">{reviewingPerm.organizationOrClass}</span>
              <h4 className="text-sm font-black text-slate-900">{reviewingPerm.activityName}</h4>
              <p className="text-slate-600">
                Ruangan: <strong>{reviewingPerm.requestedLocation}</strong> ({reviewingPerm.activityDate}, {reviewingPerm.startTime}-{reviewingPerm.endTime})
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={safetyChecked}
                  onChange={(e) => setSafetyChecked(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Keamanan Lingkungan Terverifikasi</span>
                  <span className="text-[10px] text-slate-400 block">Jalur evakuasi dan pengawasan memadai</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={facilityAvailable}
                  onChange={(e) => setFacilityAvailable(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Fasilitas / Ruangan Tersedia</span>
                  <span className="text-[10px] text-slate-400 block">Ruangan kosong dan tidak bentrok dengan jadwal lain</span>
                </div>
              </label>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan Satpam</label>
                <textarea
                  rows={2}
                  value={permNotes}
                  onChange={(e) => setPermNotes(e.target.value)}
                  placeholder="Misal: Disediakan kunci pintu aula dan wajib dirapikan setelah selesai..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingPerm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReviewPermission}
                disabled={isProcessingPerm}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
              >
                {isProcessingPerm ? 'Memproses...' : 'Verifikasi & Teruskan ke Kepsek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
