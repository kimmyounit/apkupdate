import React, { useState, useEffect } from 'react';
import { BookOpen, User as UserIcon, MapPin, Search, Calendar, ChevronRight, X, School, ArrowLeft, AlertCircle, Maximize2 } from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { Subject } from '../../types/index.ts';
import { ImageLightboxModal } from '../../components/ImageLightboxModal.tsx';

interface SubjectsPageProps {
  onBack?: () => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-emerald-200 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>KURIKULUM & AKADEMIK SISWA</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">Halaman Mata Pelajaran</h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Daftar mata pelajaran aktif, modul kurikulum, jadwal pembelajaran, dan guru pengampu Perguruan Tamansiswa Batam.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold text-emerald-100 backdrop-blur-sm border border-white/15">
              Total {subjects.length} Mapel
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran, kode, atau guru..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Klik pada kartu mata pelajaran untuk melihat detail kurikulum lengkap
        </p>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <p className="text-xs font-bold animate-pulse">Memuat daftar mata pelajaran...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Belum Ada Mata Pelajaran</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'Tidak ada mata pelajaran yang cocok dengan pencarian Anda.'
              : 'Administrator sekolah belum menambahkan data mata pelajaran. Mata pelajaran yang ditambahkan oleh Admin akan otomatis muncul di halaman ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col"
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={sub.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'}
                  alt={sub.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/90 text-slate-800 backdrop-blur-sm shadow-xs">
                  {sub.code}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                  {sub.grade}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(sub.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80');
                  }}
                  className="absolute bottom-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition z-10 flex items-center gap-1 text-[10px] font-bold shadow-md hover:scale-105"
                  title="Perbesar Foto Mata Pelajaran"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
                <div className="absolute bottom-3 left-3 right-20 text-white">
                  <h3 className="font-black text-lg line-clamp-1 group-hover:text-emerald-300 transition">
                    {sub.name}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {sub.description || 'Materi pembelajaran komprehensif Perguruan Tamansiswa Batam.'}
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{sub.teacherName}</span>
                  </div>
                  {sub.room && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sub.room}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <span>Lihat Detail Pembelajaran</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Mata Pelajaran */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div
              className="relative h-56 bg-slate-900 group cursor-zoom-in"
              onClick={() => setLightboxImage(selectedSubject.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80')}
              title="Klik untuk memperbesar foto mapel"
            >
              <img
                src={selectedSubject.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'}
                alt={selectedSubject.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition shadow">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Perbesar Foto</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSubject(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white pointer-events-none">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                  {selectedSubject.code} • {selectedSubject.grade}
                </span>
                <h2 className="text-2xl font-black mt-1">{selectedSubject.name}</h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Mapel</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {selectedSubject.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Guru Pengampu:</span>
                  <strong className="text-slate-800">{selectedSubject.teacherName}</strong>
                </div>
                {selectedSubject.room && (
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Ruang Kelas / Lab:</span>
                    <strong className="text-slate-800">{selectedSubject.room}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Tingkat Pendidikan:</span>
                  <strong className="text-slate-800">{selectedSubject.grade}</strong>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Tutup Informasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pembesar Foto (Image Lightbox) */}
      <ImageLightboxModal
        imageUrl={lightboxImage}
        title={selectedSubject?.name || 'Foto Mata Pelajaran'}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
