import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Settings,
  Play,
  Share2,
  LogOut,
  Crown,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  HelpCircle,
  MessageCircle,
  Send,
} from 'lucide-react';
import type { GameRoom, GamePlayer, SpyCategory } from '../../types/game.ts';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';

interface GameLobbyViewProps {
  room: GameRoom;
  currentPlayer: GamePlayer;
  onToggleReady: () => Promise<void>;
  onUpdateSettings: (settings: any) => Promise<void>;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onSendChat: (text: string) => Promise<void>;
  onOpenRules: () => void;
}

export const GameLobbyView: React.FC<GameLobbyViewProps> = ({
  room,
  currentPlayer,
  onToggleReady,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom,
  onSendChat,
  onOpenRules,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isHost = currentPlayer.isHost;
  const isSpy = room.gameType === 'spy';
  const minPlayers = isSpy ? 3 : 4;
  const currentCount = room.players.filter((p) => !p.isSpectator).length;
  const allReady = room.players.filter((p) => !p.isHost && !p.isSpectator).every((p) => p.isReady);
  const canStart = isHost && currentCount >= minPlayers;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Main ${isSpy ? "Who's the Spy" : 'Mafia'} di TAMVESTA!`,
        text: `Ayo gabung ke room permainan TAMVESTA! Kode Room: ${room.code}`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    try {
      await onStartGame();
    } catch (err: any) {
      alert(err.message || 'Gagal memulai permainan.');
    } finally {
      setStarting(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    await onSendChat(text);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Room Code & Quick Controls */}
      <div className={`rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border ${
        isSpy
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-emerald-500/30'
          : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/30'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ROOM MULTIPLAYER • {isSpy ? "WHO'S THE SPY" : 'MAFIA OTOMATIS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Lobby Permainan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Bagikan kode room ke teman satu kelas untuk bermain bersama.
            </p>
          </div>

          {/* Big Room Code Box */}
          <div className="flex items-center gap-3">
            <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">KODE ROOM</span>
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-emerald-400">
                {room.code}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleCopyCode}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Salin Kode Room"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedCode ? 'Tersalin' : 'Salin'}</span>
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Bagikan Room"
              >
                <Share2 className="w-4 h-4 text-cyan-300" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Player List & Chat, Right = Host Settings & Start */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PLAYERS ROSTER (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">
                  Daftar Pemain ({room.players.length} Orang)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Minimal {minPlayers} pemain untuk memulai
              </span>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    player.id === currentPlayer.id
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0 relative">
                      <img
                        src={player.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=0284c7`}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                      {player.isHost && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Host Room">
                          <Crown className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {player.name}
                        </span>
                        {player.id === currentPlayer.id && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-800 font-black">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        @{player.username} {player.kelas ? `• ${player.kelas}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Ready Badge */}
                  <div>
                    {player.isHost ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" /> Host
                      </span>
                    ) : player.isReady ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                        Menunggu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Non-host Ready Toggle Button */}
            {!isHost && (
              <div className="pt-2">
                <button
                  onClick={onToggleReady}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                    currentPlayer.isReady
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentPlayer.isReady ? 'Batalkan Kesiapan' : 'Saya Siap Bermain!'}</span>
                </button>
              </div>
            )}
          </div>

          {/* In-Lobby Live Chat Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Ruang Obrolan Lobby</span>
            </h4>

            <div className="h-44 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              {room.chatMessages.length === 0 ? (
                <p className="text-slate-400 italic text-center py-8">
                  Belum ada pesan. Sapa teman-temanmu di sini!
                </p>
              ) : (
                room.chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-xl text-xs ${
                      msg.isSystem
                        ? 'bg-amber-50/80 text-amber-900 border border-amber-200 font-medium'
                        : msg.senderId === currentPlayer.userId
                        ? 'bg-emerald-100 text-emerald-900 ml-6 text-right'
                        : 'bg-white text-slate-800 mr-6 border border-slate-200'
                    }`}
                  >
                    {!msg.isSystem && (
                      <span className="block text-[10px] font-bold text-slate-500">
                        {msg.senderName} (@{msg.senderUsername})
                      </span>
                    )}
                    <span>{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan untuk teman di room..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: HOST SETTINGS & CONTROLS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">
                  Pengaturan Permainan {isHost ? '(Host)' : ''}
                </h3>
              </div>
              <button
                onClick={onOpenRules}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Cara Main
              </button>
            </div>

            {/* WHO'S THE SPY SETTINGS */}
            {isSpy && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Kata Rahasia
                  </label>
                  <select
                    disabled={!isHost}
                    value={room.spySettings.category}
                    onChange={(e) =>
                      onUpdateSettings({
                        spySettings: { ...room.spySettings, category: e.target.value as SpyCategory },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-70"
                  >
                    <option value="campuran">🎲 Campuran Semua Kategori</option>
                    <option value="sekolah">🏫 Sekolah & Belajar</option>
                    <option value="makanan">🍜 Kuliner & Makanan</option>
                    <option value="hewan">🦁 Hewan & Satwa</option>
                    <option value="tempat">🏖️ Tempat & Pariwisata</option>
                    <option value="benda">🎒 Benda & Alat Harian</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Imposter</label>
                    <select
                      disabled={!isHost}
                      value={room.spySettings.spyCount}
                      onChange={(e) =>
                        onUpdateSettings({
                          spySettings: { ...room.spySettings, spyCount: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-70"
                    >
                      <option value={1}>1 Imposter</option>
                      <option value={2}>2 Imposter (Min. 5 Pemain)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Durasi Diskusi</label>
                    <select
                      disabled={!isHost}
                      value={room.spySettings.discussionDuration}
                      onChange={(e) =>
                        onUpdateSettings({
                          spySettings: { ...room.spySettings, discussionDuration: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-70"
                    >
                      <option value={45}>45 Detik</option>
                      <option value={60}>60 Detik</option>
                      <option value={90}>90 Detik</option>
                      <option value={120}>2 Menit</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-slate-800 text-xs">Opsi Tebak Kata Imposter</span>
                    <span className="text-[11px] text-slate-500">Imposter dapat membalikkan kemenangan jika menebak kata biasa</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isHost}
                    checked={room.spySettings.allowSpyGuess}
                    onChange={(e) =>
                      onUpdateSettings({
                        spySettings: { ...room.spySettings, allowSpyGuess: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              </div>
            )}

            {/* MAFIA SETTINGS */}
            {!isSpy && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-rose-700 uppercase">Mafia</span>
                    <select
                      disabled={!isHost}
                      value={room.mafiaSettings.mafiaCount}
                      onChange={(e) =>
                        onUpdateSettings({
                          mafiaSettings: { ...room.mafiaSettings, mafiaCount: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-full bg-white text-rose-900 font-black text-xs p-1 rounded-lg border border-rose-300"
                    >
                      <option value={1}>1 Mafia</option>
                      <option value={2}>2 Mafia</option>
                      <option value={3}>3 Mafia</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-teal-700 uppercase">Dokter</span>
                    <select
                      disabled={!isHost}
                      value={room.mafiaSettings.doctorCount}
                      onChange={(e) =>
                        onUpdateSettings({
                          mafiaSettings: { ...room.mafiaSettings, doctorCount: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-full bg-white text-teal-900 font-black text-xs p-1 rounded-lg border border-teal-300"
                    >
                      <option value={1}>Ada (1)</option>
                      <option value={0}>Tidak Ada</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-blue-700 uppercase">Detektif</span>
                    <select
                      disabled={!isHost}
                      value={room.mafiaSettings.detectiveCount}
                      onChange={(e) =>
                        onUpdateSettings({
                          mafiaSettings: { ...room.mafiaSettings, detectiveCount: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-full bg-white text-blue-900 font-black text-xs p-1 rounded-lg border border-blue-300"
                    >
                      <option value={1}>Ada (1)</option>
                      <option value={0}>Tidak Ada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Durasi Malam</label>
                    <select
                      disabled={!isHost}
                      value={room.mafiaSettings.nightDuration}
                      onChange={(e) =>
                        onUpdateSettings({
                          mafiaSettings: { ...room.mafiaSettings, nightDuration: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-70"
                    >
                      <option value={25}>25 Detik</option>
                      <option value={30}>30 Detik</option>
                      <option value={45}>45 Detik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Durasi Diskusi Siang</label>
                    <select
                      disabled={!isHost}
                      value={room.mafiaSettings.discussionDuration}
                      onChange={(e) =>
                        onUpdateSettings({
                          mafiaSettings: { ...room.mafiaSettings, discussionDuration: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-70"
                    >
                      <option value={45}>45 Detik</option>
                      <option value={60}>60 Detik</option>
                      <option value={90}>90 Detik</option>
                      <option value={120}>2 Menit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Start Game Button (Host Only) */}
            {isHost ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleStart}
                  disabled={!canStart || starting}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{starting ? 'Memulai Permainan...' : 'Mulai Permainan Sekarang'}</span>
                </button>
                {!canStart && (
                  <p className="text-[11px] text-amber-700 text-center font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
                    Menunggu minimal {minPlayers} pemain bergabung ke room.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                Menunggu Host ({room.hostUsername}) memulai permainan.
              </div>
            )}

            {/* Leave Room Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onLeaveRoom}
                className="w-full py-2.5 px-4 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Tinggalkan Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
