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
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { DirectMessage, DMConversation, StudentNote, User } from '../../types/index.ts';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';

interface DirectMessagesPageProps {
  onBack?: () => void;
  initialPartnerId?: string;
}

type ExtendedDirectMessage = DirectMessage & {
  _status?: 'sending' | 'sent' | 'error';
};

const QUICK_EMOJIS = ['❤️', '😂', '😍', '😢', '😮', '👍', '🔥'];

export const DirectMessagesPage: React.FC<DirectMessagesPageProps> = ({
  onBack,
  initialPartnerId,
}) => {
  const { user } = useAuth();

  // Navigation & State
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [messages, setMessages] = useState<ExtendedDirectMessage[]>([]);
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
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      setTimeout(() => scrollToBottom('auto'), 80);
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
        api.getDirectMessages(activePartnerId).then((serverMsgs) => {
          setMessages((prev) => {
            // Keep pending optimistic messages that are still sending
            const pending = prev.filter((m) => m._status === 'sending');
            const merged = [...serverMsgs];
            for (const p of pending) {
              if (!merged.some((m) => m.id === p.id || (m.createdAt === p.createdAt && m.text === p.text))) {
                merged.push(p);
              }
            }
            return merged;
          });
        }).catch(() => {});
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activePartnerId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Auto-scroll when keyboard opens on Android (viewport resize)
  useEffect(() => {
    const handleViewportChange = () => {
      scrollToBottom('auto');
    };
    window.addEventListener('resize', handleViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  // Find partner info from active conversation or users
  const activePartner = conversations.find((c) => c.partnerId === activePartnerId) || {
    partnerId: activePartnerId || '',
    partnerName: availableUsers.find((u) => u.id === activePartnerId)?.name || 'Pengguna',
    partnerUsername: availableUsers.find((u) => u.id === activePartnerId)?.username || '',
    partnerAvatar: availableUsers.find((u) => u.id === activePartnerId)?.avatarUrl,
    unreadCount: 0,
    updatedAt: '',
  };

  // Send text or media message with immediate optimistic UI update
  const handleSendMessage = async (retryMsg?: ExtendedDirectMessage) => {
    const textToSend = retryMsg ? (retryMsg.text || '') : messageText.trim();
    const mediaToSend = retryMsg
      ? (retryMsg.mediaUrl ? { previewUrl: retryMsg.mediaUrl, mediaType: retryMsg.mediaType as any } : null)
      : selectedMedia;
    const replyTarget = retryMsg ? retryMsg.replyToMessage : replyingToMessage;

    if (!activePartnerId || (!textToSend && !mediaToSend)) return;

    const tempId = retryMsg ? retryMsg.id : `dm_temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Create optimistic message object for immediate rendering
    const optimisticMessage: ExtendedDirectMessage = {
      id: tempId,
      senderId: user?.id || 'temp_user',
      senderName: user?.name || 'Saya',
      senderUsername: user?.username || '',
      senderAvatar: user?.avatarUrl,
      recipientId: activePartnerId,
      recipientName: activePartner.partnerName,
      recipientUsername: activePartner.partnerUsername,
      recipientAvatar: activePartner.partnerAvatar,
      text: textToSend,
      mediaType: mediaToSend ? mediaToSend.mediaType : 'text',
      mediaUrl: mediaToSend ? mediaToSend.previewUrl : undefined,
      replyToMessage: replyTarget ? {
        id: replyTarget.id,
        senderName: replyTarget.senderName,
        text: replyTarget.text,
        mediaType: replyTarget.mediaType,
      } : undefined,
      replyToStory: retryMsg ? retryMsg.replyToStory : undefined,
      reactions: {},
      isRead: false,
      createdAt: retryMsg ? retryMsg.createdAt : new Date().toISOString(),
      _status: 'sending',
    };

    if (!retryMsg) {
      // Clear input fields immediately
      setMessageText('');
      setSelectedMedia(null);
      setReplyingToMessage(null);
      setMessages((prev) => [...prev, optimisticMessage]);
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: 'sending' } : m)));
    }

    setTimeout(() => scrollToBottom('smooth'), 40);

    try {
      const payload: any = {
        recipientId: activePartnerId,
        recipientName: activePartner.partnerName,
        recipientUsername: activePartner.partnerUsername,
        recipientAvatar: activePartner.partnerAvatar,
        senderId: user?.id,
        senderName: user?.name,
        senderUsername: user?.username,
        senderAvatar: user?.avatarUrl,
        text: textToSend || undefined,
        mediaType: mediaToSend ? mediaToSend.mediaType : 'text',
        mediaUrl: mediaToSend ? mediaToSend.previewUrl : undefined,
        replyToMessage: replyTarget ? {
          id: replyTarget.id,
          senderName: replyTarget.senderName,
          text: replyTarget.text,
          mediaType: replyTarget.mediaType,
        } : undefined,
        replyToStory: retryMsg ? retryMsg.replyToStory : undefined,
      };

      const confirmed = await api.sendDirectMessage(payload);

      // Replace optimistic message with confirmed server message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...confirmed, _status: 'sent' } : m))
      );
      setTimeout(() => scrollToBottom('smooth'), 40);
      loadConversationsAndNotes();
    } catch (err: any) {
      console.error('Gagal mengirim pesan DM:', err);
      // Mark as error so user can retry with one tap
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, _status: 'error' } : m))
      );
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
        const tempId = `dm_vn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const optimisticVN: ExtendedDirectMessage = {
          id: tempId,
          senderId: user?.id || 'temp_user',
          senderName: user?.name || 'Saya',
          senderUsername: user?.username || '',
          senderAvatar: user?.avatarUrl,
          recipientId: activePartnerId,
          recipientName: activePartner.partnerName,
          recipientUsername: activePartner.partnerUsername,
          recipientAvatar: activePartner.partnerAvatar,
          mediaType: 'audio',
          mediaUrl: base64Audio,
          audioDuration: duration,
          reactions: {},
          isRead: false,
          createdAt: new Date().toISOString(),
          _status: 'sending',
        };

        setMessages((prev) => [...prev, optimisticVN]);
        setTimeout(() => scrollToBottom('smooth'), 40);

        try {
          const newMsg = await api.sendDirectMessage({
            recipientId: activePartnerId,
            recipientName: activePartner.partnerName,
            recipientUsername: activePartner.partnerUsername,
            recipientAvatar: activePartner.partnerAvatar,
            senderId: user?.id,
            senderName: user?.name,
            senderUsername: user?.username,
            senderAvatar: user?.avatarUrl,
            mediaType: 'audio',
            mediaUrl: base64Audio,
            audioDuration: duration,
          });
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...newMsg, _status: 'sent' } : m))
          );
          setTimeout(() => scrollToBottom('smooth'), 40);
          loadConversationsAndNotes();
        } catch (err) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, _status: 'error' } : m))
          );
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
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...updated, _status: 'sent' } : m)));
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
    <div className="w-full max-w-4xl mx-auto h-[100dvh] sm:h-[88vh] sm:my-3 sm:rounded-3xl shadow-sm border border-slate-200/80 bg-white flex flex-col overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* VIEW 1: CONVERSATION LIST (When no partner is selected)           */}
      {/* ----------------------------------------------------------------- */}
      {!activePartnerId ? (
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Header Pesan */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 bg-white shrink-0 z-20">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 -ml-1 hover:bg-slate-100 rounded-2xl text-slate-600 transition"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    Pesan & DM
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Percakapan civitas Perguruan Tamansiswa Batam
                  </p>
                </div>
              </div>

              {/* Tombol Pesan Baru */}
              <button
                onClick={openNewChatDialog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Pesan Baru</span>
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
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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
                  className="p-3 sm:p-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition select-none"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={conv.partnerAvatar || '/assets/tamvesta_mascot.jpg'}
                      alt={conv.partnerName}
                      className="w-11 h-11 rounded-2xl object-cover bg-slate-100 border border-slate-200"
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
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {conv.partnerName}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
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
          {/* ------------------------------------------------------------- */}
          <div className="p-3.5 bg-slate-50/90 border-t border-slate-200/80 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Catatan Siswa (Notes 24 Jam)
                </h3>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">
                Hilang otomatis 24 jam
              </span>
            </div>

            {/* Horizontal Notes Bar */}
            <div className="flex items-start gap-3 overflow-x-auto pb-1 scrollbar-none">
              {/* Current User Note Circle */}
              <div className="flex flex-col items-center shrink-0 w-16 text-center">
                <div className="relative mb-1">
                  {myNote && (
                    <div
                      onClick={() => {
                        setNoteTextInput(myNote.text);
                        setIsCreateNoteModalOpen(true);
                      }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-xl shadow-xs border border-slate-200 text-[10px] font-bold text-slate-800 whitespace-nowrap max-w-[90px] truncate cursor-pointer hover:scale-105 transition"
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
                    className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-500 cursor-pointer hover:scale-105 transition shadow-xs relative"
                  >
                    <img
                      src={user?.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                      alt="Profil Saya"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white text-[9px] font-black">
                      +
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-800 truncate w-full">
                  Catatan Anda
                </span>
                <span className="text-[8px] text-slate-400">
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
                    className="flex flex-col items-center shrink-0 w-16 text-center cursor-pointer group"
                  >
                    <div className="relative mb-1">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-xl shadow-xs border border-slate-200 text-[10px] font-bold text-slate-800 whitespace-nowrap max-w-[95px] truncate group-hover:scale-105 transition">
                        {note.text}
                      </div>

                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xs">
                        <img
                          src={note.userAvatar || '/assets/tamvesta_mascot.jpg'}
                          alt={note.userName}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full">
                      {note.userName}
                    </span>
                    <span className="text-[8px] text-slate-400">
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
        <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
          {/* Header Percakapan */}
          <div className="h-14 sm:h-16 px-3 sm:px-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  setActivePartnerId(null);
                  setReplyingToMessage(null);
                  setSelectedMedia(null);
                }}
                className="p-1.5 -ml-1 hover:bg-slate-100 rounded-full text-slate-600 transition shrink-0"
                title="Kembali ke daftar pesan"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <img
                  src={activePartner.partnerAvatar || '/assets/tamvesta_mascot.jpg'}
                  alt={activePartner.partnerName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-slate-100 border border-slate-200 shadow-2xs"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1">
                  <span className="truncate">{activePartner.partnerName}</span>
                  {(activePartner.partnerUsername?.toLowerCase() === 'tamvesta' ||
                    availableUsers.find((u) => u.id === activePartnerId)?.isDeveloper ||
                    availableUsers.find((u) => u.id === activePartnerId)?.role === 'support') && (
                    <VerifiedBadge size="sm" isDeveloper={true} />
                  )}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold truncate">
                  @{activePartner.partnerUsername || 'pengguna'} • Civitas Tamansiswa
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Pesan Bubble */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 bg-slate-100/70">
            {loadingMessages ? (
              <div className="text-center text-xs text-slate-400 py-10">Memuat pesan...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                  <Smile className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Mulai kirim pesan ke {activePartner.partnerName}</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Kirim teks, foto dokumen/kegiatan, video, atau rekaman pesan suara.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;

                const currentDate = new Date(msg.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const prevDate =
                  index > 0
                    ? new Date(messages[index - 1].createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null;
                const showDateHeader = index === 0 || currentDate !== prevDate;

                const formattedTime = new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={msg.id} className="w-full">
                    {/* Date Separator Pill */}
                    {showDateHeader && (
                      <div className="flex justify-center my-2.5">
                        <span className="px-3 py-0.5 bg-white/80 backdrop-blur-xs text-slate-600 rounded-full text-[10px] font-bold shadow-2xs border border-slate-200/60">
                          {currentDate}
                        </span>
                      </div>
                    )}

                    {/* Chat Bubble Row */}
                    <div className={`flex items-end gap-1.5 w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {/* Incoming Partner Avatar (sebelah kiri) */}
                      {!isMine && (
                        <img
                          src={activePartner.partnerAvatar || '/assets/tamvesta_mascot.jpg'}
                          alt={activePartner.partnerName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-slate-200 shadow-2xs"
                        />
                      )}

                      {/* Outgoing Action Trigger */}
                      {isMine && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionMessageId(
                              activeActionMessageId === msg.id ? null : msg.id
                            )
                          }
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition shrink-0 opacity-70 hover:opacity-100"
                          title="Opsi pesan"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Bubble Container */}
                      <div className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {/* Story Reply Preview Card */}
                        {msg.replyToStory && (
                          <div
                            className={`mb-1 p-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs border ${
                              isMine
                                ? 'bg-emerald-800 text-white border-emerald-700'
                                : 'bg-slate-800 text-white border-slate-700'
                            }`}
                          >
                            <img
                              src={msg.replyToStory.mediaUrl}
                              alt="Story"
                              className="w-9 h-9 rounded-lg object-cover border border-white/20 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-amber-300 font-bold block">
                                Membalas Cerita:
                              </span>
                              <span className="text-[11px] truncate block text-slate-200">
                                {msg.replyToStory.caption || 'Cerita Tamvesta'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Quoted Message Preview Card */}
                        {msg.replyToMessage && (
                          <div
                            className={`mb-1 px-2.5 py-1.5 rounded-lg text-[11px] border-l-4 shadow-2xs max-w-full ${
                              isMine
                                ? 'bg-emerald-700/80 text-white border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-emerald-600'
                            }`}
                          >
                            <span
                              className={`font-bold text-[10px] block ${
                                isMine ? 'text-emerald-200' : 'text-emerald-700'
                              }`}
                            >
                              {msg.replyToMessage.senderName}
                            </span>
                            <span className="truncate block opacity-90 text-[10px]">
                              {msg.replyToMessage.text || 'Media'}
                            </span>
                          </div>
                        )}

                        {/* The Actual Bubble */}
                        <div
                          className={`relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-xs text-xs sm:text-[13px] leading-relaxed break-words select-text ${
                            isMine
                              ? 'bg-emerald-600 text-white rounded-tr-xs shadow-emerald-700/10'
                              : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs shadow-slate-200/40'
                          }`}
                        >
                          {/* Photo Media */}
                          {msg.mediaType === 'image' && msg.mediaUrl && (
                            <div className="mb-1.5 rounded-xl overflow-hidden cursor-pointer border border-black/5 bg-black/5 max-w-sm">
                              <img
                                src={msg.mediaUrl}
                                alt="Foto"
                                onClick={() => setLightboxMediaUrl(msg.mediaUrl || null)}
                                className="max-h-64 w-full object-cover hover:opacity-95 transition"
                              />
                            </div>
                          )}

                          {/* Video Media */}
                          {msg.mediaType === 'video' && msg.mediaUrl && (
                            <div className="mb-1.5 rounded-xl overflow-hidden bg-black border border-black/10 max-w-sm">
                              <video
                                src={msg.mediaUrl}
                                controls
                                className="max-h-64 w-full object-contain"
                              />
                            </div>
                          )}

                          {/* Voice Note Audio */}
                          {msg.mediaType === 'audio' && msg.mediaUrl && (
                            <div className="flex items-center gap-2 py-0.5 min-w-[190px] sm:min-w-[220px]">
                              <button
                                type="button"
                                onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95 ${
                                  isMine
                                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 ml-0.5" />
                                )}
                              </button>

                              {/* Animated Waveform */}
                              <div className="flex items-center gap-0.5 h-5 flex-1 px-1">
                                {[40, 75, 95, 60, 100, 50, 85, 45, 90, 65, 35].map((h, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className={`w-1 rounded-full transition-all ${
                                      isMine ? 'bg-emerald-200/80' : 'bg-emerald-500/80'
                                    } ${playingAudioId === msg.id ? 'animate-pulse' : ''}`}
                                  />
                                ))}
                              </div>

                              <span
                                className={`text-[10px] font-bold tabular-nums shrink-0 ${
                                  isMine ? 'text-emerald-100' : 'text-slate-500'
                                }`}
                              >
                                {msg.audioDuration ? `${msg.audioDuration}s` : 'VN'}
                              </span>
                            </div>
                          )}

                          {/* Text Message */}
                          {msg.text && (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          )}

                          {/* Timestamp & Delivery Status */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] select-none ${
                              isMine ? 'text-emerald-100/90' : 'text-slate-400'
                            }`}
                          >
                            <span>{formattedTime}</span>
                            {isMine && (
                              <span>
                                {msg._status === 'sending' ? (
                                  <Clock className="w-3 h-3 text-emerald-200 animate-pulse" title="Mengirim..." />
                                ) : msg._status === 'error' ? (
                                  <button
                                    onClick={() => handleSendMessage(msg)}
                                    className="inline-flex items-center gap-0.5 text-rose-200 hover:text-white"
                                    title="Gagal dikirim. Ketuk untuk kirim ulang."
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-300" />
                                    <span className="text-[8px] underline">Kirim ulang</span>
                                  </button>
                                ) : msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-amber-300" title="Dibaca" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 opacity-90" title="Terkirim" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reaction Badges Pill */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex items-center gap-1 mt-1 px-1">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(msg.id, emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs border transition ${
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
                      </div>

                      {/* Incoming Action Trigger */}
                      {!isMine && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionMessageId(
                              activeActionMessageId === msg.id ? null : msg.id
                            )
                          }
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition shrink-0 opacity-70 hover:opacity-100"
                          title="Opsi pesan"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Action Menu Popover (Reply, React, Copy, Delete) */}
                    {activeActionMessageId === msg.id && (
                      <div className={`mt-1.5 p-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 max-w-xs ${isMine ? 'ml-auto' : 'mr-auto'}`}>
                        {/* Quick Reaction Emojis */}
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReact(msg.id, emoji)}
                              className="text-base hover:scale-125 transition active:scale-95 p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                          <button
                            type="button"
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
                              type="button"
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
                              type="button"
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
            <div className="px-3 py-1.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <CornerUpLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-emerald-800">
                    Membalas {replyingToMessage.senderName}:
                  </span>{' '}
                  <span className="text-slate-600 text-[11px]">
                    {replyingToMessage.text || 'Media'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="p-1 hover:bg-emerald-100 rounded-full text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selected Media Preview Bar */}
          {selectedMedia && (
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {selectedMedia.mediaType === 'image' ? (
                  <img
                    src={selectedMedia.previewUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <Video className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[180px]">
                    {selectedMedia.file.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                    Siap dikirim
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* KOLOM PENULISAN PESAN (MEDIUM SIZE, ERGONOMIC, STICKY BOTTOM) */}
          {/* ------------------------------------------------------------- */}
          <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200/80 shrink-0 sticky bottom-0 z-20">
            {isRecording ? (
              /* Voice Note Recording Bar */
              <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-200 rounded-full animate-pulse">
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-bold text-rose-700">Merekam Suara</span>
                  <span className="text-xs font-bold text-slate-700">
                    {Math.floor(recordingSeconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim
                  </button>
                </div>
              </div>
            ) : (
              /* Form Penulisan Pesan - Medium, Responsive & Keyboard Friendly */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5 sm:gap-2 w-full"
              >
                {/* Hidden File Picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />

                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 sm:w-10 sm:h-10 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full flex items-center justify-center shrink-0 transition"
                  title="Lampirkan Foto atau Video"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Medium-sized Input Field */}
                <input
                  ref={inputRef}
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
                  className="flex-1 h-10 sm:h-11 px-4 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-full border border-slate-200/80 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                />

                {/* Voice Note Button (when empty text & no media) */}
                {!messageText.trim() && !selectedMedia ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-9 h-9 sm:w-10 sm:h-10 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full flex items-center justify-center shrink-0 transition"
                    title="Kirim Pesan Suara (Voice Note)"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                ) : null}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!messageText.trim() && !selectedMedia}
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md ${
                    messageText.trim() || selectedMedia
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/25 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none opacity-50'
                  }`}
                  title="Kirim Pesan"
                >
                  <Send className="w-4.5 h-4.5 ml-0.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: BUAT / EDIT CATATAN (NOTES 24 JAM)                   */}
      {/* ------------------------------------------------------------- */}
      {isCreateNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {myNote ? 'Perbarui Catatan Anda' : 'Buat Catatan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Tuliskan status atau pikiran singkat Anda. Catatan ini akan hilang secara otomatis
              tepat 24 jam setelah diterbitkan.
            </p>

            <div className="relative mb-3">
              <input
                type="text"
                value={noteTextInput}
                maxLength={60}
                onChange={(e) => setNoteTextInput(e.target.value)}
                placeholder="Bagikan pemikiran singkat Anda... 😊"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <span className="absolute right-3 bottom-2 text-[10px] text-slate-400">
                {noteTextInput.length}/60
              </span>
            </div>

            {/* Quick Emojis for Note */}
            <div className="flex items-center justify-around gap-1 mb-4 py-1.5 bg-slate-50 rounded-2xl">
              {['✨', '📚', '⚽', '🎯', '☕', '🔥', '🎉'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setNoteTextInput((prev) => (prev + ' ' + em).trim())}
                  className="text-base hover:scale-125 transition p-1"
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
                  className="px-3.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteTextInput.trim() || isSubmittingNote}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
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
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl text-center">
            <img
              src={selectedFriendNote.userAvatar || '/assets/tamvesta_mascot.jpg'}
              alt={selectedFriendNote.userName}
              className="w-14 h-14 rounded-full mx-auto object-cover mb-2.5 border-2 border-emerald-500 shadow-md"
            />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">{selectedFriendNote.userName}</h4>
            <p className="text-[10px] text-slate-400 mb-3">
              @{selectedFriendNote.userUsername} • {getRemainingHours(selectedFriendNote.expiresAt)}
            </p>

            <div className="p-3 bg-emerald-50 text-emerald-950 font-bold text-xs sm:text-sm rounded-2xl mb-4 border border-emerald-200">
              "{selectedFriendNote.text}"
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFriendNote(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePartnerId(selectedFriendNote.userId);
                  setSelectedFriendNote(null);
                }}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
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
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Mulai Pesan Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Pencarian Kontak */}
            <div className="my-2.5 relative">
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
                    <div className="py-10 px-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Pengguna Tidak Ditemukan</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Tidak ada akun dengan username atau nama "{userSearchQuery}".
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
                    className="py-2.5 px-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer rounded-2xl transition"
                  >
                    <img
                      src={contact.avatarUrl || '/assets/tamvesta_mascot.jpg'}
                      alt={contact.name}
                      className="w-9 h-9 rounded-xl object-cover bg-slate-100"
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
