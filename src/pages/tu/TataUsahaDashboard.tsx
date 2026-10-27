import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Send,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Archive,
  ChevronLeft,
  Users,
  BadgeCheck,
  Loader2,
  RefreshCw,
  X,
  Inbox,
  FileCheck,
  FileClock,
  FileArchive,
} from 'lucide-react';
import { getStoredToken } from '../../lib/api.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

type BillStatus = 'belum_lunas' | 'menunggu_verifikasi' | 'lunas';

interface Bill {
  id: string;
  studentId: string;
  studentName: string;
  studentKelas?: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
}

type TransactionType = 'pemasukan' | 'pengeluaran';

interface Transaction {
  id: string;
  receiptNumber: string;
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  paymentMethod: string;
  description?: string;
  relatedBillId?: string;
  createdAt: string;
  createdBy: string;
}

type DocumentStatus = 'Arsip' | 'Menunggu TTD' | 'Selesai';
type DocumentCategory =
  | 'Surat Masuk'
  | 'Surat Keluar'
  | 'Surat Keterangan'
  | 'Arsip Ijazah'
  | 'Dokumen Umum';

interface TUDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  description?: string;
  fileUrl?: string;
  issuedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface StudentChatThread {
  studentId: string;
  studentName: string;
  studentUsername: string;
  studentKelas?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

type TUTab = 'tagihan' | 'transaksi' | 'dokumen' | 'chat';

// ─── API helper ───────────────────────────────────────────────────────────────

async function tuRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(endpoint, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data as any).error ||
      (data as any).message ||
      `Request gagal dengan status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateReceiptNumber(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `TU-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  belum_lunas: 'Belum Lunas',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  lunas: 'Lunas',
};

const BILL_STATUS_CLASS: Record<BillStatus, string> = {
  belum_lunas:
    'bg-rose-50 text-rose-800 border-rose-200',
  menunggu_verifikasi:
    'bg-amber-50 text-amber-800 border-amber-200',
  lunas: 'bg-teal-50 text-teal-800 border-teal-200',
};

const DOC_STATUS_CLASS: Record<DocumentStatus, string> = {
  Arsip: 'bg-slate-100 text-slate-700 border-slate-200',
  'Menunggu TTD': 'bg-amber-50 text-amber-800 border-amber-200',
  Selesai: 'bg-teal-50 text-teal-800 border-teal-200',
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-6">{children}</div>
    </div>
  </div>
);

// ─── Alert Banner ─────────────────────────────────────────────────────────────

