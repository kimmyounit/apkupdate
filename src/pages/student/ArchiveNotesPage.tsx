import React, { useState, useEffect } from 'react';
import {
  Archive,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Check,
  X,
  FileText,
  Tag,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { PersonalNote } from '../../types/index.ts';

const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  { id: 'blue', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900', dot: 'bg-blue-500' },
  { id: 'amber', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', dot: 'bg-amber-500' },
  { id: 'purple', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-900', dot: 'bg-purple-500' },
  { id: 'rose', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', dot: 'bg-rose-500' },
];

export const ArchiveNotesPage: React.FC = () => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Note Modal state (for create & edit)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('emerald');
  const [saving, setSaving] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await api.getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('emerald');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || 'emerald');
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) {
      alert('Judul atau isi catatan tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      if (editingNoteId) {
        const updated = await api.updateNote(editingNoteId, {
          title: noteTitle,
          content: noteContent,
          color: noteColor,
        });
        setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
      } else {
        const created = await api.createNote({
          title: noteTitle,
          content: noteContent,
          color: noteColor,
        });
        setNotes((prev) => [created, ...prev]);
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Hapus catatan pribadi ini? Tindakan tidak dapat dibatalkan.')) return;
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus catatan.');
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Archive className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-black">Arsip & Catatan Siswa</h1>
              <p className="text-xs text-teal-100">
                Catatan belajar, rangkuman, dan catatan pribadi rahasia Anda
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari dalam catatan atau rangkuman Anda..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Memuat catatan pribadi...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              {searchQuery ? 'Catatan Tidak Ditemukan' : 'Belum Ada Catatan Pribadi'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : 'Catatan ini bersifat pribadi dan hanya dapat dibaca oleh Anda sendiri. Mulai catat rangkuman pelajaranmu!'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Catatan Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const colorCfg =
              COLOR_OPTIONS.find((c) => c.id === note.color) || COLOR_OPTIONS[0];

            return (
              <div
                key={note.id}
                className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs hover:shadow-md ${colorCfg.bg}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.dot}`} />
                    <h3 className={`font-black text-sm sm:text-base ${colorCfg.text}`}>
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 rounded-xl hover:bg-black/5 text-slate-600 transition"
                      title="Edit Catatan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-600 transition"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-700 mt-2.5 whitespace-pre-line leading-relaxed font-normal">
                  {note.content}
                </p>

                {/* Footer Time */}
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Terakhir diperbarui: {formatDate(note.updatedAt)}</span>
                  </span>
                  <span className="font-semibold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-full border border-black/5">
                    Pribadi
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-sm text-slate-800">
                {editingNoteId ? 'Edit Catatan' : 'Buat Catatan Baru'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Catatan
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Misal: Rangkuman Matematika Bab 3"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Color Tag Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Warna Label Catatan
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNoteColor(c.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border-2 ${
                        noteColor === c.id ? 'border-slate-800 scale-110' : 'border-transparent'
                      } ${c.dot}`}
                    >
                      {noteColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Catatan Pribadi
                </label>
                <textarea
                  rows={7}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Tuliskan catatan, rumus penting, tugas rumah, atau rangkuman materi..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
