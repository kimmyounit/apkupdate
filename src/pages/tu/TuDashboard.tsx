import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Send,
  Building,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  Users,
  Shield,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type {
  TuitionBill,
  TuitionTransaction,
  TuDocument,
  TuChatMessage,
  User as UserType,
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type TuTab = 'bills' | 'finance' | 'documents' | 'chat';

export const TuDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TuTab>('bills');
  const [loading, setLoading] = useState(false);

  // --- 1. Bills State ---
  const [bills, setBills] = useState<TuitionBill[]>([]);
  const [billFilterStatus, setBillFilterStatus] = useState<string>('semua');
  const [billSearch, setBillSearch] = useState<string>('');
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [newBillForm, setNewBillForm] = useState({
    studentId: 'user_siswa_bintang',
    studentName: 'Bintang Pratama',
    studentUsername: 'bintang.siswa',
    studentKelas: 'X TKJ 1',
    title: '',
    category: 'SPP' as const,
    amount: 350000,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // --- 2. Finance State ---
  const [transactions, setTransactions] = useState<TuitionTransaction[]>([]);
  const [showAddTrxModal, setShowAddTrxModal] = useState(false);
  const [newTrxForm, setNewTrxForm] = useState({
    studentName: '',
    studentKelas: 'X TKJ 1',
    amount: 350000,
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: 'SPP',
    paymentMethod: 'Tunai / Kasir TU' as const,
    description: '',
  });

  // --- 3. Documents State ---
  const [documents, setDocuments] = useState<TuDocument[]>([]);
  const [docCategoryFilter, setDocCategoryFilter] = useState('semua');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    docNumber: '',
    category: 'Surat Keterangan Siswa' as const,
    recipientOrSender: '',
    status: 'Selesai' as const,
    notes: '',
  });

  // --- 4. Chat State ---
  const [chatMessages, setChatMessages] = useState<TuChatMessage[]>([]);
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string>('user_siswa_bintang');
  const [chatInput, setChatInput] = useState('');
  const [allStudents, setAllStudents] = useState<UserType[]>([]);

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bList, tList, dList, cList, sList] = await Promise.all([
        api.getTuitionBills(),
        api.getTuitionTransactions(),
        api.getTuDocuments(),
        api.getTuChatMessages(),
        api.getStudents(),
      ]);
      setBills(bList);
      setTransactions(tList);
      setDocuments(dList);
      setChatMessages(cList);
      setAllStudents(sList);
    } catch (e) {
      console.error('Failed to load TU data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Create Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillForm.title) return alert('Judul tagihan wajib diisi');
    try {
      await api.createTuitionBill(newBillForm);
      setShowCreateBillModal(false);
      setNewBillForm({
        studentId: 'user_siswa_bintang',
        studentName: 'Bintang Pratama',
        studentUsername: 'bintang.siswa',
        studentKelas: 'X TKJ 1',
        title: '',
        category: 'SPP',
        amount: 350000,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
      loadAllData();
      alert('Tagihan berhasil dibuat!');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan');
    }
  };

  // Verify Bill (mark as lunas)
  const handleVerifyBill = async (bill: TuitionBill) => {
    if (!confirm(`Konfirmasi pelunasan untuk ${bill.title} (${bill.studentName})?`)) return;
    try {
      await api.updateTuitionBill(bill.id, {
        status: 'lunas',
        paidAt: new Date().toISOString(),
      });
      // Otomatis catat transaksi pemasukan
      await api.createTuitionTransaction({
        billId: bill.id,
        studentId: bill.studentId,
        studentName: bill.studentName,
        studentKelas: bill.studentKelas,
        amount: bill.amount,
        type: 'pemasukan',
        category: bill.category,
        paymentMethod: 'Tunai / Kasir TU',
        description: `Pelunasan ${bill.title} - ${bill.studentName}`,
      });
      loadAllData();
      alert('Tagihan berhasil dilunasi dan kwitansi diterbitkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi tagihan');
    }
  };

  // Delete Bill
  const handleDeleteBill = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data tagihan ini?')) return;
    try {
      await api.deleteTuitionBill(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tagihan');
    }
  };

  // Create Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrxForm.description) return alert('Keterangan transaksi wajib diisi');
    try {
      await api.createTuitionTransaction(newTrxForm);
      setShowAddTrxModal(false);
      setNewTrxForm({
        studentName: '',
        studentKelas: 'X TKJ 1',
        amount: 350000,
        type: 'pemasukan',
        category: 'SPP',
        paymentMethod: 'Tunai / Kasir TU',
        description: '',
      });
      loadAllData();
      alert('Transaksi berhasil dicatat!');
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat transaksi');
    }
  };

  // Create Document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title) return alert('Judul / Perihal surat wajib diisi');
    try {
      await api.createTuDocument(newDocForm);
      setShowAddDocModal(false);
      setNewDocForm({
        title: '',
        docNumber: '',
        category: 'Surat Keterangan Siswa',
        recipientOrSender: '',
        status: 'Selesai',
        notes: '',
      });
      loadAllData();
      alert('Dokumen surat berhasil diarsipkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengarsipkan dokumen');
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Yakin ingin menghapus arsip dokumen ini?')) return;
    try {
      await api.deleteTuDocument(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen');
    }
  };

  // Send TU Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const targetStudent = allStudents.find((s) => s.id === selectedChatStudentId) || {
      id: selectedChatStudentId,
      name: 'Bintang Pratama',
      kelas: 'X TKJ 1',
    };

    try {
      await api.createTuChatMessage({
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        studentKelas: (targetStudent as any).kelas || 'X TKJ 1',
        message: chatInput.trim(),
        senderRole: 'tata_usaha',
      });
      setChatInput('');
      const msgs = await api.getTuChatMessages(targetStudent.id);
      setChatMessages(msgs);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan');
    }
  };

  // Filtered Bills
  const filteredBills = bills.filter((b) => {
    const matchStatus = billFilterStatus === 'semua' || b.status === billFilterStatus;
    const q = billSearch.toLowerCase();
    const matchSearch =
      b.studentName.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.studentKelas.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Calculate Finance Summary
  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const saldoKas = totalPemasukan - totalPengeluaran;

  // Filtered Chat Messages
  const currentChatMessages = chatMessages.filter((m) => m.studentId === selectedChatStudentId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-400/30">
              Layanan Administrasi & Keuangan
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Dashboard Tata Usaha (TU)</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Pengelolaan administrasi surat, tagihan SPP, pembukuan kas, dan layanan chat siswa Tamansiswa Batam.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">Saldo Kas Sekolah</span>
            <span className="text-lg font-black text-emerald-300">
              Rp {saldoKas.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'bills'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tagihan & SPP Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'finance'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Laporan Keuangan & Kas</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Administrasi & Surat</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat Resmi Siswa</span>
          {chatMessages.filter((m) => m.senderRole === 'siswa' && !m.isReadByTu).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ============================================================= */}
      {/* 1. TAB TAGIHAN SPP */}
      {/* ============================================================= */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa, kelas, atau tagihan..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={billFilterStatus}
                onChange={(e) => setBillFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="semua">Semua Status</option>
                <option value="belum_lunas">Belum Lunas</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateBillModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tagihan Baru</span>
            </button>
          </div>

          {/* Bills List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Siswa / Kelas</th>
                    <th className="py-3 px-4">Jenis Tagihan</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada data tagihan yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                            {bill.studentName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {bill.studentKelas} • @{bill.studentUsername}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700 block">{bill.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{bill.category}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          Rp {bill.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(bill.dueDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              bill.status === 'lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bill.status === 'menunggu_verifikasi'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {bill.status === 'lunas' && <CheckCircle2 className="w-3 h-3" />}
                            {bill.status === 'menunggu_verifikasi' && <Clock className="w-3 h-3" />}
                            {bill.status === 'belum_lunas' && <AlertCircle className="w-3 h-3" />}
                            {bill.status === 'lunas'
                              ? 'Lunas'
                              : bill.status === 'menunggu_verifikasi'
                              ? 'Cek Bukti Bayar'
                              : 'Belum Lunas'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {bill.status !== 'lunas' && (
                            <button
                              onClick={() => handleVerifyBill(bill)}
                              title="Tandai Lunas"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                            >
                              Verifikasi Lunas
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            title="Hapus Tagihan"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. TAB LAPORAN KEUANGAN & TRANSAKSI */}
      {/* ============================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pemasukan Sekolah</span>
                <ArrowDownLeft className="w-5 h-5 bg-emerald-100 p-1 rounded-lg" />
              </div>
              <p className="text-xl font-black text-slate-800">
                Rp {totalPemasukan.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400">Total pembayaran SPP & iuran masuk</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengeluaran Operasional</span>
                <ArrowUpRight className="w-5 h-5 bg-rose-100 p-1 rounded-lg" />
              </div>
              <p className="text-xl font-black text-slate-800">
                Rp {totalPengeluaran.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400">Pengeluaran belanja sarpras & kegiatan</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-5 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-200">
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Bersih Kas TU</span>
                <Receipt className="w-5 h-5 bg-white/20 p-1 rounded-lg" />
              </div>
              <p className="text-xl font-black text-white">
                Rp {saldoKas.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-emerald-200/80">Kas aktif siap digunakan</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Buku Kas & Riwayat Transaksi Resmi</span>
            </h3>

            <button
              onClick={() => setShowAddTrxModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi Kas</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Kwitansi</th>
                    <th className="py-3 px-4">Keterangan / Siswa</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Waktu & Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada transaksi kas yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {trx.receiptNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{trx.description}</span>
                          {trx.studentName && (
                            <span className="text-[11px] text-slate-500">
                              {trx.studentName} ({trx.studentKelas})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{trx.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              trx.type === 'pemasukan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {trx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <span className={trx.type === 'pemasukan' ? 'text-emerald-700' : 'text-rose-600'}>
                            {trx.type === 'pemasukan' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <span>
                            {new Date(trx.verifiedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="block text-[10px] text-slate-400">Oleh: {trx.verifiedBy}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. TAB ADMINISTRASI & SURAT DOKUMEN */}
      {/* ============================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="semua">Semua Kategori Surat</option>
                <option value="Surat Keterangan Siswa">Surat Keterangan Siswa</option>
                <option value="Surat Keluar">Surat Keluar</option>
                <option value="Surat Masuk">Surat Masuk</option>
                <option value="Arsip Ijazah">Arsip Ijazah</option>
                <option value="Dokumen Kurikulum">Dokumen Kurikulum</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Arsipkan Dokumen / Surat</span>
            </button>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Surat / Dokumen</th>
                    <th className="py-3 px-4">Perihal / Judul</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tujuan / Pemohon</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents
                    .filter((d) => docCategoryFilter === 'semua' || d.category === docCategoryFilter)
                    .map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.docNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.title}</td>
                        <td className="py-3 px-4 text-slate-500">{doc.category}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{doc.recipientOrSender}</td>
                        <td className="py-3 px-4 text-slate-500">{doc.date}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. TAB CHAT RESMI DENGAN SISWA */}
      {/* ============================================================= */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[500px]">
          {/* Left Student List Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-200 flex flex-col bg-slate-50/60">
            <div className="p-3.5 border-b border-slate-200 bg-white">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Daftar Siswa Konsultasi</span>
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {allStudents.map((s) => {
                const isSelected = selectedChatStudentId === s.id;
                const studentMsgs = chatMessages.filter((m) => m.studentId === s.id);
                const lastMsg = studentMsgs[studentMsgs.length - 1];
                const unread = studentMsgs.some((m) => m.senderRole === 'siswa' && !m.isReadByTu);

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedChatStudentId(s.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-50 border-r-4 border-emerald-600' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 truncate">{s.name}</span>
                        {unread && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{s.kelas || 'X TKJ 1'}</p>
                      {lastMsg && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{lastMsg.message}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat Header */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                  {allStudents.find((s) => s.id === selectedChatStudentId)?.name || 'Bintang Pratama'}
                </h4>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Siswa Tamansiswa Batam • Ruang Konsultasi Tagihan & SPP
                </p>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentChatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada pesan obrolan dengan siswa ini. Kirimkan sapaan atau konfirmasi tagihan di bawah.
                </div>
              ) : (
                currentChatMessages.map((msg) => {
                  const isTu = msg.senderRole === 'tata_usaha';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isTu ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm shadow-xs ${
                          isTu
                            ? 'bg-emerald-700 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold block mb-1 ${
                            isTu ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        <p className="leading-relaxed">{msg.message}</p>
                        {msg.proofUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                            <img src={msg.proofUrl} alt="Bukti Pembayaran" className="max-h-48 object-cover" />
                          </div>
                        )}
                        <span
                          className={`text-[9px] block text-right mt-1.5 ${
                            isTu ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Ketik balasan resmi tata usaha..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Tagihan Baru */}
      {showCreateBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Buat Tagihan Biaya Siswa</span>
              </h3>
              <button onClick={() => setShowCreateBillModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Siswa</label>
                <select
                  value={newBillForm.studentId}
                  onChange={(e) => {
                    const sel = allStudents.find((s) => s.id === e.target.value);
                    if (sel) {
                      setNewBillForm({
                        ...newBillForm,
                        studentId: sel.id,
                        studentName: sel.name,
                        studentUsername: sel.username,
                        studentKelas: sel.kelas || 'X TKJ 1',
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.kelas || 'X'}) - @{s.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Tagihan</label>
                <input
                  type="text"
                  placeholder="Misal: SPP Bulan November 2026"
                  value={newBillForm.title}
                  onChange={(e) => setNewBillForm({ ...newBillForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={newBillForm.category}
                    onChange={(e) => setNewBillForm({ ...newBillForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SPP">SPP</option>
                    <option value="Uang Gedung">Uang Gedung</option>
                    <option value="Seragam">Seragam</option>
                    <option value="Ujian">Ujian</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={newBillForm.amount}
                    onChange={(e) => setNewBillForm({ ...newBillForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={newBillForm.dueDate}
                  onChange={(e) => setNewBillForm({ ...newBillForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBillModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catat Transaksi Kas */}
      {showAddTrxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Catat Transaksi Kas Keuangan</span>
              </h3>
              <button onClick={() => setShowAddTrxModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kas</label>
                  <select
                    value={newTrxForm.type}
                    onChange={(e) => setNewTrxForm({ ...newTrxForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="pemasukan">Pemasukan (+)</option>
                    <option value="pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={newTrxForm.amount}
                    onChange={(e) => setNewTrxForm({ ...newTrxForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="Misal: Pembayaran SPP Tunai atau Pembelian ATK Kantor"
                  value={newTrxForm.description}
                  onChange={(e) => setNewTrxForm({ ...newTrxForm, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Siswa / Pembayar (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Bintang Pratama"
                    value={newTrxForm.studentName}
                    onChange={(e) => setNewTrxForm({ ...newTrxForm, studentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                  <select
                    value={newTrxForm.paymentMethod}
                    onChange={(e) => setNewTrxForm({ ...newTrxForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Tunai / Kasir TU">Tunai / Kasir TU</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Virtual Account">Virtual Account</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Surat / Dokumen */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Arsipkan Surat / Dokumen Baru</span>
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Perihal / Judul Surat</label>
                <input
                  type="text"
                  placeholder="Misal: Surat Keterangan Siswa Aktif"
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Surat Keterangan Siswa">Surat Keterangan Siswa</option>
                    <option value="Surat Keluar">Surat Keluar</option>
                    <option value="Surat Masuk">Surat Masuk</option>
                    <option value="Arsip Ijazah">Arsip Ijazah</option>
                    <option value="Dokumen Kurikulum">Dokumen Kurikulum</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Surat</label>
                  <input
                    type="text"
                    placeholder="Auto / Isi Nomor"
                    value={newDocForm.docNumber}
                    onChange={(e) => setNewDocForm({ ...newDocForm, docNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Penerima / Pengirim</label>
                <input
                  type="text"
                  placeholder="Nama Siswa atau Instansi Terkait"
                  value={newDocForm.recipientOrSender}
                  onChange={(e) => setNewDocForm({ ...newDocForm, recipientOrSender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Arsip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
