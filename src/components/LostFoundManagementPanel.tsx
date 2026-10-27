import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Shield,
  Building,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import type {
  LostFoundItem,
  LostFoundClaim,
  LostFoundType,
  LostFoundStatus,
} from '../types/index.ts';

interface LostFoundManagementPanelProps {
  userRole: 'guru' | 'satpam' | 'tata_usaha' | 'admin';
  userName?: string;
}

export const LostFoundManagementPanel: React.FC<LostFoundManagementPanelProps> = ({
  userRole,
  userName = 'Petugas',
}) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found' | 'with_claims'>('all');

  // Claim Review Modal
  const [reviewingClaim, setReviewingClaim] = useState<{
    item: LostFoundItem;
    claim: LostFoundClaim;
  } | null>(null);
  const [officerNoteInput, setOfficerNoteInput] = useState('');
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<LostFoundType>('found');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<LostFoundItem['category']>('alat_tulis');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemStorage, setNewItemStorage] = useState<string>(
    userRole === 'guru' ? 'diserahkan_ke_guru' : userRole === 'tata_usaha' ? 'diserahkan_ke_tu' : 'diserahkan_ke_satpam'
  );
  const [newItemPhoto, setNewItemPhoto] = useState<string | undefined>(undefined);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const roleLabel =
    userRole === 'guru'
      ? 'Bapak/Ibu Guru'
      : userRole === 'tata_usaha'
      ? 'Tata Usaha (TU)'
      : userRole === 'satpam'
      ? 'Petugas Satpam'
      : 'Administrator';

  const roleBadgeColor =
    userRole === 'guru'
      ? 'bg-blue-600 text-white'
      : userRole === 'tata_usaha'
      ? 'bg-emerald-700 text-white'
      : userRole === 'satpam'
      ? 'bg-amber-600 text-white'
      : 'bg-purple-700 text-white';

  const loadData = async () => {
    try {
      const list = await api.getLostFoundItems().catch(() => []);
      setItems(Array.isArray(list) ? list : []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update Status Laporan
  const handleUpdateItemStatus = async (itemId: string, newStatus: LostFoundStatus) => {
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
          satpamNotes: officerNoteInput.trim() || undefined,
          officerNotes: officerNoteInput.trim() || undefined,
          verifiedBy: userName,
        }
      );
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setReviewingClaim(null);
      setOfficerNoteInput('');
      alert(`Klaim barang berhasil diperbarui: ${status.replace(/_/g, ' ')}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses klaim');
    } finally {
      setIsProcessingClaim(false);
    }
  };

  // Add Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemDescription.trim() || !newItemLocation.trim()) {
      alert('Nama barang, deskripsi, dan lokasi wajib diisi.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const created = await api.createLostFoundItem({
        type: newItemType,
        itemName: newItemName.trim(),
        category: newItemCategory,
        description: newItemDescription.trim(),
        location: newItemLocation.trim(),
        dateTime: new Date().toISOString(),
        storageStatus: newItemType === 'found' ? newItemStorage : undefined,
        photoUrl: newItemPhoto,
      });
      setItems((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemDescription('');
      setNewItemLocation('');
      setNewItemPhoto(undefined);
      alert('Laporan barang berhasil ditambahkan dan dapat diakses oleh Guru, TU, dan Satpam!');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan laporan barang.');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reporterName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.claims || []).some((c) =>
        (c.claimantName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (filterType === 'lost') return item.type === 'lost';
    if (filterType === 'found') return item.type === 'found';
    if (filterType === 'with_claims') return (item.claims || []).length > 0;
    return true;
  });

  const totalLost = items.filter((i) => i.type === 'lost').length;
  const totalFound = items.filter((i) => i.type === 'found').length;
  const totalClaimsPending = items.reduce(
    (acc, curr) => acc + (curr.claims || []).filter((c) => c.status === 'menunggu_verifikasi').length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-black text-slate-900">
              Pengelolaan Barang Hilang & Ditemukan
            </h2>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${roleBadgeColor}`}>
              Akses: {roleLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laporan barang hilang dan ditemukan terpusat yang terhubung serentak ke <strong>Dashboard Guru, Satpam, dan Tata Usaha (TU)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Laporan Barang</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Laporan</span>
          <span className="text-2xl font-black text-slate-900 mt-0.5 block">{items.length}</span>
          <span className="text-[10px] text-slate-500">Semua laporan terdata</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 block uppercase">Barang Hilang</span>
          <span className="text-2xl font-black text-rose-600 mt-0.5 block">{totalLost}</span>
          <span className="text-[10px] text-slate-500">Sedang dicari siswa/civitas</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 block uppercase">Barang Ditemukan</span>
          <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{totalFound}</span>
          <span className="text-[10px] text-slate-500">Disimpan menunggu pemilik</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs bg-amber-50/40">
          <span className="text-[10px] font-bold text-amber-800 block uppercase">Klaim Menunggu</span>
          <span className="text-2xl font-black text-amber-700 mt-0.5 block">{totalClaimsPending}</span>
          <span className="text-[10px] text-amber-700 font-semibold">Perlu diverifikasi petugas</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'lost' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Barang Hilang ({totalLost})
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'found' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Barang Ditemukan ({totalFound})
          </button>
          <button
            onClick={() => setFilterType('with_claims')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'with_claims' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ada Klaim ({items.filter((i) => (i.claims || []).length > 0).length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barang, pelapor, atau lokasi..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Memuat laporan barang...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Tidak ada laporan barang yang sesuai</h3>
          <p className="text-xs text-slate-400">
            Laporan barang hilang atau ditemukan yang diisi siswa akan otomatis tampil di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                          item.type === 'found' ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {item.type === 'found' ? 'Ditemukan' : 'Hilang'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                        {item.category?.replace('_', ' ') || 'Umum'}
                      </span>
                      {item.claims && item.claims.length > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {item.claims.length} Klaim
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">{item.itemName}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3">{item.description}</p>
                  </div>

                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.itemName}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
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
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </span>
                  </div>

                  {item.storageStatus && (
                    <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tempat Penyimpanan:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {item.storageStatus === 'diserahkan_ke_satpam'
                          ? '🛡️ Telah diserahkan ke Pos Satpam'
                          : item.storageStatus === 'diserahkan_ke_guru'
                          ? '👨‍🏫 Telah diserahkan ke Ruang Guru'
                          : item.storageStatus === 'diserahkan_ke_tu'
                          ? '🏢 Telah diserahkan ke Ruang Tata Usaha (TU)'
                          : '👤 Masih di tangan penemu'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Claims List Section */}
                {item.claims && item.claims.length > 0 && (
                  <div className="pt-2 border-t border-amber-100 bg-amber-50/70 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-900 block">
                        Daftar Siswa Mengklaim Kepemilikan ({item.claims.length}):
                      </span>
                    </div>
                    {item.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{claim.claimantName}</span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              ({claim.claimantKelas || '-'})
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                                claim.status === 'disetujui'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : claim.status === 'ditolak'
                                  ? 'bg-rose-100 text-rose-800'
                                  : claim.status === 'barang_telah_dikembalikan'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {claim.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[220px]">
                            Ciri Rahasia: <strong>{claim.identifyingFeatures}</strong>
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setReviewingClaim({ item, claim });
                            setOfficerNoteInput(claim.officerNotes || claim.satpamNotes || '');
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-2xs"
                        >
                          Periksa Klaim
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Selector Dropdown */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status Laporan:</span>
                <select
                  value={item.status}
                  onChange={(e) => handleUpdateItemStatus(item.id, e.target.value as LostFoundStatus)}
                  className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="menunggu_pemeriksaan">Menunggu Pemeriksaan</option>
                  <option value="sedang_ditindaklanjuti">Sedang Ditindaklanjuti</option>
                  <option value="disimpan_guru">Disimpan di Ruang Guru</option>
                  <option value="disimpan_tu">Disimpan di Ruang TU</option>
                  <option value="disimpan_satpam">Disimpan di Pos Satpam</option>
                  <option value="barang_ditemukan">Barang Telah Ditemukan</option>
                  <option value="menunggu_pengambilan">Menunggu Pengambilan</option>
                  <option value="barang_telah_dikembalikan">Barang Telah Dikembalikan</option>
                  <option value="laporan_selesai">Laporan Selesai</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: PERIKSA KLAIM SISWA */}
      {reviewingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Pemeriksaan Bukti Klaim Barang
                </h3>
              </div>
              <button
                onClick={() => setReviewingClaim(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Barang:</span>
                <strong className="text-slate-800 text-sm">{reviewingClaim.item.itemName}</strong>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Lokasi: {reviewingClaim.item.location}
                </span>
              </div>

              <div className="border-t border-slate-200/80 pt-2 space-y-1">
                <span className="text-slate-400 block text-[10px]">Siswa Mengklaim:</span>
                <strong className="text-slate-900 text-xs">
                  {reviewingClaim.claim.claimantName} ({reviewingClaim.claim.claimantKelas || '-'})
                </strong>
                <p className="text-slate-600 mt-1">
                  <strong>Kronologi:</strong> {reviewingClaim.claim.reason}
                </p>
                <p className="text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 text-xs">
                  <strong>Ciri-Ciri Rahasia / Bukti:</strong> {reviewingClaim.claim.identifyingFeatures}
                </p>
                {reviewingClaim.claim.additionalInfo && (
                  <p className="text-slate-500 text-[11px] mt-1">
                    Kontak Tambahan: {reviewingClaim.claim.additionalInfo}
                  </p>
                )}
              </div>
            </div>

            {/* Officer Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Catatan Verifikasi ({roleLabel}):
              </label>
              <textarea
                rows={2}
                value={officerNoteInput}
                onChange={(e) => setOfficerNoteInput(e.target.value)}
                placeholder="Misal: Ciri fisik cocok dengan barang yang disimpan..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleProcessClaim('ditolak')}
                disabled={isProcessingClaim}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
              >
                Tolak Klaim
              </button>

              <button
                type="button"
                onClick={() => handleProcessClaim('disetujui')}
                disabled={isProcessingClaim}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Setujui Klaim
              </button>

              <button
                type="button"
                onClick={() => handleProcessClaim('barang_telah_dikembalikan')}
                disabled={isProcessingClaim}
                className="col-span-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Catat Serah Terima (Barang Telah Dikembalikan ke Siswa)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH LAPORAN BARANG OLEH PETUGAS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-900">
                  Tambah Laporan Barang ({roleLabel})
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Jenis Laporan *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType('found')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newItemType === 'found'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Barang Ditemukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('lost')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      newItemType === 'lost'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Barang Hilang
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Misal: Dompet Hitam, Kunci Motor Honda, Tumbler Biru..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori *</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="elektronik">Elektronik</option>
                    <option value="alat_tulis">Alat Tulis</option>
                    <option value="buku_dokumen">Buku / Dokumen</option>
                    <option value="pakaian_aksesoris">Pakaian & Aksesoris</option>
                    <option value="uang_dompet">Uang / Dompet</option>
                    <option value="kunci">Kunci</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Ditemukan/Hilang *</label>
                  <input
                    type="text"
                    required
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                    placeholder="Misal: Kantin, Lapangan, Lab IPA..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Storage Location */}
              {newItemType === 'found' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tempat Penyimpanan Saat Ini *</label>
                  <select
                    value={newItemStorage}
                    onChange={(e) => setNewItemStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="diserahkan_ke_guru">Disimpan di Ruang Guru</option>
                    <option value="diserahkan_ke_tu">Disimpan di Ruang Tata Usaha (TU)</option>
                    <option value="diserahkan_ke_satpam">Disimpan di Pos Satpam</option>
                    <option value="masih_di_penemu">Masih Dipegang Penemu</option>
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Lengkap *</label>
                <textarea
                  required
                  rows={3}
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Deskripsikan warna, merk, kondisi, dan waktu kejadian..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Foto Barang (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {newItemPhoto && (
                    <div className="flex items-center gap-2">
                      <img
                        src={newItemPhoto}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setNewItemPhoto(undefined)}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {isSubmittingItem ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
