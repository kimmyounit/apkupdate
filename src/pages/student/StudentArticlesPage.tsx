import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Calendar,
  User,
  Heart,
  Eye,
  ArrowLeft,
  Sparkles,
  Share2,
  CheckCircle2,
  Filter,
  FileText,
  GraduationCap,
  Clock,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { TeacherArticle } from '../../types/index.ts';

export const StudentArticlesPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [articles, setArticles] = useState<TeacherArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Artikel Guru' | 'Metode Pembelajaran'>('Semua');
  const [selectedArticle, setSelectedArticle] = useState<TeacherArticle | null>(null);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [activeCategory]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const catParam = activeCategory === 'Semua' ? undefined : activeCategory;
      const res = await api.getArticles(catParam, true);
      setArticles(res);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = (articleId: string) => {
    setLikedArticles((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  const filtered = articles.filter((art) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.authorName.toLowerCase().includes(q) ||
      (art.authorSubject && art.authorSubject.toLowerCase().includes(q));
    return matchQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                Artikel & Metode Pembelajaran
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                  Guru
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Materi wawasan, metode belajar & artikel resmi guru Tamansiswa</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari artikel, topik, atau nama guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {(['Semua', 'Artikel Guru', 'Metode Pembelajaran'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none ${
                activeCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs shadow-emerald-700/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'Semua' ? 'Semua Artikel' : cat}
            </button>
          ))}
        </div>

        {/* Article Cards List */}
        {loading ? (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-3 bg-slate-100 rounded-md w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 mt-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Artikel yang Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada artikel yang sesuai dengan pencarian atau kategori yang dipilih saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((art) => {
              const isLiked = likedArticles.includes(art.id);
              const likeCount = (art.likesCount || 0) + (isLiked ? 1 : 0);

              return (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            art.category === 'Metode Pembelajaran'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {art.category}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(art.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h2 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {art.title}
                      </h2>
                    </div>

                    {art.coverUrl && (
                      <img
                        src={art.coverUrl}
                        alt={art.title}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{art.summary}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] uppercase">
                        {art.authorAvatar ? (
                          <img
                            src={art.authorAvatar}
                            alt={art.authorName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          art.authorName.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 text-xs block">{art.authorName}</span>
                        {art.authorSubject && (
                          <span className="text-[10px] text-slate-400 block -mt-0.5">{art.authorSubject}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                          }`}
                        />
                        {likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {art.readsCount || 120}
                      </span>
                      <span className="text-emerald-700 font-bold flex items-center group-hover:translate-x-0.5 transition-transform">
                        Baca <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Reader Modal (Detail Artikel Lengkap) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  selectedArticle.category === 'Metode Pembelajaran'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                {selectedArticle.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {selectedArticle.authorAvatar ? (
                      <img
                        src={selectedArticle.authorAvatar}
                        alt={selectedArticle.authorName}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      selectedArticle.authorName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
                      {selectedArticle.authorName}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    </h4>
                    <p className="text-[11px] text-slate-500">{selectedArticle.authorSubject || 'Guru Pengampu'}</p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <p>
                    {new Date(selectedArticle.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Cover Image if available */}
              {selectedArticle.coverUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={selectedArticle.coverUrl}
                    alt={selectedArticle.title}
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}

              {/* Summary Highlight Box */}
              <div className="p-3.5 bg-emerald-50/80 border-l-4 border-emerald-600 rounded-r-xl">
                <p className="text-xs text-emerald-900 font-semibold italic">{selectedArticle.summary}</p>
              </div>

              {/* Full Content Body */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line pt-2">
                {selectedArticle.content}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleToggleLike(selectedArticle.id)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  likedArticles.includes(selectedArticle.id)
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    likedArticles.includes(selectedArticle.id) ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
                <span>
                  {(selectedArticle.likesCount || 0) + (likedArticles.includes(selectedArticle.id) ? 1 : 0)} Suka
                </span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Tersalin!' : 'Bagikan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
