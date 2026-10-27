import { compressImage } from '../lib/imageCompressor.ts';
import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Send,
  Eye,
  Trash2,
  AlertCircle,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Pin,
} from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import type { StudentPost } from '../types/index.ts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: StudentPost) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const isSupport =
    user?.role === 'support' ||
    user?.isDeveloper ||
    user?.username?.toLowerCase() === 'tamvesta' ||
    user?.id === 'user_support_tamvesta';

  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetMedia = () => {
    setMediaType('none');
    setMediaUrl(null);
    setMediaName('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    // Validate image mime
    if (!file.type.startsWith('image/')) {
      setErrorMessage('File yang dipilih bukan merupakan format foto/gambar yang valid (JPG, PNG, WEBP).');
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file foto maksimal 10MB.');
      return;
    }

    compressImage(file).then((compressed) => {
      setMediaType('photo');
      setMediaUrl(compressed);
      setMediaName(file.name);
    }).catch(() => {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaType('photo');
        setMediaUrl(reader.result as string);
        setMediaName(file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    // Validate video mime
    if (!file.type.startsWith('video/')) {
      setErrorMessage('File yang dipilih bukan merupakan format video yang valid (MP4, WEBM).');
      return;
    }

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Ukuran file video maksimal 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaType('video');
      setMediaUrl(reader.result as string);
      setMediaName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!caption.trim() && !mediaUrl) {
      setErrorMessage('Silakan tulis keterangan (caption) atau tambahkan foto/video sebelum memposting.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const created = await api.createPost({
        caption: caption.trim(),
        mediaType: mediaType === 'none' ? undefined : mediaType,
        mediaUrl: mediaUrl || undefined,
        mediaName: mediaName || undefined,
        isPinned: isSupport ? isPinned : undefined,
      });

      onPostCreated(created);
      // Reset states
      setCaption('');
      handleResetMedia();
      setIsPreviewMode(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menerbitkan postingan ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isSupport
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border-amber-200'
              : 'bg-slate-50/70 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                isSupport
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isSupport ? <Sparkles className="w-4 h-4 fill-slate-900" /> : '+'}
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isSupport ? 'Siarkan Pesan Resmi Support' : 'Buat Postingan Siswa'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isSupport
                  ? 'Disiarkan ke feed beranda seluruh siswa dengan lencana resmi Developer'
                  : 'Bagikan momen & kegiatan Tamansiswa Batam'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Author Badge */}
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatarUrl ||
                (isSupport
                  ? '/assets/tamvesta_mascot.jpg'
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Siswa')}&backgroundColor=0284c7`)
              }
              alt={user?.name}
              className={`w-11 h-11 rounded-2xl object-cover border shadow-sm ${
                isSupport ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200'
              }`}
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-black text-slate-900 leading-tight">{user?.name}</p>
                {isSupport ? (
                  <VerifiedBadge size="xs" isDeveloper={true} />
                ) : (
                  user?.isVerified && <VerifiedBadge size="xs" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                @{user?.username} •{' '}
                <span className={isSupport ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                  {isSupport ? 'Developer & Support Resmi TAMVESTA' : (user?.kelas || 'Siswa Tamvesta')}
                </span>
              </p>
            </div>
          </div>

          {/* Opsi Sematkan di Paling Atas (Khusus Akun Support) */}
          {isSupport && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-800 rounded-xl">
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Sematkan Postingan (Pinned Post)</p>
                  <p className="text-[11px] text-slate-500">Tampilkan di posisi teratas feed beranda siswa</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          )}

          {/* Switch Tab: Edit vs Preview */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                !isPreviewMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tulis & Lampirkan
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                isPreviewMode ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Tampilan</span>
            </button>
          </div>

          {!isPreviewMode ? (
            <div className="space-y-4">
              {/* Caption Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan (Caption):
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    isSupport
                      ? 'Tulis pengumuman resmi, rilis fitur baru, update aplikasi, atau pesan penting untuk seluruh siswa Tamansiswa Batam...'
                      : 'Apa kabar hari ini di Tamansiswa? Bagikan kegiatan belajar, tugas kelompok, pesan motivasi, atau karya terbarumu...'
                  }
                  rows={4}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 placeholder-slate-400 resize-none bg-slate-50/50"
                  maxLength={1000}
                />
                <div className="flex justify-end text-[10px] text-slate-400 mt-1">
                  {caption.length} / 1000 karakter
                </div>
              </div>

              {/* Media Attachments Action Buttons */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-700">Lampirkan Media:</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Photo Button */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold transition ${
                      mediaType === 'photo'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Tambah Foto</span>
                  </button>

                  {/* Video Button */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold transition ${
                      mediaType === 'video'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-400/30'
                        : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4 text-cyan-600" />
                    <span>Tambah Video</span>
                  </button>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Uploaded Media Preview Thumbnail */}
              {mediaUrl && (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
                  {mediaType === 'photo' ? (
                    <img
                      src={mediaUrl}
                      alt="Uploaded preview"
                      className="w-full max-h-56 object-contain bg-slate-900"
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full max-h-56 object-contain bg-slate-900"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                      {mediaType === 'photo' ? 'Foto Terlampir' : 'Video Terlampir'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetMedia}
                      className="p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition shadow-md"
                      title="Hapus media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Preview Card */
            <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Siswa')}&backgroundColor=0284c7`
                  }
                  alt={user?.name}
                  className="w-10 h-10 rounded-2xl object-cover border"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{user?.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    @{user?.username} • Baru saja
                  </p>
                </div>
              </div>

              {caption && (
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {caption}
                </p>
              )}

              {mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-950">
                  {mediaType === 'photo' ? (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full max-h-72 object-cover"
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full max-h-72 object-cover"
                    />
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <Heart className="w-4 h-4 text-rose-500" /> 0 Suka
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> 0 Komentar
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
              isSupport
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 shadow-amber-500/25'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {loading ? (
              <span>Menerbitkan...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isSupport ? 'Siarkan Pesan Support' : 'Posting'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
