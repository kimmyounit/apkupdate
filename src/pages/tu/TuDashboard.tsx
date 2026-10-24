import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  FolderDown,
  Archive,
  Printer,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type {
  TuitionBill,
  TuitionTransaction,
  TuDocument,
  TuChatMessage,
  User as UserType,
  TuMonthlyReport,
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type TuTab = 'bills' | 'finance' | 'documents' | 'chat' | 'backup';

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
    studentId: '',
    studentName: '',
    studentUsername: '',
    studentKelas: '',
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
    studentKelas: '',
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

  // --- 5. Backup & Leadership Dispatch State ---
  const [monthlyReports, setMonthlyReports] = useState<TuMonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [reportNotes, setReportNotes] = useState<string>('');
  const [isSendingReport, setIsSendingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

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
      const [bList, tList, dList, cList, sList, rList] = await Promise.all([
        api.getTuitionBills(),
        api.getTuitionTransactions(),
        api.getTuDocuments(),
        api.getTuChatMessages(),
        api.getStudents(),
        api.getTuMonthlyReports(),
      ]);
      setBills(bList);
      setTransactions(tList);
      setDocuments(dList);
      setChatMessages(cList);
      setAllStudents(sList);
      setMonthlyReports(rList || []);
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
        studentId: '',
        studentName: '',
        studentUsername: '',
        studentKelas: '',
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
        studentKelas: '',
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
      name: 'Pilih Siswa',
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

  const formatMonthName = (yearMonthStr: string) => {
    try {
      const [y, m] = yearMonthStr.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch (_) {
      return yearMonthStr;
    }
  };

  // Filter data by selected month
  const filteredTrxByMonth = transactions.filter((t) => {
    const d = t.date || (t.createdAt ? t.createdAt.split('T')[0] : '');
    return d.startsWith(selectedMonth);
  });

  const filteredBillsByMonth = bills.filter((b) => {
    const d = b.dueDate || (b.createdAt ? b.createdAt.split('T')[0] : '');
    return d.startsWith(selectedMonth);
  });

  const filteredDocsByMonth = documents.filter((d) => {
    const dStr = d.date || (d.createdAt ? d.createdAt.split('T')[0] : '');
    return dStr.startsWith(selectedMonth);
  });

  const monthIncome = filteredTrxByMonth
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthExpense = filteredTrxByMonth
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthNet = monthIncome - monthExpense;

  const monthPaidBills = filteredBillsByMonth.filter((b) => b.status === 'lunas').length;
  const monthUnpaidBills = filteredBillsByMonth.filter((b) => b.status !== 'lunas').length;
  const monthBillsTotal = filteredBillsByMonth.reduce((sum, b) => sum + (b.amount || 0), 0);
  const monthPaidAmount = filteredBillsByMonth
    .filter((b) => b.status === 'lunas')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Kirim Laporan Otomatis ke Pemimpin & Kepala Sekolah
  const handleSendReportToLeadership = async () => {
    if (isSendingReport) return;
    setIsSendingReport(true);
    try {
      const monthLabel = formatMonthName(selectedMonth);
      await api.createTuMonthlyReport({
        month: selectedMonth,
        monthName: monthLabel,
        sentBy: user?.name || 'Tata Usaha Haliza',
        sentByUsername: user?.username || 'haliza.tu',
        summary: {
          totalRevenue: monthIncome,
          totalExpense: monthExpense,
          saldoKas: monthNet,
          paidBillsCount: monthPaidBills,
          unpaidBillsCount: monthUnpaidBills,
          totalStudents: allStudents.length,
          documentsCount: filteredDocsByMonth.length,
          billsTotalAmount: monthBillsTotal,
        },
        notes: reportNotes.trim() || 'Laporan bulanan tata usaha telah diverifikasi dan siap ditinjau pimpinan.',
      });
      setReportSuccessMsg(`Laporan rekapitulasi ${monthLabel} berhasil dikirimkan ke Pemimpin Perguruan (Bpk. Titus Wahyu Diatmiko) & Kepala Sekolah (Bpk. ST Bambang Sapto Nugroho S.Pd)!`);
      setReportNotes('');
      const updatedReports = await api.getTuMonthlyReports();
      setMonthlyReports(updatedReports);
      setTimeout(() => setReportSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirimkan laporan bulanan.');
    } finally {
      setIsSendingReport(false);
    }
  };

  // Unduh Backup Excel (.xlsx) Multi-Sheet
  const handleExportBackupExcel = () => {
    try {
      const monthLabel = formatMonthName(selectedMonth);
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan Eksekutif
      const summaryRows = [
        { 'Parameter': 'Laporan', 'Nilai': 'REKAPITULASI & BACKUP BULANAN TATA USAHA' },
        { 'Parameter': 'Lembaga', 'Nilai': 'Perguruan Tamansiswa Batam (TAMVESTA)' },
        { 'Parameter': 'Periode Bulan', 'Nilai': monthLabel },
        { 'Parameter': 'Kode Periode', 'Nilai': selectedMonth },
        { 'Parameter': 'Waktu Export', 'Nilai': new Date().toLocaleString('id-ID') },
        { 'Parameter': 'Petugas Tata Usaha', 'Nilai': user?.name || 'Tata Usaha' },
        { 'Parameter': 'Total Pemasukan Kas', 'Nilai': `Rp ${monthIncome.toLocaleString('id-ID')}` },
        { 'Parameter': 'Total Pengeluaran Kas', 'Nilai': `Rp ${monthExpense.toLocaleString('id-ID')}` },
        { 'Parameter': 'Surplus / Saldo Bersih', 'Nilai': `Rp ${monthNet.toLocaleString('id-ID')}` },
        { 'Parameter': 'Total Tagihan SPP Diterbitkan', 'Nilai': `Rp ${monthBillsTotal.toLocaleString('id-ID')}` },
        { 'Parameter': 'Total Tagihan SPP Terbayar', 'Nilai': `Rp ${monthPaidAmount.toLocaleString('id-ID')}` },
        { 'Parameter': 'Jumlah Siswa Tagihan Lunas', 'Nilai': `${monthPaidBills} siswa` },
        { 'Parameter': 'Jumlah Siswa Tagihan Belum Lunas', 'Nilai': `${monthUnpaidBills} siswa` },
        { 'Parameter': 'Jumlah Arsip Surat / Dokumen', 'Nilai': `${filteredDocsByMonth.length} berkas` },
        { 'Parameter': 'Pemimpin Perguruan Tamansiswa Batam', 'Nilai': 'Titus Wahyu Diatmiko (+62 813-7289-4523)' },
        { 'Parameter': 'Kepala Sekolah', 'Nilai': 'ST Bambang Sapto Nugroho S.Pd' },
        { 'Parameter': 'Catatan Pengantar', 'Nilai': reportNotes || 'Data telah divalidasi dan tersimpan di database TAMVESTA.' },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

      // Sheet 2: Transaksi Kas
      const targetTrx = filteredTrxByMonth.length > 0 ? filteredTrxByMonth : transactions;
      const trxRows = targetTrx.map((t, idx) => ({
        'No': idx + 1,
        'Tanggal': t.date || (t.createdAt ? t.createdAt.split('T')[0] : '-'),
        'Jenis Kas': t.type.toUpperCase(),
        'Kategori': t.category,
        'Keterangan': t.description,
        'Nominal (Rp)': t.amount,
        'Metode Pembayaran': t.paymentMethod,
        'Nama Siswa': t.studentName || '-',
        'Kelas': t.studentKelas || '-',
      }));
      const wsTrx = XLSX.utils.json_to_sheet(trxRows);
      XLSX.utils.book_append_sheet(wb, wsTrx, 'Transaksi Kas');

      // Sheet 3: Tagihan SPP
      const targetBills = filteredBillsByMonth.length > 0 ? filteredBillsByMonth : bills;
      const billsRows = targetBills.map((b, idx) => ({
        'No': idx + 1,
        'Nama Siswa': b.studentName,
        'Kelas': b.studentKelas,
        'Judul Tagihan': b.title,
        'Kategori': b.category,
        'Nominal (Rp)': b.amount,
        'Jatuh Tempo': b.dueDate,
        'Status': b.status === 'lunas' ? 'LUNAS' : b.status === 'menunggu_verifikasi' ? 'MENUNGGU VERIFIKASI' : 'BELUM LUNAS',
        'Tanggal Pelunasan': b.paidAt ? b.paidAt.split('T')[0] : '-',
      }));
      const wsBills = XLSX.utils.json_to_sheet(billsRows);
      XLSX.utils.book_append_sheet(wb, wsBills, 'Tagihan SPP');

      // Sheet 4: Dokumen & Administrasi
      const targetDocs = filteredDocsByMonth.length > 0 ? filteredDocsByMonth : documents;
      const docRows = targetDocs.map((d, idx) => ({
        'No': idx + 1,
        'Nomor Surat': d.docNumber || '-',
        'Perihal / Judul': d.title,
        'Kategori': d.category,
        'Penerima / Pengirim': d.recipientOrSender,
        'Tanggal': d.date || (d.createdAt ? d.createdAt.split('T')[0] : '-'),
        'Status Arsip': d.status,
      }));
      const wsDocs = XLSX.utils.json_to_sheet(docRows);
      XLSX.utils.book_append_sheet(wb, wsDocs, 'Arsip Surat');

      const filename = `Backup_Tata_Usaha_Tamansiswa_${selectedMonth}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err: any) {
      alert('Gagal mengekspor file Excel: ' + err.message);
    }
  };

  // Unduh Laporan Resmi Word (.doc)
  const handleExportBackupWord = () => {
    try {
      const monthLabel = formatMonthName(selectedMonth);
      const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const targetTrx = filteredTrxByMonth.length > 0 ? filteredTrxByMonth : transactions;
      const trxRowsHtml = targetTrx
        .map(
          (t, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${t.date || (t.createdAt ? t.createdAt.split('T')[0] : '-')}</td>
            <td style="font-weight:bold; color: ${t.type === 'pemasukan' ? '#047857' : '#b91c1c'};">${t.type.toUpperCase()}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td style="text-align:right; font-weight:bold;">Rp ${t.amount.toLocaleString('id-ID')}</td>
            <td>${t.paymentMethod}</td>
          </tr>
        `
        )
        .join('');

      const targetBills = filteredBillsByMonth.length > 0 ? filteredBillsByMonth : bills;
      const billRowsHtml = targetBills
        .map(
          (b, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td><strong>${b.studentName}</strong></td>
            <td>${b.studentKelas || '-'}</td>
            <td>${b.title}</td>
            <td style="text-align:right;">Rp ${b.amount.toLocaleString('id-ID')}</td>
            <td>${b.dueDate}</td>
            <td style="font-weight:bold; color: ${b.status === 'lunas' ? '#047857' : '#b91c1c'};">${b.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}</td>
          </tr>
        `
        )
        .join('');

      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Laporan Rekapitulasi Tata Usaha - ${monthLabel}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
              color: #1e293b;
              font-size: 10.5pt;
              line-height: 1.45;
            }
            .kop {
              border-bottom: 3px double #047857;
              padding-bottom: 12px;
              margin-bottom: 20px;
              text-align: center;
            }
            .kop h2 {
              margin: 0;
              font-size: 17pt;
              font-weight: bold;
              color: #047857;
              letter-spacing: 0.5px;
            }
            .kop h3 {
              margin: 3px 0;
              font-size: 13pt;
              font-weight: 700;
              color: #334155;
            }
            .kop p {
              margin: 2px 0 0 0;
              font-size: 8.5pt;
              color: #64748b;
            }
            .title-box {
              text-align: center;
              margin-bottom: 22px;
            }
            .title-box h1 {
              font-size: 13.5pt;
              font-weight: bold;
              text-transform: uppercase;
              color: #0f172a;
              margin: 0 0 4px 0;
              text-decoration: underline;
            }
            .title-box p {
              font-size: 10.5pt;
              font-weight: 600;
              color: #475569;
              margin: 0;
            }
            .stat-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .stat-grid td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              background-color: #f8fafc;
            }
            .stat-grid td strong {
              color: #0f172a;
            }
            .section-title {
              font-size: 11pt;
              font-weight: bold;
              color: #047857;
              margin: 18px 0 8px 0;
              border-bottom: 1.5px solid #047857;
              padding-bottom: 3px;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9.5pt;
            }
            table.data-table th {
              background-color: #047857;
              color: #ffffff;
              padding: 6px 8px;
              border: 1px solid #047857;
              font-weight: bold;
              text-align: left;
            }
            table.data-table td {
              padding: 6px 8px;
              border: 1px solid #e2e8f0;
            }
            table.data-table tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .notes-box {
              background-color: #ecfdf5;
              border: 1px solid #a7f3d0;
              border-left: 4px solid #059669;
              padding: 10px 14px;
              margin: 15px 0 25px 0;
              font-size: 9.5pt;
            }
            .sign-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 35px;
              page-break-inside: avoid;
            }
            .sign-table td {
              border: none;
              text-align: center;
              vertical-align: top;
              padding: 0 10px;
              width: 33.33%;
            }
          </style>
        </head>
        <body>
          <div class="kop">
            <h2>YAYASAN PERGURUAN TAMANSISWA BATAM</h2>
            <h3>BAGIAN ADMINISTRASI & TATA USAHA (TAMVESTA)</h3>
            <p>Jalan Tamansiswa, Batam, Kepulauan Riau | Telepon: (0778) 462153 | Email: tu@tamansiswabatam.sch.id</p>
          </div>

          <div class="title-box">
            <h1>LAPORAN REKAPITULASI & DOKUMEN BACKUP BULANAN</h1>
            <p>PERIODE: ${monthLabel.toUpperCase()}</p>
          </div>

          <table class="stat-grid">
            <tr>
              <td><strong>Periode Pelaporan:</strong> ${monthLabel}</td>
              <td><strong>Tanggal Cetak:</strong> ${printDate}</td>
            </tr>
            <tr>
              <td><strong>Total Pemasukan Kas:</strong> Rp ${monthIncome.toLocaleString('id-ID')}</td>
              <td><strong>Total Pengeluaran Kas:</strong> Rp ${monthExpense.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td><strong>Saldo Bersih / Surplus:</strong> Rp ${monthNet.toLocaleString('id-ID')}</td>
              <td><strong>Tagihan SPP Diterbitkan:</strong> Rp ${monthBillsTotal.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td><strong>Siswa Tagihan Lunas:</strong> ${monthPaidBills} siswa</td>
              <td><strong>Siswa Menunggak / Belum Lunas:</strong> ${monthUnpaidBills} siswa</td>
            </tr>
            <tr>
              <td><strong>Arsip Dokumen / Surat:</strong> ${filteredDocsByMonth.length} berkas</td>
              <td><strong>Disusun Oleh:</strong> ${user?.name || 'Kepala Tata Usaha'}</td>
            </tr>
          </table>

          <div class="notes-box">
            <strong>CATATAN PENGANTAR RESMI TATA USAHA:</strong><br/>
            ${reportNotes || 'Laporan rekapitulasi operasional dan keuangan Tata Usaha bulan ini telah diverifikasi sesuai pembukuan kas dan tagihan sistem TAMVESTA.'}
          </div>

          <div class="section-title">I. REKAPITULASI TRANSAKSI KAS BULAN ${monthLabel.toUpperCase()}</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 80px;">Tanggal</th>
                <th style="width: 70px;">Jenis</th>
                <th style="width: 100px;">Kategori</th>
                <th>Keterangan</th>
                <th style="width: 110px; text-align: right;">Nominal</th>
                <th style="width: 90px;">Metode</th>
              </tr>
            </thead>
            <tbody>
              ${trxRowsHtml || '<tr><td colspan="7" style="text-align:center;">Tidak ada transaksi kas pada periode bulan ini.</td></tr>'}
            </tbody>
          </table>

          <div class="section-title">II. STATUS TAGIHAN & SPP SISWA BULAN ${monthLabel.toUpperCase()}</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Nama Siswa</th>
                <th style="width: 80px;">Kelas</th>
                <th>Judul Tagihan</th>
                <th style="width: 100px; text-align: right;">Nominal</th>
                <th style="width: 85px;">Jatuh Tempo</th>
                <th style="width: 95px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${billRowsHtml || '<tr><td colspan="7" style="text-align:center;">Tidak ada tagihan yang diterbitkan pada periode bulan ini.</td></tr>'}
            </tbody>
          </table>

          <table class="sign-table">
            <tr>
              <td>
                <p style="font-size: 9.5pt; margin: 0;">Mengetahui,</p>
                <p style="font-size: 10pt; font-weight: bold; margin: 2px 0 0 0;">Kepala Sekolah</p>
                <div style="height: 60px;"></div>
                <p style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 0;">( ST Bambang Sapto Nugroho S.Pd )</p>
                <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">Kepala Sekolah SMK Tamansiswa</p>
              </td>
              <td>
                <p style="font-size: 9.5pt; margin: 0;">Batam, ${printDate}</p>
                <p style="font-size: 10pt; font-weight: bold; margin: 2px 0 0 0;">Kepala Tata Usaha</p>
                <div style="height: 60px;"></div>
                <p style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 0;">( ${user?.name || 'Haliza'} )</p>
                <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">Petugas Administrasi & Keuangan</p>
              </td>
              <td>
                <p style="font-size: 9.5pt; margin: 0;">Menyetujui & Mengesahkan,</p>
                <p style="font-size: 10pt; font-weight: bold; margin: 2px 0 0 0;">Pemimpin Perguruan Tamansiswa</p>
                <div style="height: 60px;"></div>
                <p style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 0;">( Titus Wahyu Diatmiko )</p>
                <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">Pemimpin Perguruan Tamansiswa Batam</p>
                <p style="font-size: 8pt; color: #64748b; margin: 2px 0 0 0;">+62 813-7289-4523</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + wordHtml], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Bulanan_TU_Tamansiswa_${selectedMonth}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengekspor file Word: ' + err.message);
    }
  };

  // Kirim WhatsApp langsung ke Pemimpin Tamansiswa: Titus Wahyu Diatmiko (+62 813-7289-4523)
  const handleShareWhatsAppLeader = () => {
    const monthLabel = formatMonthName(selectedMonth);
    const msg = `*LAPORAN REKAPITULASI TATA USAHA TAMANSISWA BATAM*
Kepada Yth.
*Bpk. Titus Wahyu Diatmiko*
Pemimpin Perguruan Tamansiswa Batam
HP: +62 813-7289-4523

Berikut ringkasan rekapitulasi keuangan & administrasi:
📅 Periode: ${monthLabel}
👤 Disusun Oleh: ${user?.name || 'Tata Usaha Haliza'}

*RINGKASAN EKSEKUTIF:*
💰 Total Pemasukan: Rp ${monthIncome.toLocaleString('id-ID')}
💸 Total Pengeluaran: Rp ${monthExpense.toLocaleString('id-ID')}
📈 Saldo Bersih: Rp ${monthNet.toLocaleString('id-ID')}
💳 Tagihan SPP Lunas: ${monthPaidBills} siswa
⚠️ Tagihan SPP Belum Lunas: ${monthUnpaidBills} siswa
📁 Berkas / Surat Terarsip: ${filteredDocsByMonth.length} berkas

*Catatan Tata Usaha:*
${reportNotes || 'Laporan telah diunggah dan tersinkronisasi di sistem TAMVESTA. Dokumen lengkap dapat ditinjau melalui dashboard kepemimpinan.'}

Mengetahui:
*Pemimpin Perguruan Tamansiswa Batam (Titus Wahyu Diatmiko)*
*Kepala Sekolah (ST Bambang Sapto Nugroho S.Pd)*
`;
    const targetPhone = '6281372894523';
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Kirim WhatsApp ke Kepala Sekolah (ST Bambang Sapto Nugroho S.Pd)
  const handleShareWhatsAppPrincipal = () => {
    const monthLabel = formatMonthName(selectedMonth);
    const msg = `*LAPORAN BULANAN TATA USAHA - KEPALA SEKOLAH*
Kepada Yth.
*Bpk. ST Bambang Sapto Nugroho S.Pd*
Kepala Sekolah SMK Tamansiswa Batam

Laporan rekapitulasi operasional TU:
📅 Periode: ${monthLabel}
👤 Pengirim: ${user?.name || 'Tata Usaha Haliza'}

*RINGKASAN:*
- Total Pemasukan: Rp ${monthIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${monthExpense.toLocaleString('id-ID')}
- Saldo Kas: Rp ${monthNet.toLocaleString('id-ID')}
- Tagihan Lunas: ${monthPaidBills} siswa
- Tagihan Belum Lunas: ${monthUnpaidBills} siswa

*Catatan:*
${reportNotes || 'Data telah tervalidasi di aplikasi TAMVESTA.'}

Tembusan:
*Pemimpin Perguruan Tamansiswa Batam (Titus Wahyu Diatmiko • +62 813-7289-4523)*
`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderDown className="w-4 h-4" />
          <span>Rekap & Kirim ke Pemimpin</span>
          {monthlyReports.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
              {monthlyReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Alert Notifikasi Pengiriman Laporan */}
      {reportSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{reportSuccessMsg}</span>
          </div>
          <button onClick={() => setReportSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold px-2">
            ✕
          </button>
        </div>
      )}

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
                  {allStudents.find((s) => s.id === selectedChatStudentId)?.name || 'Pilih Siswa'}
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

      
      {/* ============================================================= */}
      {/* 5. TAB REKAP & BACKUP BULANAN (KIRIM KE PEMIMPIN & KEPSEK) */}
      {/* ============================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  <Archive className="w-4 h-4 text-emerald-300" />
                  <span>PUSAT REKAPITULASI & LAPORAN RESMI TATA USAHA</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Backup Bulanan & Pengiriman ke Pemimpin
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                  Pilih <strong>bulan apa saja</strong> untuk menghitung otomatis seluruh laporan keuangan kas, tagihan SPP, dan arsip dokumen. Hasil rekap otomatis dapat dikirim langsung ke <strong>Pemimpin Perguruan Tamansiswa Batam (Bpk. Titus Wahyu Diatmiko)</strong> dan <strong>Kepala Sekolah (Bpk. ST Bambang Sapto Nugroho S.Pd)</strong> melalui sistem serta WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={handleExportBackupExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportBackupWord}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  <FileText className="w-4 h-4 text-blue-200" />
                  <span>Ekspor Word (.doc)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Month Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-700">Pilih Periode Bulan:</span>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Periode Aktif: {formatMonthName(selectedMonth)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Pintasan:</span>
              <button
                type="button"
                onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setMonth(now.getMonth() - 1);
                  setSelectedMonth(now.toISOString().slice(0, 7));
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Bulan Lalu
              </button>
            </div>
          </div>

          {/* 4 Metric Cards for Selected Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan Kas</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Rp {monthIncome.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                {filteredTrxByMonth.filter((t) => t.type === 'pemasukan').length} transaksi tercatat
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran Kas</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Rp {monthExpense.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-rose-600 font-bold mt-1">
                {filteredTrxByMonth.filter((t) => t.type === 'pengeluaran').length} pengeluaran operasional
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surplus / Saldo Bersih</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-2 ${monthNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Rp {monthNet.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">
                {monthNet >= 0 ? 'Surplus Keuangan Positif' : 'Defisit Pengeluaran'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tagihan & SPP Siswa</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {monthPaidBills} <span className="text-xs text-slate-500 font-medium">Lunas</span> / {monthUnpaidBills} <span className="text-xs text-rose-500 font-medium">Tertunggak</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">
                Total Tagihan: Rp {monthBillsTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Dispatch Section & Export Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Pengiriman ke Pemimpin & Kepala Sekolah */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">
                    Kirim Otomatis ke Pemimpin & Kepala Sekolah
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Laporan Resmi TU
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Daftar Penerima Resmi Laporan:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-black flex items-center justify-center shrink-0">
                        T
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">Titus Wahyu Diatmiko</p>
                        <p className="text-[10px] text-purple-700 font-semibold truncate">Pemimpin Perguruan Tamansiswa</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">+62 813-7289-4523</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                        B
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">ST Bambang Sapto Nugroho S.Pd</p>
                        <p className="text-[10px] text-emerald-700 font-semibold truncate">Kepala Sekolah SMK Tamansiswa</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Catatan Pengantar / Evaluasi Tata Usaha:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan catatan khusus rekapitulasi, evaluasi tunggakan SPP, kendala operasional, atau pesan resmi untuk Pemimpin dan Kepala Sekolah..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={handleSendReportToLeadership}
                    disabled={isSendingReport}
                    className="flex-1 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingReport ? 'Mengirimkan...' : 'Kirim Laporan Resmi ke Pemimpin & Kepsek'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsAppLeader}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    title="Kirim Ringkasan ke WhatsApp Pemimpin Tamansiswa (Bpk. Titus Wahyu Diatmiko)"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WA Pemimpin (+62 813-7289-4523)</span>
                  </button>

                  <button
                    onClick={handleShareWhatsAppPrincipal}
                    className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    title="Kirim Ringkasan ke WhatsApp Kepala Sekolah (Bpk. ST Bambang Sapto Nugroho)"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WA Kepsek</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Export Cards */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <span>Format Unduhan Backup</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Dokumen laporan lengkap mencakup kop surat resmi, lembar pengesahan, dan rincian pembukuan.
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">File Backup Excel (.xlsx)</p>
                        <p className="text-[10px] text-slate-500">Multi-Sheet: Ringkasan, Kas, SPP, Dokumen</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportBackupExcel}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition"
                    >
                      Unduh
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-6 h-6 text-blue-700 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Dokumen Resmi Word (.doc)</p>
                        <p className="text-[10px] text-slate-500">KOP Resmi, Tabel Rincian & Lembar TTD</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportBackupWord}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition"
                    >
                      Unduh
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">Pengesahan Otomatis:</span>
                Tanda tangan otomatis disematkan atas nama <strong>Titus Wahyu Diatmiko</strong> (Pemimpin Perguruan Tamansiswa) dan <strong>ST Bambang Sapto Nugroho S.Pd</strong> (Kepala Sekolah).
              </div>
            </div>
          </div>

          {/* Riwayat Laporan Terkirim */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-800">
                  Riwayat Pengiriman & Arsip Laporan Bulanan ({monthlyReports.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Laporan yang tersimpan langsung dapat diakses oleh Pemimpin di Dashboard Kepemimpinan
              </span>
            </div>

            {monthlyReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada laporan bulanan yang dikirimkan. Pilih bulan dan klik "Kirim Laporan Resmi ke Pemimpin & Kepsek" di atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-3 px-4">Periode Bulan</th>
                      <th className="py-3 px-4">Waktu Terkirim</th>
                      <th className="py-3 px-4">Pengirim (TU)</th>
                      <th className="py-3 px-4">Penerima Resmi</th>
                      <th className="py-3 px-4 text-right">Pemasukan</th>
                      <th className="py-3 px-4 text-right">Pengeluaran</th>
                      <th className="py-3 px-4">Catatan TU</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {rep.monthName || rep.month}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(rep.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {rep.sentBy}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 block mb-1">
                            Pemimpin: Titus Wahyu Diatmiko
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block">
                            Kepsek: ST Bambang Sapto Nugroho
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          Rp {(rep.summary?.totalRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          Rp {(rep.summary?.totalExpense || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={rep.notes}>
                          {rep.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{rep.status || 'Terkirim & Terarsip'}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                    placeholder="Nama Siswa"
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
