import React, { useState, useEffect } from 'react';
import { Library, BookOpen, Search, ChevronRight, X, ArrowLeft, BookCheck, Sparkles, Filter } from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { DigitalBook } from '../../types/index.ts';

interface LibraryPageProps {
  onBack?: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onBack }) => {
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [readingBook, setReadingBook] = useState<DigitalBook | null>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Semua', ...Array.from(new Set(books.map((b) => b.category || 'Umum')))];

  const filtered = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-800 via-cyan-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-cyan-200 border border-white/10">
              <Library className="w-3.5 h-3.5 text-amber-300" />
              <span>PERPUSTAKAAN DIGITAL TAMANSISWA</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Halaman Perpustakaan Digital</h1>
            <p className="text-xs sm:text-sm text-cyan-100 max-w-xl">
              Koleksi buku digital sekolah, literatur sains, modul belajar interaktif, dan karya sastra Ki Hadjar Dewantara.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold text-cyan-100 backdrop-blur-sm border border-white/15">
              Total {books.length} Buku Koleksi
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul buku, penulis, atau topik..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-xs'
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
          <p className="text-xs font-bold animate-pulse">Memuat koleksi perpustakaan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Library className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Belum Ada Buku Digital</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'Semua'
              ? 'Tidak ada buku yang cocok dengan filter atau kata kunci pencarian.'
              : 'Administrator sekolah belum menambahkan koleksi buku digital ke perpustakaan. Buku akan muncul di sini setelah ditambahkan oleh Admin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map((book) => (
            <div
              key={book.id}
              onClick={() => {
                setReadingBook(book);
                setActivePage(0);
              }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                <img
                  src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="w-full py-1.5 bg-cyan-600 text-white rounded-xl text-center text-[11px] font-bold shadow-md">
                    Buka Buku
                  </span>
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black bg-slate-900/80 text-white backdrop-blur-xs">
                  {book.category}
                </span>
              </div>

              <div className="p-3.5 space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-cyan-700 transition">
                  {book.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{book.author}</p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{book.totalPages} Hal</span>
                  <span>{book.publishedYear}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base line-clamp-1">{readingBook.title}</h3>
                  <p className="text-xs text-slate-400">{readingBook.author} • {readingBook.category}</p>
                </div>
              </div>
              <button
                onClick={() => setReadingBook(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reading Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 font-serif leading-relaxed text-sm sm:text-base bg-amber-50/20">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-2 font-sans mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                    Halaman Pembaca Digital
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{readingBook.title}</h2>
                  <p className="text-xs text-slate-500">{readingBook.description}</p>
                </div>

                <div className="prose prose-slate max-w-none">
                  {Array.isArray(readingBook.content) && readingBook.content.length > 0 ? (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-h-[220px]">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                        Bagian {activePage + 1} dari {readingBook.content.length}
                      </h4>
                      <p className="whitespace-pre-line text-sm sm:text-base text-slate-800 leading-loose">
                        {readingBook.content[activePage]}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-h-[200px]">
                      <p className="text-sm text-slate-600 italic">
                        {readingBook.description || 'Konten buku digital siap diakses oleh siswa.'}
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
                Halaman Sebelumnya
              </button>

              <span className="text-xs text-slate-500 font-bold">
                {Array.isArray(readingBook.content) && readingBook.content.length > 0
                  ? `Hal. ${activePage + 1} / ${readingBook.content.length}`
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
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                Halaman Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
