import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Trash2,
  Users,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { playNotificationChime } from '../lib/audio.ts';
import type { AppNotification } from '../types/index.ts';

interface NotificationBroadcastPanelProps {
  userRole?: string;
  userName?: string;
}

export const NotificationBroadcastPanel: React.FC<NotificationBroadcastPanelProps> = ({
  userRole = 'admin',
  userName = 'Pengelola',
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AppNotification['type']>('announcement');
  const [targetRole, setTargetRole] = useState<'semua' | 'siswa' | 'guru' | 'tata_usaha' | 'kepala_sekolah'>('siswa');
  const [targetClass, setTargetClass] = useState<string>('semua');
  const [isImportant, setIsImportant] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMessage({ type: 'error', text: 'Judul dan isi pesan notifikasi wajib diisi.' });
      return;
    }

    setSending(true);
    setStatusMessage(null);
    try {
      await api.createNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        isImportant,
        targetRole: targetRole === 'semua' ? undefined : targetRole,
        targetClass: targetClass === 'semua' ? undefined : targetClass,
        linkType: type === 'quiz' ? 'quiz' : 'announcement',
      });

      playNotificationChime();
      setStatusMessage({
        type: 'success',
        text: `Notifikasi berhasil disiarkan! Notifikasi telah masuk ke Pusat Kontrol ${
          targetRole === 'semua' ? 'seluruh pengguna' : targetRole === 'siswa' ? 'seluruh siswa' : targetRole
        }.`,
      });

      setTitle('');
      setMessage('');
      setIsImportant(false);
      await loadNotifications();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengirimkan notifikasi. Silakan coba kembali.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!window.confirm('Hapus notifikasi ini dari sistem?')) return;
    try {
      await api.deleteNotificationAdmin(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus notifikasi.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm text-emerald-200">
              <Megaphone className="w-3.5 h-3.5 text-amber-300" />
              <span>Pusat Siaran & Kontrol Notifikasi TAMVESTA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kirim Notifikasi ke Siswa & Pengguna
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Buat dan kirimkan pengumuman resmi, info ujian, atau peringatan kedisiplinan langsung ke ponsel siswa (Android & iOS). Notifikasi langsung tampil di Pusat Kontrol siswa secara real-time.
            </p>
          </div>

          <button
            onClick={loadNotifications}
            disabled={loading}
            className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl text-xs font-bold transition backdrop-blur-sm border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Riwayat</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid Layout: Form (Left) & Riwayat Siaran (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Kirim Notifikasi (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Form Notifikasi Baru</h2>
                <p className="text-[11px] text-slate-500">Kirim pesan siaran terverifikasi</p>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Notifikasi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Contoh: 📢 Ujian Susulan Matematika Dimulai"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Pesan Notifikasi *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Tuliskan detail pengumuman atau instruksi untuk siswa..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Penerima
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e: any) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="siswa">Seluruh Siswa</option>
                    <option value="guru">Seluruh Guru</option>
                    <option value="semua">Semua Pengguna</option>
                    <option value="tata_usaha">Tata Usaha</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="announcement">📢 Pengumuman</option>
                    <option value="quiz">📝 Kuis & Ujian</option>
                    <option value="general">ℹ️ Informasi Umum</option>
                    <option value="warning">⚠️ Peringatan / Disiplin</option>
                    <option value="tuition">💳 Administrasi & SPP</option>
                  </select>
                </div>
              </div>

              {targetRole === 'siswa' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Khusus Kelas (Opsional)
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="semua">Semua Kelas</option>
                    <option value="X IPA 1">X IPA 1</option>
                    <option value="X IPA 2">X IPA 2</option>
                    <option value="X IPS 1">X IPS 1</option>
                    <option value="XI IPA 1">XI IPA 1</option>
                    <option value="XI IPS 1">XI IPS 1</option>
                    <option value="XII IPA 1">XII IPA 1</option>
                    <option value="XII IPS 1">XII IPS 1</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notif_important"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="notif_important" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Tandai sebagai Notifikasi Penting (Pusat Kontrol Badge Merah)
                </label>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Mengirim Siaran...' : 'Kirim Siaran Notifikasi Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat Notifikasi yang Pernah Dikirim (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Riwayat Siaran Notifikasi ({notifications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Daftar pesan notifikasi yang telah dikirim ke perangkat pengguna
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold text-xs animate-pulse border border-slate-200">
              Memuat data riwayat siaran...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Notifikasi yang Diterbitkan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Gunakan form di sebelah kiri untuk mengirimkan pengumuman atau info penting ke seluruh siswa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {n.type}
                        </span>
                        {n.isImportant && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Penting</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium">
                          Target: <strong className="text-slate-700">{n.targetRole || 'Semua Pengguna'}</strong>
                          {n.targetClass ? ` (${n.targetClass})` : ''}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base">{n.title}</h3>
                    </div>

                    <button
                      onClick={() => handleDeleteNotif(n.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition shrink-0"
                      title="Hapus Notifikasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(n.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        • {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </span>

                    <span className="font-bold text-slate-600">
                      Dibaca oleh: <strong className="text-emerald-700">{n.readBy?.length || 0}</strong> pengguna
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
