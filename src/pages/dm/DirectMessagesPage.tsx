import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Video,
  X,
  ArrowLeft,
  Smile,
  Copy,
  Trash2,
  CornerUpLeft,
  Share2,
  Clock,
  Play,
  Pause,
  Check,
  CheckCheck,
  Sparkles,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { DirectMessage, DMConversation, StudentNote, User } from '../../types/index.ts';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';

interface DirectMessagesPageProps {
  onBack?: () => void;
  initialPartnerId?: string;
}

const QUICK_EMOJIS = ['❤️', '😂', '😍', '😢', '😮', '👍', '🔥'];

export const DirectMessagesPage: React.FC<DirectMessagesPageProps> = ({
  onBack,
  initialPartnerId,
}) => {
  const { user } = useAuth();

  // Navigation & State
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activeNotes, setActiveNotes] = useState<StudentNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // New Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Note Modal (Catatan 24 Jam)
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [noteTextInput, setNoteTextInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [selectedFriendNote, setSelectedFriendNote] = useState<StudentNote | null>(null);

  // Active Chat State
  const [messageText, setMessageText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<DirectMessage | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    previewUrl: string;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [activeActionMessageId, setActiveActionMessageId] = useState<string | null>(null);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load conversations and notes
  const loadConversationsAndNotes = async () => {
    try {
      const [convList, notesList] = await Promise.all([
        api.getDMConversations().catch(() => []),
        api.getActiveNotes().catch(() => []),
      ]);
      setConversations(convList);
      // Filter out any note expired > 24 hours
      const now = Date.now();
      const validNotes = notesList.filter((n) => new Date(n.expiresAt).getTime() > now);
      setActiveNotes(validNotes);
    } catch (err) {
      console.error('Error loading DM conversations/notes:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversationsAndNotes();
    const interval = setInterval(loadConversationsAndNotes, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when an active conversation is selected
  const loadMessages = async (partnerId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await api.getDirectMessages(partnerId);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId);
      const interval = setInterval(() => {
        api.getDirectMessages(activePartnerId).then(setMessages).catch(() => {});
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activePartnerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find partner info from active conversation or users
  const activePartner = conversations.find((c) => c.partnerId === activePartnerId) || {
    partnerId: activePartnerId || '',
    partnerName: availableUsers.find((u) => u.id === activePartnerId)?.name || 'Pengguna',
    partnerUsername: availableUsers.find((u) => u.id === activePartnerId)?.username || '',
    partnerAvatar: availableUsers.find((u) => u.id === activePartnerId)?.avatarUrl,
    unreadCount: 0,
    updatedAt: '',
  };

  // Send text or media message
  const handleSendMessage = async () => {
    if (!activePartnerId || (!messageText.trim() && !selectedMedia)) return;

    try {
      let mediaUrl: string | undefined = undefined;
      let mediaType: 'text' | 'image' | 'video' = 'text';

      if (selectedMedia) {
        mediaType = selectedMedia.mediaType;
        mediaUrl = selectedMedia.previewUrl;
      }

      const payload: any = {
        recipientId: activePartnerId,
        recipientName: activePartner.partnerName,
        recipientUsername: activePartner.partnerUsername,
        recipientAvatar: activePartner.partnerAvatar,
        text: messageText.trim() || undefined,
        mediaType: mediaUrl ? mediaType : 'text',
        mediaUrl,
        replyToMessage: replyingToMessage
          ? {
              id: replyingToMessage.id,
              senderName: replyingToMessage.senderName,
              text: replyingToMessage.text,
              mediaType: replyingToMessage.mediaType,
            }
          : undefined,
      };

      setMessageText('');
      setSelectedMedia(null);
      setReplyingToMessage(null);

      const newMsg = await api.sendDirectMessage(payload);
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);

      // Refresh conversations list in background
      loadConversationsAndNotes();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan.');
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Izin mikrofon diperlukan untuk merekam Voice Note.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !activePartnerId) return;

    const duration = recordingSeconds;
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const newMsg = await api.sendDirectMessage({
            recipientId: activePartnerId,
            recipientName: activePartner.partnerName,
            recipientUsername: activePartner.partnerUsername,
            recipientAvatar: activePartner.partnerAvatar,
            mediaType: 'audio',
            mediaUrl: base64Audio,
            audioDuration: duration,
          });
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
          loadConversationsAndNotes();
        } catch (err) {
          alert('Gagal mengirim Voice Note.');
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
        }
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current.stop();
  };

  // Play audio Voice Note
  const togglePlayAudio = (id: string, url?: string) => {
    if (!url) return;

    if (playingAudioId === id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setPlayingAudioId(id);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch(() => {
      setPlayingAudioId(null);
    });
  };

  // Emoji Reactions
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const updated = await api.reactToDirectMessage(messageId, emoji);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      setActiveActionMessageId(null);
    } catch (_) {}
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Hapus pesan ini?')) return;
    try {
      await api.deleteDirectMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setActiveActionMessageId(null);
    } catch (_) {}
  };

  // Media Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      alert('Hanya mendukung format gambar atau video.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        file,
        previewUrl: reader.result as string,
        mediaType: isVideo ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Catatan (Notes) actions
  const myNote = activeNotes.find((n) => n.userId === user?.id);

  const handleSaveNote = async () => {
    if (!noteTextInput.trim()) return;
    setIsSubmittingNote(true);
    try {
      const note = await api.createOrUpdateNote(noteTextInput.trim());
      setActiveNotes((prev) => [note, ...prev.filter((n) => n.userId !== user?.id)]);
      setNoteTextInput('');
      setIsCreateNoteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteMyNote = async () => {
    if (!confirm('Hapus catatan Anda?')) return;
    try {
      await api.deleteNote();
      setActiveNotes((prev) => prev.filter((n) => n.userId !== user?.id));
    } catch (_) {}
  };

  // Calculate remaining hours for a note
  const getRemainingHours = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Kedaluwarsa';
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return `${hours}j tersisa`;
  };

  // Open New Chat Dialog
  const openNewChatDialog = async () => {
    setIsNewChatModalOpen(true);
    try {
      const users = await api.getPublicUsers();
      if (Array.isArray(users)) {
        setAvailableUsers(users.filter((u) => u.id !== user?.id && u.isActive !== false));
      }
    } catch (_) {}
  };

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.partnerName.toLowerCase().includes(q) || c.partnerUsername.toLowerCase().includes(q);
  });

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[85vh] bg-white sm:rounded-3xl shadow-sm border border-slate-200/80 flex flex-col overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* VIEW 1: CONVERSATION LIST (When no partner is selected)           */}
      {/* ----------------------------------------------------------------- */}
      {!activePartnerId ? (
        <div className="flex flex-col flex-1">
          {/* Header Pesan */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-2xl text-slate-600 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                    Pesan & DM
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Percakapan langsung civitas Perguruan Tamansiswa Batam
                  </p>
                </div>
              </div>

              {/* Tombol Pesan Baru */}
              <button
                onClick={openNewChatDialog}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Pesan Baru</span>
              </button>
            </div>

            {/* Pencarian Percakapan */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teman, nama, atau username..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Daftar Percakapan Pengguna */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {loadingConv ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat percakapan...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Percakapan</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Mulai kirim pesan teks, foto, video, atau Voice Note ke teman sekolah dan guru.
                </p>
                <button
                  onClick={openNewChatDialog}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Cari Kontak Teman
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  onClick={() => setActivePartnerId(conv.partnerId)}
                  className="p-3.5 sm:p-4 flex items-center gap-3.5 hover:bg-slate-50 cursor-pointer transition select-none"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={conv.partnerAvatar || '/assets/tamvesta_mascot.jpg'}
                      alt={conv.partnerName}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {conv.partnerName}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          conv.unreadCount > 0
                            ? 'font-bold text-slate-900'
                            : 'text-slate-500 font-normal'
                        }`}
                      >
                        {conv.lastMessage?.text ||
                          (conv.lastMessage?.mediaType === 'audio'
                            ? '🎤 Pesan Suara'
                            : conv.lastMessage?.mediaType === 'image'
                            ? '📷 Foto'
                            : conv.lastMessage?.mediaType === 'video'
                            ? '🎥 Video'
                            : 'Mulai percakapan...')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* BAGIAN CATATAN (NOTES) - TEPAT DI BAWAH DAFTAR PESAN          */}
          {/* Sesuai spesifikasi prompt urutan 3: Header -> Chat -> Catatan  */}
          {/* ------------------------------------------------------------- */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Catatan Siswa (Notes 24 Jam)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Hilang otomatis dalam 24 jam
              </span>
            </div>

            {/* Horizontal Notes Bar */}
            <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none">
              {/* Current User Note Circle */}
              <div className="flex flex-col items-center shrink-0 w-20 text-center">
                <div className="relative mb-1">
                  {/* Thought Bubble for My Note */}
                  {myNote && (
                    <div
                      onClick={() => {
                        setNoteTextInput(myNote.text);
                        setIsCreateNoteModalOpen(true);
                      }}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 rounded-2xl shadow-md border border-slate-200 text-[11px] font-bold text-slate-800 whitespace-nowrap max-w-[100px] truncate cursor-pointer hover:scale-105 transition"
                      title={myNote.text}
                    >
                      {myNote.text}
                    </div>
                  )}

                  <div
                    onClick={() => {
                      setNoteTextInput(myNote ? myNote.text : '');
                      setIsCreateNoteModalOpen(true);
                    }}
                    className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-500 cursor-pointer hover:scale-105 transition shadow-sm relative"
                  >
                    <img
                      src={user?.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                      alt="Profil Saya"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white text-xs font-black">
                      +
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                  Catatan Anda
                </span>
                <span className="text-[9px] text-slate-400">
                  {myNote ? getRemainingHours(myNote.expiresAt) : 'Bagikan ide'}
                </span>
              </div>

              {/* Friends' Notes List */}
              {activeNotes
                .filter((n) => n.userId !== user?.id)
                .map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedFriendNote(note)}
                    className="flex flex-col items-center shrink-0 w-20 text-center cursor-pointer group"
                  >
                    <div className="relative mb-1">
                      {/* Thought Bubble */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 rounded-2xl shadow-md border border-slate-200 text-[11px] font-bold text-slate-800 whitespace-nowrap max-w-[105px] truncate group-hover:scale-105 transition">
                        {note.text}
                      </div>

                      <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-sm">
                        <img
                          src={note.userAvatar || '/assets/tamvesta_mascot.jpg'}
                          alt={note.userName}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                      {note.userName}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {getRemainingHours(note.expiresAt)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* VIEW 2: ACTIVE CHAT ROOM VIEW                                     */
        /* ----------------------------------------------------------------- */
        <div className="flex flex-col h-full flex-1">
          {/* Header Percakapan */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  setActivePartnerId(null);
                  setReplyingToMessage(null);
                  setSelectedMedia(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-2xl text-slate-600 transition shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <img
                  src={activePartner.partnerAvatar || '/assets/tamvesta_mascot.jpg'}
                  alt={activePartner.partnerName}
                  className="w-10 h-10 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                  <span className="truncate">{activePartner.partnerName}</span>
                  {(activePartner.partnerUsername?.toLowerCase() === 'tamvesta' ||
                    availableUsers.find((u) => u.id === activePartnerId)?.isDeveloper ||
                    availableUsers.find((u) => u.id === activePartnerId)?.role === 'support') && (
                    <VerifiedBadge size="sm" isDeveloper={true} />
                  )}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold truncate">
                  @{activePartner.partnerUsername || 'pengguna'}
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Pesan Bubble */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
            {loadingMessages ? (
              <div className="text-center text-xs text-slate-400 py-10">Memuat pesan...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Smile className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Mulai kirim pesan ke {activePartner.partnerName}</p>
                <p className="text-[10px] text-slate-400 mt-1">Kirim teks, foto kegiatan, video, atau voice note</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}
                  >
                    {/* Story Reply Preview Card */}
                    {msg.replyToStory && (
                      <div className="mb-1 p-2 bg-slate-800 text-white rounded-2xl text-xs max-w-xs sm:max-w-sm flex items-center gap-2.5 shadow-md">
                        <img
                          src={msg.replyToStory.mediaUrl}
                          alt="Story Preview"
                          className="w-10 h-10 rounded-xl object-cover border border-white/20"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-amber-300 font-bold block">Membalas Cerita:</span>
                          <span className="text-[11px] truncate block text-slate-200">
                            {msg.replyToStory.caption || 'Cerita Tamvesta'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quoted Message */}
                    {msg.replyToMessage && (
                      <div className="mb-1 px-3 py-1.5 bg-slate-200/80 text-slate-700 rounded-xl text-[11px] max-w-xs border-l-4 border-emerald-600">
                        <span className="font-bold text-[10px] text-emerald-700 block">
                          {msg.replyToMessage.senderName}
                        </span>
                        <span className="truncate block">
                          {msg.replyToMessage.text || 'Media'}
                        </span>
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveActionMessageId(activeActionMessageId === msg.id ? null : msg.id);
                      }}
                      className={`relative px-4 py-2.5 rounded-3xl max-w-[82%] sm:max-w-md shadow-xs text-xs sm:text-sm select-text transition-all ${
                        isMine
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Photo Media */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="mb-1.5 rounded-2xl overflow-hidden cursor-pointer">
                          <img
                            src={msg.mediaUrl}
                            alt="Foto"
                            onClick={() => setLightboxMediaUrl(msg.mediaUrl || null)}
                            className="max-h-60 w-full object-cover hover:scale-102 transition"
                          />
                        </div>
                      )}

                      {/* Video Media */}
                      {msg.mediaType === 'video' && msg.mediaUrl && (
                        <div className="mb-1.5 rounded-2xl overflow-hidden bg-black">
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="max-h-60 w-full object-contain"
                          />
                        </div>
                      )}

                      {/* Voice Note Audio */}
                      {msg.mediaType === 'audio' && msg.mediaUrl && (
                        <div className="flex items-center gap-3 py-1">
                          <button
                            onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                              isMine
                                ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>

                          {/* Animated Waveform */}
                          <div className="flex items-center gap-0.5 h-6 flex-1">
                            {[40, 70, 90, 60, 100, 50, 80, 45, 95, 65, 30].map((h, i) => (
                              <div
                                key={i}
                                style={{ height: `${h}%` }}
                                className={`w-1 rounded-full transition-all ${
                                  isMine ? 'bg-emerald-200' : 'bg-emerald-400'
                                } ${playingAudioId === msg.id ? 'animate-pulse' : ''}`}
                              />
                            ))}
                          </div>

                          <span
                            className={`text-[10px] font-bold ${
                              isMine ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            {msg.audioDuration ? `${msg.audioDuration}s` : 'VN'}
                          </span>
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>
                      )}

                      {/* Timestamp & Read Status */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMine ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-amber-300" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Long-press / Action toggle trigger */}
                      <button
                        onClick={() =>
                          setActiveActionMessageId(
                            activeActionMessageId === msg.id ? null : msg.id
                          )
                        }
                        className={`absolute top-1 ${
                          isMine ? '-left-6' : '-right-6'
                        } opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Emoji Reaction Badges Pill (Small at bottom of bubble) */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex items-center gap-1 mt-1 px-1">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs border transition ${
                              userIds.includes(user?.id || '')
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            {userIds.length > 1 && <span>{userIds.length}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Popover Action Menu for Message (Reply, React, Copy, Delete) */}
                    {activeActionMessageId === msg.id && (
                      <div className="mt-1.5 p-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                        {/* Quick Reaction Emojis */}
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className="text-base hover:scale-125 transition active:scale-95 p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                          <button
                            onClick={() => {
                              setReplyingToMessage(msg);
                              setActiveActionMessageId(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 rounded-lg transition"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5 text-emerald-600" />
                            Balas
                          </button>
                          {msg.text && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text || '');
                                setActiveActionMessageId(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              Salin
                            </button>
                          )}
                          {isMine && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Replying Banner */}
          {replyingToMessage && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CornerUpLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-emerald-800">
                    Membalas {replyingToMessage.senderName}:
                  </span>{' '}
                  <span className="text-slate-600">
                    {replyingToMessage.text || 'Media'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReplyingToMessage(null)}
                className="p-1 hover:bg-emerald-100 rounded-full text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selected Media Preview Bar */}
          {selectedMedia && (
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedMedia.mediaType === 'image' ? (
                  <img
                    src={selectedMedia.previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Video className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">
                    {selectedMedia.file.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                    Siap dikirim
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom Chat Bar (Text, Media, Voice Note) */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100">
            {isRecording ? (
              /* Voice Note Recording Bar */
              <div className="flex items-center justify-between gap-3 p-2 bg-rose-50 border border-rose-200 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-black text-rose-700">Merekam Suara...</span>
                  <span className="text-xs font-bold text-slate-700">
                    {Math.floor(recordingSeconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelRecording}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={stopAndSendRecording}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim VN
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Input Bar */
              <div className="flex items-center gap-2">
                {/* File Attachment Input (hidden) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-2xl transition"
                  title="Lampirkan Foto atau Video"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />

                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition"
                  title="Kirim Pesan Suara (Voice Note)"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && !selectedMedia}
                  className={`p-2.5 rounded-2xl transition shadow-md ${
                    messageText.trim() || selectedMedia
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: BUAT / EDIT CATATAN (NOTES 24 JAM)                   */}
      {/* ------------------------------------------------------------- */}
      {isCreateNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">
                  {myNote ? 'Perbarui Catatan Anda' : 'Buat Catatan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Tuliskan status atau pikiran singkat Anda. Catatan ini akan hilang secara otomatis
              tepat 24 jam setelah diterbitkan.
            </p>

            <div className="relative mb-4">
              <input
                type="text"
                value={noteTextInput}
                maxLength={60}
                onChange={(e) => setNoteTextInput(e.target.value)}
                placeholder="Bagikan pemikiran singkat Anda... 😊"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <span className="absolute right-3 bottom-2 text-[10px] text-slate-400">
                {noteTextInput.length}/60
              </span>
            </div>

            {/* Quick Emojis for Note */}
            <div className="flex items-center justify-around gap-1 mb-5 py-2 bg-slate-50 rounded-2xl">
              {['✨', '📚', '⚽', '🎯', '☕', '🔥', '🎉'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setNoteTextInput((prev) => (prev + ' ' + em).trim())}
                  className="text-lg hover:scale-125 transition p-1"
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {myNote && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteMyNote();
                    setIsCreateNoteModalOpen(false);
                  }}
                  className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteTextInput.trim() || isSubmittingNote}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmittingNote ? 'Menyimpan...' : 'Bagikan Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: DETAIL CATATAN TEMAN                                 */}
      {/* ------------------------------------------------------------- */}
      {selectedFriendNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <img
              src={selectedFriendNote.userAvatar || '/assets/tamvesta_mascot.jpg'}
              alt={selectedFriendNote.userName}
              className="w-16 h-16 rounded-full mx-auto object-cover mb-3 border-2 border-emerald-500 shadow-md"
            />
            <h4 className="text-sm font-black text-slate-900">{selectedFriendNote.userName}</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              @{selectedFriendNote.userUsername} • {getRemainingHours(selectedFriendNote.expiresAt)}
            </p>

            <div className="p-4 bg-emerald-50 text-emerald-950 font-bold text-sm rounded-2xl mb-5 border border-emerald-200">
              "{selectedFriendNote.text}"
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFriendNote(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setActivePartnerId(selectedFriendNote.userId);
                  setSelectedFriendNote(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim DM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: PILIH KONTAK PESAN BARU                              */}
      {/* ------------------------------------------------------------- */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Mulai Pesan Baru
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Pencarian Kontak */}
            <div className="my-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan username atau nama..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Daftar Pengguna */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {(() => {
                const cleanQuery = userSearchQuery.trim().toLowerCase().replace(/^@+/, '');
                const filtered = availableUsers.filter((u) => {
                  if (!cleanQuery) return true;
                  const nameMatch = (u.name || '').toLowerCase().includes(cleanQuery);
                  const usernameMatch = (u.username || '').toLowerCase().replace(/^@+/, '').includes(cleanQuery);
                  return nameMatch || usernameMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 px-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Pengguna Tidak Ditemukan</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Tidak ada akun dengan username atau nama "{userSearchQuery}" di database TAMVESTA.
                      </p>
                    </div>
                  );
                }

                return filtered.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setActivePartnerId(contact.id);
                      setIsNewChatModalOpen(false);
                    }}
                    className="py-3 px-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer rounded-2xl transition"
                  >
                    <img
                      src={contact.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                      alt={contact.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                        <span className="truncate">{contact.name}</span>
                        {(contact.isVerified || contact.role === 'support' || contact.username?.toLowerCase() === 'tamvesta') && (
                          <VerifiedBadge
                            size="sm"
                            isDeveloper={contact.role === 'support' || contact.isDeveloper || contact.username?.toLowerCase() === 'tamvesta'}
                          />
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        @{contact.username} • {contact.role === 'support' ? 'Developer Resmi TAMVESTA' : (contact.kelas || contact.jabatan || 'Warga Sekolah')}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIGHTBOX ZOOM IMAGE                                           */}
      {/* ------------------------------------------------------------- */}
      {lightboxMediaUrl && (
        <div
          onClick={() => setLightboxMediaUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <img
            src={lightboxMediaUrl}
            alt="Perbesar"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