const Alert: React.FC<{
  type: 'success' | 'error';
  message: string;
}> = ({ type, message }) => (
  <div
    className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold border ${
      type === 'success'
        ? 'bg-teal-50 text-teal-800 border-teal-200'
        : 'bg-rose-50 text-rose-800 border-rose-200'
    }`}
  >
    {type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 shrink-0" />
    ) : (
      <AlertCircle className="w-4 h-4 shrink-0" />
    )}
    <span>{message}</span>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const TataUsahaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TUTab>('tagihan');

  // ── Tab: Tagihan ──────────────────────────────────────────────────────────
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [billStatusFilter, setBillStatusFilter] = useState<BillStatus | 'all'>('all');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [billFormLoading, setBillFormLoading] = useState(false);
  const [billFormError, setBillFormError] = useState<string | null>(null);
  const [billFormSuccess, setBillFormSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string; kelas?: string }[]>([]);
  const [billForm, setBillForm] = useState({
    studentId: '',
    title: '',
    category: 'SPP',
    amount: '',
    dueDate: new Date().toISOString().slice(0, 10),
  });

  // ── Tab: Transaksi ────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);
  const [showTransModal, setShowTransModal] = useState(false);
  const [transFormLoading, setTransFormLoading] = useState(false);
  const [transFormError, setTransFormError] = useState<string | null>(null);
  const [transFormSuccess, setTransFormSuccess] = useState<string | null>(null);
  const [transForm, setTransForm] = useState({
    receiptNumber: '',
    title: '',
    category: 'Operasional',
    amount: '',
    type: 'pemasukan' as TransactionType,
    paymentMethod: 'Tunai',
    description: '',
  });

  // ── Tab: Dokumen ──────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<TUDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TUDocument | null>(null);
  const [docFormLoading, setDocFormLoading] = useState(false);
  const [docFormError, setDocFormError] = useState<string | null>(null);
  const [docFormSuccess, setDocFormSuccess] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Surat Masuk' as DocumentCategory,
    status: 'Arsip' as DocumentStatus,
    description: '',
    issuedDate: new Date().toISOString().slice(0, 10),
  });

  // ── Tab: Chat ─────────────────────────────────────────────────────────────
  const [chatThreads, setChatThreads] = useState<StudentChatThread[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<StudentChatThread | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMsgsLoading, setChatMsgsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Loaders
  // ─────────────────────────────────────────────────────────────────────────

  const loadStudents = async () => {
    try {
      const data = await tuRequest<{ id: string; name: string; kelas?: string }[]>(
        '/api/admin/students'
      );
      setStudents(data);
    } catch {
      // non-critical
    }
  };

  const loadBills = async () => {
    setBillsLoading(true);
    setBillsError(null);
    try {
      const data = await tuRequest<Bill[]>('/api/tu/bills');
      setBills(data);
    } catch (err: any) {
      setBillsError(err.message || 'Gagal memuat data tagihan.');
    } finally {
      setBillsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransLoading(true);
    setTransError(null);
    try {
      const data = await tuRequest<Transaction[]>('/api/tu/transactions');
      setTransactions(data);
    } catch (err: any) {
      setTransError(err.message || 'Gagal memuat data transaksi.');
    } finally {
      setTransLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const data = await tuRequest<TUDocument[]>('/api/tu/documents');
      setDocuments(data);
    } catch (err: any) {
      setDocsError(err.message || 'Gagal memuat data dokumen.');
    } finally {
      setDocsLoading(false);
    }
  };

  const loadChatThreads = async () => {
    setChatLoading(true);
    setChatError(null);
    try {
      const data = await tuRequest<StudentChatThread[]>('/api/tu/chat');
      setChatThreads(data);
    } catch (err: any) {
      setChatError(err.message || 'Gagal memuat daftar percakapan.');
    } finally {
      setChatLoading(false);
    }
  };

  const loadChatMessages = async (studentId: string) => {
    setChatMsgsLoading(true);
    try {
      const data = await tuRequest<ChatMessage[]>(`/api/tu/chat/${studentId}`);
      setChatMessages(data);
    } catch {
      setChatMessages([]);
    } finally {
      setChatMsgsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBills();
  }, []);

  useEffect(() => {
    if (activeTab === 'transaksi') loadTransactions();
    if (activeTab === 'dokumen') loadDocuments();
    if (activeTab === 'chat') loadChatThreads();
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─────────────────────────────────────────────────────────────────────────
  // Bill Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillFormLoading(true);
    setBillFormError(null);
    setBillFormSuccess(null);
    try {
      await tuRequest<Bill>('/api/tu/bills', {
        method: 'POST',
        body: JSON.stringify({
          ...billForm,
          amount: Number(billForm.amount),
        }),
      });
      setBillFormSuccess('Tagihan berhasil dibuat!');
      setBillForm({
        studentId: '',
        title: '',
        category: 'SPP',
        amount: '',
        dueDate: new Date().toISOString().slice(0, 10),
      });
      await loadBills();
      setTimeout(() => {
        setShowBillModal(false);
        setBillFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setBillFormError(err.message || 'Gagal membuat tagihan.');
    } finally {
      setBillFormLoading(false);
    }
  };

  const handleUpdateBillStatus = async (
    bill: Bill,
    newStatus: BillStatus
  ) => {
    try {
      await tuRequest<Bill>(`/api/tu/bills/${bill.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status tagihan.');
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Hapus tagihan ini? Tindakan tidak dapat dibatalkan.')) return;
    try {
      await tuRequest<{ message: string }>(`/api/tu/bills/${id}`, {
        method: 'DELETE',
      });
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tagihan.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Transaction Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransFormLoading(true);
    setTransFormError(null);
    setTransFormSuccess(null);
    try {
      await tuRequest<Transaction>('/api/tu/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...transForm,
          amount: Number(transForm.amount),
          receiptNumber: transForm.receiptNumber || generateReceiptNumber(),
        }),
      });
      setTransFormSuccess('Transaksi berhasil dicatat!');
      setTransForm({
        receiptNumber: '',
        title: '',
        category: 'Operasional',
        amount: '',
        type: 'pemasukan',
        paymentMethod: 'Tunai',
        description: '',
      });
      await loadTransactions();
      setTimeout(() => {
        setShowTransModal(false);
        setTransFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setTransFormError(err.message || 'Gagal mencatat transaksi.');
    } finally {
      setTransFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Document Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openDocModal = (doc?: TUDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setDocForm({
        title: doc.title,
        category: doc.category,
        status: doc.status,
        description: doc.description || '',
        issuedDate: doc.issuedDate || new Date().toISOString().slice(0, 10),
      });
    } else {
      setEditingDoc(null);
      setDocForm({
        title: '',
        category: 'Surat Masuk',
        status: 'Arsip',
        description: '',
        issuedDate: new Date().toISOString().slice(0, 10),
      });
    }
    setDocFormError(null);
    setDocFormSuccess(null);
    setShowDocModal(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocFormLoading(true);
    setDocFormError(null);
    setDocFormSuccess(null);
    try {
      if (editingDoc) {
        await tuRequest<TUDocument>(`/api/tu/documents/${editingDoc.id}`, {
          method: 'PUT',
          body: JSON.stringify(docForm),
        });
        setDocFormSuccess('Dokumen berhasil diperbarui!');
      } else {
        await tuRequest<TUDocument>('/api/tu/documents', {
          method: 'POST',
          body: JSON.stringify(docForm),
        });
        setDocFormSuccess('Dokumen berhasil dibuat!');
      }
      await loadDocuments();
      setTimeout(() => {
        setShowDocModal(false);
        setDocFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setDocFormError(err.message || 'Gagal menyimpan dokumen.');
    } finally {
      setDocFormLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Hapus dokumen ini?')) return;
    try {
      await tuRequest<{ message: string }>(`/api/tu/documents/${id}`, {
        method: 'DELETE',
      });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Chat Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openChat = async (thread: StudentChatThread) => {
    setActiveChat(thread);
    await loadChatMessages(thread.studentId);
  };

  const handleSendMessage = async () => {
    if (!activeChat || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    try {
      const msg = await tuRequest<ChatMessage>(
        `/api/tu/chat/${activeChat.studentId}`,
        {
          method: 'POST',
          body: JSON.stringify({ content: text }),
        }
      );
      setChatMessages((prev) => [...prev, msg]);
    } catch {
      setChatInput(text); // restore on failure
    } finally {
      setChatSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────────────────

  const filteredBills = bills.filter((b) => {
    const matchStatus =
      billStatusFilter === 'all' || b.status === billStatusFilter;
    const q = billSearchQuery.toLowerCase();
    const matchQuery =
      !q ||
      b.studentName.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((s, t) => s + t.amount, 0);
  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((s, t) => s + t.amount, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const unreadTotal = chatThreads.reduce((s, t) => s + t.unreadCount, 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* ── Header Banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold tracking-wide">
              TATA USAHA
            </span>
            <span className="text-xs text-slate-400">TAMANSISWA BATAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Dashboard Tata Usaha
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Kelola tagihan siswa, transaksi keuangan, dokumen sekolah, dan komunikasi resmi
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-xl font-black text-white">
              {bills.filter((b) => b.status === 'menunggu_verifikasi').length}
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Menunggu Verif</div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-xl font-black text-teal-300">{documents.length}</div>
            <div className="text-[10px] text-slate-300 font-medium">Dokumen</div>
          </div>
          {unreadTotal > 0 && (
            <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <div className="text-xl font-black text-rose-300">{unreadTotal}</div>
              <div className="text-[10px] text-rose-200 font-medium">Pesan Baru</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {(
          [
            { id: 'tagihan' as const, label: 'Tagihan', icon: Receipt, badge: undefined as number | undefined },
            { id: 'transaksi' as const, label: 'Transaksi', icon: DollarSign, badge: undefined as number | undefined },
            { id: 'dokumen' as const, label: 'Dokumen', icon: FileText, badge: undefined as number | undefined },
            {
              id: 'chat' as const,
              label: 'Chat Resmi',
              icon: MessageCircle,
              badge: unreadTotal > 0 ? unreadTotal : undefined,
            },
          ]
        ).map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TUTab)}
            className={`relative flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
              activeTab === id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
            {badge !== undefined && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — TAGIHAN
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tagihan' && (
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  label: 'Belum Lunas',
                  count: bills.filter((b) => b.status === 'belum_lunas').length,
                  cls: 'bg-rose-50 text-rose-800 border-rose-200',
                },
                {
                  label: 'Menunggu Verifikasi',
                  count: bills.filter((b) => b.status === 'menunggu_verifikasi').length,
                  cls: 'bg-amber-50 text-amber-800 border-amber-200',
                },
                {
                  label: 'Lunas',
                  count: bills.filter((b) => b.status === 'lunas').length,
                  cls: 'bg-teal-50 text-teal-800 border-teal-200',
                },
              ] as const
            ).map(({ label, count, cls }) => (
              <div
                key={label}
                className={`rounded-2xl border p-4 text-center ${cls}`}
              >
                <div className="text-2xl font-black">{count}</div>
                <div className="text-[10px] font-bold mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  placeholder="Cari siswa atau judul..."
                  className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              {/* Status filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={billStatusFilter}
                  onChange={(e) =>
                    setBillStatusFilter(e.target.value as BillStatus | 'all')
                  }
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">Semua Status</option>
                  <option value="belum_lunas">Belum Lunas</option>
                  <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
              <button
                onClick={loadBills}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setBillFormError(null);
                setBillFormSuccess(null);
                setShowBillModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Buat Tagihan Baru
            </button>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {billsLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Memuat data tagihan...
              </div>
            ) : billsError ? (
              <div className="p-6">
                <Alert type="error" message={billsError} />
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Tidak ada tagihan ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Siswa</th>
                      <th className="p-3.5">Tagihan</th>
                      <th className="p-3.5 text-right">Jumlah</th>
                      <th className="p-3.5 text-center">Jatuh Tempo</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredBills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {bill.studentName}
                          </div>
                          {bill.studentKelas && (
                            <div className="text-[10px] text-slate-400">
                              {bill.studentKelas}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">
                            {bill.title}
                          </div>
                          <div className="text-[10px] text-slate-400 bg-slate-100 inline-block px-1.5 py-0.5 rounded-md mt-0.5">
                            {bill.category}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900">
                          {formatRupiah(bill.amount)}
                        </td>
                        <td className="p-3.5 text-center text-slate-500">
                          {formatDate(bill.dueDate)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${BILL_STATUS_CLASS[bill.status]}`}
                          >
                            {BILL_STATUS_LABEL[bill.status]}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {bill.status === 'menunggu_verifikasi' && (
                              <button
                                onClick={() =>
                                  handleUpdateBillStatus(bill, 'lunas')
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 rounded-lg text-[10px] font-bold transition"
                                title="Tandai Lunas"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" />
                                Verifikasi
                              </button>
                            )}
                            {bill.status === 'belum_lunas' && (
                              <button
                                onClick={() =>
                                  handleUpdateBillStatus(bill, 'lunas')
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 rounded-lg text-[10px] font-bold transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Lunas
                              </button>
                            )}
                            {bill.status === 'lunas' && (
                              <button
                                onClick={() =>
                                  handleUpdateBillStatus(bill, 'belum_lunas')
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Batalkan
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBill(bill.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — TRANSAKSI
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transaksi' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-[10px] text-teal-600 font-bold">Total Pemasukan</div>
                <div className="text-base font-black text-teal-800">
                  {formatRupiah(totalPemasukan)}
                </div>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="text-[10px] text-rose-600 font-bold">Total Pengeluaran</div>
                <div className="text-base font-black text-rose-800">
                  {formatRupiah(totalPengeluaran)}
                </div>
              </div>
            </div>
            <div
              className={`border rounded-2xl p-4 flex items-center gap-3 ${
                saldo >= 0
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  saldo >= 0 ? 'bg-slate-200' : 'bg-rose-100'
                }`}
              >
                <DollarSign
                  className={`w-5 h-5 ${
                    saldo >= 0 ? 'text-slate-600' : 'text-rose-600'
                  }`}
                />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold">Saldo Bersih</div>
                <div
                  className={`text-base font-black ${
                    saldo >= 0 ? 'text-slate-900' : 'text-rose-700'
                  }`}
                >
                  {formatRupiah(saldo)}
                </div>
              </div>
            </div>
          </div>

          {/* Header + add button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">
              Riwayat Transaksi ({transactions.length})
            </h3>
            <button
              onClick={() => {
                setTransFormError(null);
                setTransFormSuccess(null);
                setTransForm({
                  receiptNumber: generateReceiptNumber(),
                  title: '',
                  category: 'Operasional',
                  amount: '',
                  type: 'pemasukan',
                  paymentMethod: 'Tunai',
                  description: '',
                });
                setShowTransModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Catat Transaksi
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {transLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Memuat transaksi...
              </div>
            ) : transError ? (
              <div className="p-6">
                <Alert type="error" message={transError} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Belum ada transaksi tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">No. Kwitansi</th>
                      <th className="p-3.5">Keterangan</th>
                      <th className="p-3.5 text-center">Metode</th>
                      <th className="p-3.5 text-center">Tipe</th>
                      <th className="p-3.5 text-right">Jumlah</th>
                      <th className="p-3.5 text-center">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="p-3.5 font-mono text-[10px] text-slate-500">
                          {tx.receiptNumber}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">
                            {tx.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {tx.category}
                          </div>
                        </td>
                        <td className="p-3.5 text-center text-slate-500">
                          {tx.paymentMethod}
                        </td>
                        <td className="p-3.5 text-center">
                          {tx.type === 'pemasukan' ? (
                            <span className="flex items-center justify-center gap-1 text-teal-700 font-bold">
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              Masuk
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-rose-700 font-bold">
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              Keluar
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-3.5 text-right font-mono font-black ${
                            tx.type === 'pemasukan'
                              ? 'text-teal-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {tx.type === 'pengeluaran' ? '-' : '+'}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="p-3.5 text-center text-slate-400">
                          {formatDate(tx.createdAt)}
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

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — DOKUMEN
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dokumen' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700">
                Manajemen Dokumen Sekolah
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Surat masuk, surat keluar, surat keterangan, arsip ijazah, dan dokumen umum
              </p>
            </div>
            <button
              onClick={() => openDocModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Dokumen
            </button>
          </div>

          {/* Category Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(
              [
                'Surat Masuk',
                'Surat Keluar',
                'Surat Keterangan',
                'Arsip Ijazah',
                'Dokumen Umum',
              ] as DocumentCategory[]
            ).map((cat) => {
              const count = documents.filter((d) => d.category === cat).length;
              return (
                <div
                  key={cat}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm"
                >
                  <div className="text-lg font-black text-teal-700">{count}</div>
                  <div className="text-[9px] text-slate-500 font-bold leading-tight mt-0.5">
                    {cat}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Documents Grid */}
          {docsLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memuat dokumen...
            </div>
          ) : docsError ? (
            <Alert type="error" message={docsError} />
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400 text-xs italic">
              Belum ada dokumen tersimpan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center">
                        {doc.category === 'Arsip Ijazah' ? (
                          <Archive className="w-4 h-4 text-teal-600" />
                        ) : doc.status === 'Selesai' ? (
                          <FileCheck className="w-4 h-4 text-teal-600" />
                        ) : doc.status === 'Menunggu TTD' ? (
                          <FileClock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <FileArchive className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.category}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${DOC_STATUS_CLASS[doc.status]}`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {doc.description && (
                    <p className="mt-2.5 text-[10px] text-slate-500 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {formatDate(doc.updatedAt)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openDocModal(doc)}
                        className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4 — CHAT RESMI
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {activeChat ? (
            /* ── Active Conversation ─────────────────────────────── */
            <div className="flex flex-col h-[600px]">
              {/* Conversation Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setActiveChat(null);
                    setChatMessages([]);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {activeChat.studentName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    @{activeChat.studentUsername}
                    {activeChat.studentKelas
                      ? ` · ${activeChat.studentKelas}`
                      : ''}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMsgsLoading ? (
                  <div className="flex items-center justify-center h-full gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memuat percakapan...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-400 text-xs">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Belum ada pesan. Mulai percakapan resmi dengan siswa ini.
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isTU = msg.senderRole === 'tata_usaha';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTU ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isTU
                              ? 'bg-teal-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          {!isTU && (
                            <div className="font-bold text-[10px] text-teal-700 mb-0.5">
                              {msg.senderName}
                            </div>
                          )}
                          <p className="leading-relaxed">{msg.content}</p>
                          <div
                            className={`text-[9px] mt-1 ${
                              isTU ? 'text-teal-200' : 'text-slate-400'
                            }`}
                          >
                            {formatDateTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ketik pesan resmi..."
                    className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatSending || !chatInput.trim()}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    {chatSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Thread List ─────────────────────────────────────── */
            <div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Chat Resmi TU – Siswa
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Percakapan mengenai tagihan, dokumen, dan administrasi
                  </p>
                </div>
                <button
                  onClick={loadChatThreads}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {chatLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memuat percakapan...
                </div>
              ) : chatError ? (
                <div className="p-6">
                  <Alert type="error" message={chatError} />
                </div>
              ) : chatThreads.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Belum ada percakapan. Siswa akan muncul di sini setelah menghubungi TU.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {chatThreads.map((thread) => (
                    <button
                      key={thread.studentId}
                      onClick={() => openChat(thread)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 transition flex items-center gap-3"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-full bg-teal-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {thread.studentName}
                          </div>
                          {thread.lastMessageAt && (
                            <span className="text-[9px] text-slate-400 shrink-0">
                              {formatDate(thread.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 truncate">
                            {thread.lastMessage || 'Belum ada pesan'}
                          </span>
                          {thread.unreadCount > 0 && (
                            <span className="shrink-0 w-5 h-5 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        {thread.studentKelas && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {thread.studentKelas}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════════ */}

      {/* ── Create Bill Modal ─────────────────────────────────────────────── */}
      {showBillModal && (
        <Modal title="Buat Tagihan Baru" onClose={() => setShowBillModal(false)}>
          <form onSubmit={handleCreateBill} className="space-y-4">
            {billFormSuccess && (
              <Alert type="success" message={billFormSuccess} />
            )}
            {billFormError && <Alert type="error" message={billFormError} />}

            {/* Student Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Siswa *
              </label>
              <select
                value={billForm.studentId}
                onChange={(e) =>
                  setBillForm((p) => ({ ...p, studentId: e.target.value }))
                }
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.kelas ? ` (${s.kelas})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Tagihan *
              </label>
              <input
                type="text"
                value={billForm.title}
                onChange={(e) =>
                  setBillForm((p) => ({ ...p, title: e.target.value }))
                }
                required
                placeholder="Contoh: SPP Bulan Oktober 2026"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Category & Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori *
                </label>
                <select
                  value={billForm.category}
                  onChange={(e) =>
                    setBillForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {[
                    'SPP',
                    'Uang Gedung',
                    'Seragam',
                    'Ekstrakurikuler',
                    'Kegiatan',
                    'Buku',
                    'Lainnya',
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jumlah (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={billForm.amount}
                  onChange={(e) =>
                    setBillForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                  placeholder="Contoh: 500000"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jatuh Tempo *
              </label>
              <input
                type="date"
                value={billForm.dueDate}
                onChange={(e) =>
                  setBillForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={billFormLoading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2"
              >
                {billFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
                {billFormLoading ? 'Menyimpan...' : 'Buat Tagihan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Create Transaction Modal ──────────────────────────────────────── */}
      {showTransModal && (
        <Modal
          title="Catat Transaksi Baru"
          onClose={() => setShowTransModal(false)}
        >
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            {transFormSuccess && (
              <Alert type="success" message={transFormSuccess} />
            )}
            {transFormError && <Alert type="error" message={transFormError} />}

            {/* Receipt Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                No. Kwitansi (Auto)
              </label>
              <input
                type="text"
                value={transForm.receiptNumber}
                onChange={(e) =>
                  setTransForm((p) => ({
                    ...p,
                    receiptNumber: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan *
              </label>
              <input
                type="text"
                value={transForm.title}
                onChange={(e) =>
                  setTransForm((p) => ({ ...p, title: e.target.value }))
                }
                required
                placeholder="Contoh: Pembayaran SPP – Ahmad"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe *
                </label>
                <select
                  value={transForm.type}
                  onChange={(e) =>
                    setTransForm((p) => ({
                      ...p,
                      type: e.target.value as TransactionType,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="pemasukan">Pemasukan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori *
                </label>
                <select
                  value={transForm.category}
                  onChange={(e) =>
                    setTransForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {[
                    'SPP',
                    'Operasional',
                    'Infrastruktur',
                    'Gaji',
                    'Kegiatan',
                    'Lainnya',
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount + Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jumlah (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={transForm.amount}
                  onChange={(e) =>
                    setTransForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <select
                  value={transForm.paymentMethod}
                  onChange={(e) =>
                    setTransForm((p) => ({
                      ...p,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {['Tunai', 'Transfer Bank', 'QRIS', 'Lainnya'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deskripsi (Opsional)
              </label>
              <textarea
                value={transForm.description}
                onChange={(e) =>
                  setTransForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Catatan tambahan..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransModal(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={transFormLoading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2"
              >
                {transFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {transFormLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Create/Edit Document Modal ────────────────────────────────────── */}
      {showDocModal && (
        <Modal
          title={editingDoc ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
          onClose={() => setShowDocModal(false)}
        >
          <form onSubmit={handleSaveDocument} className="space-y-4">
            {docFormSuccess && (
              <Alert type="success" message={docFormSuccess} />
            )}
            {docFormError && <Alert type="error" message={docFormError} />}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Dokumen *
              </label>
              <input
                type="text"
                value={docForm.title}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, title: e.target.value }))
                }
                required
                placeholder="Contoh: Surat Keterangan Aktif – Ahmad"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori *
                </label>
                <select
                  value={docForm.category}
                  onChange={(e) =>
                    setDocForm((p) => ({
                      ...p,
                      category: e.target.value as DocumentCategory,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {(
                    [
                      'Surat Masuk',
                      'Surat Keluar',
                      'Surat Keterangan',
                      'Arsip Ijazah',
                      'Dokumen Umum',
                    ] as DocumentCategory[]
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status *
                </label>
                <select
                  value={docForm.status}
                  onChange={(e) =>
                    setDocForm((p) => ({
                      ...p,
                      status: e.target.value as DocumentStatus,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {(['Arsip', 'Menunggu TTD', 'Selesai'] as DocumentStatus[]).map(
                    (s) => (
                      <option key={s}>{s}</option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Issued Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                value={docForm.issuedDate}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, issuedDate: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan (Opsional)
              </label>
              <textarea
                value={docForm.description}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                placeholder="Deskripsi singkat atau catatan dokumen..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={docFormLoading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2"
              >
                {docFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {docFormLoading
                  ? 'Menyimpan...'
                  : editingDoc
                  ? 'Simpan Perubahan'
                  : 'Tambah Dokumen'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
