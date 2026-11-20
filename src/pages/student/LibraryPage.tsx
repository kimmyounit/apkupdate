import React, { useState, useEffect, useMemo } from 'react';
import {
  Library,
  BookOpen,
  Search,
  ChevronRight,
  X,
  ArrowLeft,
  BookCheck,
  Sparkles,
  Filter,
  Download,
  ExternalLink,
  GraduationCap,
  FileText,
  Bookmark,
  CheckCircle2,
  Info,
  Layers,
  Share2,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { DigitalBook } from '../../types/index.ts';
import { OFFICIAL_KEMENDIKDASMEN_BOOKS } from '../../constants/kemendikdasmenBooks.ts';

interface LibraryPageProps {
  onBack?: () => void;
  role?: 'guru' | 'siswa' | 'admin' | 'tata_usaha' | string;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onBack, role = 'siswa' }) => {
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Semua');
  const [selectedBookType, setSelectedBookType] = useState<string>(role === 'guru' ? 'Semua' : 'Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [readingBook, setReadingBook] = useState<DigitalBook | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getBooks();
      // Gabungkan koleksi dari server/offlineStore dengan koleksi resmi Kemendikdasmen
      const bookMap = new Map<string, DigitalBook>();
      OFFICIAL_KEMENDIKDASMEN_BOOKS.forEach((b) => bookMap.set(b.id, b));
      if (Array.isArray(data)) {
        data.forEach((b) => bookMap.set(b.id, b));
      }
      setBooks(Array.from(bookMap.values()));
    } catch (err) {
      console.warn('Gagal memuat buku dari API, menggunakan katalog resmi Kemendikdasmen:', err);
      setBooks(OFFICIAL_KEMENDIKDASMEN_BOOKS);
    } finally {
      setLoading(false);
    }
  };

  // Kategori unik
  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return ['Semua', ...Array.from(set)];
  }, [books]);

  // Jenjang unik
  const grades = ['Semua', 'SMP Kelas 7', 'SMP Kelas 8', 'SMP Kelas 9', 'SMA/SMK Kelas 10', 'Umum / Tamansiswa'];

  // Filter buku
  const filtered = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.gradeLevel && b.gradeLevel.toLowerCase().includes(q));

      const matchesGrade = selectedGrade === 'Semua' || b.gradeLevel === selectedGrade;
      const matchesType = selectedBookType === 'Semua' || b.bookType === selectedBookType;
      const matchesCat = selectedCategory === 'Semua' || b.category === selectedCategory;

      return matchesSearch && matchesGrade && matchesType && matchesCat;
    });
  }, [books, searchQuery, selectedGrade, selectedBookType, selectedCategory]);

  // Statistik buku
  const stats = useMemo(() => {
    const total = books.length;
    const guru = books.filter((b) => b.bookType === 'Buku Guru').length;
    const siswa = books.filter((b) => b.bookType === 'Buku Siswa').length;
    return { total, guru, siswa };
  }, [books]);

  const handleDownloadPdf = (book: DigitalBook, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const downloadTarget = book.downloadUrl || book.pdfUrl || 'https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka';
    
    // Tampilkan notifikasi unduhan
    setDownloadSuccessToast(`Mengunduh file PDF resmi: "${book.title}" dari Kemendikdasmen...`);
    setTimeout(() => setDownloadSuccessToast(null), 5000);

    // Buka link unduh resmi di tab baru
    window.open(downloadTarget, '_blank', 'noopener,noreferrer');
  };

  const handleOpenSourcePortal = (book: DigitalBook, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const source = book.sourceUrl || book.pdfUrl || 'https://buku.kemendikdasmen.go.id/';
    window.open(source, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notifikasi Unduh */}
      {downloadSuccessToast && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0 animate-bounce" />
          <div className="text-xs sm:text-sm font-bold">
            {downloadSuccessToast}
          </div>
          <button
            onClick={() => setDownloadSuccessToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header Kemendikdasmen & Tamansiswa */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-xs font-black text-emerald-200 border border-emerald-400/30">
              <Library className="w-3.5 h-3.5 text-emerald-400" />
              <span>PERPUSTAKAAN DIGITAL RESMI SIBI KEMENDIKDASMEN & TAMANSISWA</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Katalog Buku & Modul PDF Kemendikdasmen
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 max-w-2xl leading-relaxed">
              Akses gratis dan legal ke seluruh Buku Teks Kurikulum Merdeka (Buku Siswa & Buku Panduan Guru), modul pembelajaran, serta literatur pendidikan dari portal resmi Sistem Informasi Perbukuan Indonesia (SIBI) Kemendikdasmen RI.
            </p>

            {/* Quick Link Resmi SIBI */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href="https://buku.kemendikdasmen.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/30 hover:bg-teal-500/50 text-teal-200 text-xs font-bold border border-teal-400/30 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>buku.kemendikdasmen.go.id</span>
              </a>
              <a
                href="https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 text-xs font-bold border border-cyan-400/30 transition shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Katalog Kurikulum Merdeka</span>
              </a>
              <button
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                <Info className="w-3.5 h-3.5 text-amber-300" />
                <span>Panduan Unduh PDF SIBI</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex sm:flex-col lg:flex-row items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-white">{stats.total}</span>
              <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider">Koleksi Buku</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-emerald-300">{stats.siswa}</span>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Buku Siswa</span>
            </div>
            <div className="bg-indigo-500/20 backdrop-blur-md rounded-2xl p-4 border border-indigo-400/30 text-center min-w-[110px]">
              <span className="block text-2xl font-black text-indigo-200">{stats.guru}</span>
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Buku Guru</span>
            </div>
          </div>
        </div>
      </div>

      {/* SIBI Kemendikdasmen Info & Direct Download Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Unduh Langsung File PDF Buku Kemendikdasmen</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">100% Gratis & Legal</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              Klik tombol <strong className="text-teal-700">"Unduh PDF"</strong> pada setiap kartu buku untuk mengunduh buku teks utama dan buku panduan guru langsung dari server resmi SIBI Kemendikdasmen (<span className="font-mono text-teal-800">https://buku.kemendikdasmen.go.id/</span>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <a
            href="https://buku.kemendikdasmen.go.id/katalog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Kunjungi SIBI Pusat</span>
          </a>
        </div>
      </div>

      {/* Tabs Filter Tipe Buku: Semua, Buku Siswa, Buku Guru */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedBookType('Semua')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center justify-center gap-2 ${
            selectedBookType === 'Semua'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Tipe Buku ({stats.total})</span>
        </button>

        <button
          onClick={() => setSelectedBookType('Buku Siswa')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center justify-center gap-2 ${
            selectedBookType === 'Buku Siswa'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Buku Teks Siswa ({stats.siswa})</span>
        </button>

        <button
          onClick={() => setSelectedBookType('Buku Guru')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center justify-center gap-2 ${
            selectedBookType === 'Buku Guru'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookCheck className="w-3.5 h-3.5" />
          <span>Buku Panduan Guru ({stats.guru})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku, mata pelajaran, materi, penulis, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Jenjang Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">Jenjang:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full md:w-48 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none pb-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold animate-pulse">Memuat koleksi perpustakaan Kemendikdasmen...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <Library className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Tidak Ditemukan Buku yang Sesuai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada buku yang cocok dengan filter jenjang "{selectedGrade}", kategori "{selectedCategory}", atau kata kunci "{searchQuery}".
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGrade('Semua');
                setSelectedBookType('Semua');
                setSelectedCategory('Semua');
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition"
            >
              Reset Semua Filter
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>Menampilkan {filtered.length} buku pelajaran & modul resmi</span>
            <span>Kurikulum Merdeka Kemendikdasmen</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((book) => {
              const isGuruBook = book.bookType === 'Buku Guru';
              return (
                <div
                  key={book.id}
                  onClick={() => {
                    setReadingBook(book);
                    setActivePage(0);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  {/* Top Cover Visual */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                    <img
                      src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Badges on Cover */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                          isGuruBook
                            ? 'bg-indigo-600/90 text-white border border-indigo-400/40'
                            : 'bg-emerald-600/90 text-white border border-emerald-400/40'
                        }`}
                      >
                        {book.bookType || 'Buku Siswa'}
                      </span>
                      {book.gradeLevel && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 text-white border border-white/10 backdrop-blur-md">
                          {book.gradeLevel}
                        </span>
                      )}
                    </div>

                    {/* Bottom Info on Cover */}
                    <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                      <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{book.curriculum || 'Kemendikdasmen RI'}</span>
                      </span>
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-2 leading-snug drop-shadow-sm">
                        {book.title}
                      </h4>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                        Penulis: <span className="text-slate-700">{book.author}</span>
                      </p>
                      {book.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                      <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100">
                        <span>{book.totalPages} Halaman</span>
                        <span>{book.fileSize || 'PDF Resmi'}</span>
                        <span>{book.publishedYear}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Unduh PDF & Pratinjau */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(book, e)}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition active:scale-98"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File PDF</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReadingBook(book);
                            setActivePage(0);
                          }}
                          className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition text-center flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>Baca Online</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenSourcePortal(book, e)}
                          title="Buka Halaman Buku di Portal SIBI Kemendikdasmen"
                          className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-teal-700 border border-slate-200 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">SIBI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-teal-500/30 text-teal-300">
                      {readingBook.bookType || 'Kemendikdasmen'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {readingBook.gradeLevel || 'Semua Jenjang'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base line-clamp-1">{readingBook.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setReadingBook(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-bar Unduh & SIBI Link */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <span>Penulis: <strong className="text-slate-800">{readingBook.author}</strong></span>
                <span>•</span>
                <span>Ukuran: <strong className="text-teal-700">{readingBook.fileSize || 'PDF Resmi'}</strong></span>
                <span>•</span>
                <span>Tahun: <strong className="text-slate-800">{readingBook.publishedYear}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(readingBook)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSourcePortal(readingBook)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Buka di SIBI</span>
                </button>
              </div>
            </div>

            {/* Reading Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 font-serif leading-relaxed text-sm sm:text-base bg-amber-50/20">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-2 font-sans mb-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    Buku Pelajaran Digital Kemendikdasmen RI
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{readingBook.title}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                    {readingBook.description}
                  </p>
                </div>

                <div className="prose prose-slate max-w-none">
                  {Array.isArray(readingBook.content) && readingBook.content.length > 0 ? (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-h-[220px]">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Bab & Pokok Pembahasan (Bagian {activePage + 1} dari {readingBook.content.length})</span>
                      </h4>
                      <p className="whitespace-pre-line text-sm sm:text-base text-slate-800 leading-loose">
                        {readingBook.content[activePage]}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-h-[200px]">
                      <p className="text-sm text-slate-600 italic">
                        {readingBook.description || 'Konten modul digital siap diunduh dan dipelajari secara lengkap dalam format PDF.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
                disabled={activePage === 0}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Bab Sebelumnya
              </button>

              <span className="text-xs text-slate-500 font-bold">
                {Array.isArray(readingBook.content) && readingBook.content.length > 0
                  ? `Bab ${activePage + 1} dari ${readingBook.content.length}`
                  : `Total ${readingBook.totalPages} Halaman`}
              </span>

              <button
                onClick={() =>
                  setActivePage((prev) =>
                    Array.isArray(readingBook.content) ? Math.min(readingBook.content.length - 1, prev + 1) : 0
                  )
                }
                disabled={
                  !Array.isArray(readingBook.content) || activePage >= readingBook.content.length - 1
                }
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                Bab Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Panduan Unduh SIBI Kemendikdasmen */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Panduan Unduh PDF SIBI Kemendikdasmen</h3>
                  <p className="text-xs text-slate-500">Sistem Informasi Perbukuan Indonesia</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-teal-900">
                <strong>Alamat Portal Resmi:</strong>
                <a
                  href="https://buku.kemendikdasmen.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 font-mono text-teal-700 underline font-bold"
                >
                  https://buku.kemendikdasmen.go.id/
                </a>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Cara Mengunduh Buku di TAMVESTA:</h4>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Pilih jenjang kelas (misal: <strong>SMP Kelas 7, 8, atau 9</strong>).</li>
                  <li>Pilih tipe buku: <strong>Buku Teks Siswa</strong> untuk materi pelajaran, atau <strong>Buku Panduan Guru</strong> untuk ATP & silabus modul ajar.</li>
                  <li>Klik tombol hijau <strong>"Unduh File PDF"</strong> pada buku yang diinginkan. Dokumen PDF resmi akan langsung diunduh secara gratis.</li>
                  <li>Anda juga dapat membaca buku secara langsung dengan menekan tombol <strong>"Baca Online"</strong>.</li>
                </ol>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Informasi Hak Cipta & Lisensi:</strong> Buku teks pelajaran Kurikulum Merdeka ini diterbitkan resmi oleh Pusat Perbukuan Kemendikdasmen RI untuk dimanfaatkan secara bebas oleh seluruh pendidik dan peserta didik di Indonesia.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
