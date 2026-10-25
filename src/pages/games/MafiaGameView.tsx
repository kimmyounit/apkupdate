import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Clock,
  Moon,
  Sun,
  Shield,
  Search,
  Crosshair,
  Heart,
  Skull,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Send,
  MessageCircle,
  HelpCircle,
  Award,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GameRoom, GamePlayer } from '../../types/game.ts';

interface MafiaGameViewProps {
  room: GameRoom;
  currentPlayer: GamePlayer;
  onAdvancePhase: (targetPhase: string) => Promise<void>;
  onCastVote: (targetPlayerId: string) => Promise<void>;
  onSubmitNightAction: (
    actionType: 'mafia_kill' | 'doctor_heal' | 'detective_inspect',
    targetPlayerId: string
  ) => Promise<void>;
  onSendChat: (text: string) => Promise<void>;
  onRestartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onOpenRules: () => void;
}

export const MafiaGameView: React.FC<MafiaGameViewProps> = ({
  room,
  currentPlayer,
  onAdvancePhase,
  onCastVote,
  onSubmitNightAction,
  onSendChat,
  onRestartGame,
  onLeaveRoom,
  onOpenRules,
}) => {
  const [showRoleSecret, setShowRoleSecret] = useState(false);
  const [selectedNightTarget, setSelectedNightTarget] = useState<string | null>(null);
  const [hasSubmittedNightAction, setHasSubmittedNightAction] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const isHost = currentPlayer.isHost;
  const isAlive = currentPlayer.isAlive;
  const role = currentPlayer.role || 'villager';
  const isNight = room.phase === 'night';
  const alivePlayers = room.players.filter((p) => p.isAlive && !p.isSpectator);

  // Timer countdown
  useEffect(() => {
    if (!room.phaseEndTime) return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((room.phaseEndTime! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room.phaseEndTime, room.phase]);

  // Reset local state on phase changes
  useEffect(() => {
    if (room.phase === 'night') {
      setSelectedNightTarget(null);
      setHasSubmittedNightAction(false);
    } else if (room.phase === 'voting') {
      setSelectedVoteTarget(null);
      setHasVoted(false);
    }
  }, [room.phase, room.round]);

  // Trigger confetti on game end
  useEffect(() => {
    if (room.winner) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [room.winner]);

  // Night Action Submission
  const handleNightActionSubmit = async () => {
    if (!selectedNightTarget || hasSubmittedNightAction) return;

    let actionType: 'mafia_kill' | 'doctor_heal' | 'detective_inspect' = 'mafia_kill';
    if (role === 'doctor') actionType = 'doctor_heal';
    if (role === 'detective') actionType = 'detective_inspect';

    try {
      await onSubmitNightAction(actionType, selectedNightTarget);
      setHasSubmittedNightAction(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim aksi malam.');
    }
  };

  // Day Voting Submission
  const handleVoteSubmit = async () => {
    if (!selectedVoteTarget || hasVoted) return;
    try {
      await onCastVote(selectedVoteTarget);
      setHasVoted(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim voting.');
    }
  };

  // Chat message send
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await onSendChat(chatInput.trim());
      setChatInput('');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan chat.');
    }
  };

  const getRoleDetails = () => {
    switch (role) {
      case 'mafia':
        return {
          title: 'MAFIA',
          color: 'text-red-500',
          bg: 'bg-red-500/10 border-red-500/30',
          icon: <Flame className="w-8 h-8 text-red-500 animate-pulse" />,
          desc: 'Tugas: Bekerja sama secara rahasia untuk membunuh warga kota setiap malam dan jangan sampai ketahuan saat voting siang.',
          team: 'Tim Mafia (Jahat)',
        };
      case 'doctor':
        return {
          title: 'DOKTER',
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          icon: <Heart className="w-8 h-8 text-emerald-500 animate-bounce" />,
          desc: 'Tugas: Memilih 1 warga kota setiap malam untuk dilindungi dan disembuhkan dari serangan Mafia.',
          team: 'Tim Warga Kota (Baik)',
        };
      case 'detective':
        return {
          title: 'DETEKTIF',
          color: 'text-sky-500',
          bg: 'bg-sky-500/10 border-sky-500/30',
          icon: <Search className="w-8 h-8 text-sky-500" />,
          desc: 'Tugas: Memeriksa 1 pemain setiap malam untuk mengetahui apakah pemain tersebut adalah anggota Mafia.',
          team: 'Tim Warga Kota (Baik)',
        };
      case 'villager':
      default:
        return {
          title: 'WARGA KOTA',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10 border-amber-500/30',
          icon: <Shield className="w-8 h-8 text-amber-500" />,
          desc: 'Tugas: Berdiskusi di siang hari, amati gerak-gerik pemain lain, dan vote untuk mengeliminasi seluruh Mafia.',
          team: 'Tim Warga Kota (Baik)',
        };
    }
  };

  const roleInfo = getRoleDetails();

  // Find detective investigation result if detective
  const detectiveResult = role === 'detective' ? room.nightActions?.detectiveResult : null;

  return (
    <div
      className={`min-h-screen text-slate-100 p-3 sm:p-6 pb-28 transition-colors duration-700 ${
        isNight ? 'bg-slate-950' : 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950'
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shadow-inner ${
                isNight
                  ? 'bg-indigo-950/80 border-indigo-700 text-indigo-400'
                  : 'bg-amber-950/60 border-amber-600 text-amber-400'
              }`}
            >
              {isNight ? <Moon className="w-6 h-6 animate-pulse" /> : <Sun className="w-6 h-6 animate-spin-slow" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-wide">MAFIA</span>
                <span className="text-xs bg-red-950/80 border border-red-700/60 text-red-300 px-2 py-0.5 rounded-full font-bold">
                  Putaran {room.round}
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {room.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Moderator Otomatis TAMVESTA • {alivePlayers.length} Pemain Hidup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRules}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all"
              title="Cara Bermain"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-xl transition-all relative ${
                showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
              title="Chat Room"
            >
              <MessageCircle className="w-5 h-5" />
              {room.chatMessages?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
            <button
              onClick={onLeaveRoom}
              className="p-2 text-red-400 hover:text-red-200 bg-red-950/40 hover:bg-red-900/60 rounded-xl transition-all"
              title="Keluar Room"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phase Indicator & Auto Countdown */}
        <div
          className={`p-4 rounded-2xl border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isNight
              ? 'bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border-indigo-800/50'
              : room.phase === 'voting'
              ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-red-800/50'
              : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700 text-white">
              {room.phase === 'role_reveal' && <Eye className="w-6 h-6 text-indigo-400" />}
              {room.phase === 'night' && <Moon className="w-6 h-6 text-indigo-400 animate-pulse" />}
              {room.phase === 'day_announcement' && <Sun className="w-6 h-6 text-amber-400" />}
              {room.phase === 'discussion' && <MessageCircle className="w-6 h-6 text-sky-400" />}
              {room.phase === 'voting' && <Crosshair className="w-6 h-6 text-red-400" />}
              {room.phase === 'vote_result' && <Skull className="w-6 h-6 text-red-500" />}
              {room.phase === 'ended' && <Award className="w-6 h-6 text-yellow-400 animate-bounce" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Fase Permainan Saat Ini
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {room.phase === 'role_reveal' && 'Pembagian Peran Rahasia'}
                {room.phase === 'night' && 'Malam Hari (Aksi Rahasia)'}
                {room.phase === 'day_announcement' && 'Pagi Hari (Pengumuman Moderator)'}
                {room.phase === 'discussion' && 'Siang Hari (Diskusi Warga Kota)'}
                {room.phase === 'voting' && 'Sesi Voting Warga (Eksekusi Suspect)'}
                {room.phase === 'vote_result' && 'Hasil Voting Warga'}
                {room.phase === 'ended' && 'Permainan Telah Berakhir'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {timeLeft > 0 && room.phase !== 'ended' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-700">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-mono font-bold text-amber-400">{timeLeft}s</span>
              </div>
            )}

            {/* Host Master Control to Advance Phase Manually if needed */}
            {isHost && room.phase !== 'ended' && (
              <div className="flex items-center gap-2">
                {room.phase === 'role_reveal' && (
                  <button
                    onClick={() => onAdvancePhase('night')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Mulai Malam</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {room.phase === 'night' && (
                  <button
                    onClick={() => onAdvancePhase('evaluate_night')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Evaluasi Malam</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {room.phase === 'day_announcement' && (
                  <button
                    onClick={() => onAdvancePhase('discussion')}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Mulai Diskusi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {room.phase === 'discussion' && (
                  <button
                    onClick={() => onAdvancePhase('voting')}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Buka Voting</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {room.phase === 'voting' && (
                  <button
                    onClick={() => onAdvancePhase('evaluate_vote')}
                    className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Hitung Suara</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {room.phase === 'vote_result' && (
                  <button
                    onClick={() => onAdvancePhase('next_round')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <span>Malam Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PRIVACY SHIELD: Tap to Reveal Player's Secret Role */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl relative overflow-hidden ${roleInfo.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
                Tirai Privasi Peran Anda
              </span>
            </div>
            <button
              onClick={() => setShowRoleSecret(!showRoleSecret)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full text-xs font-bold border border-slate-700 transition-all"
            >
              {showRoleSecret ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-red-400" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tekan untuk Lihat</span>
                </>
              )}
            </button>
          </div>

          {showRoleSecret ? (
            <div className="flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-700">
                {roleInfo.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-2xl font-black tracking-wide ${roleInfo.color}`}>
                    {roleInfo.title}
                  </span>
                  <span className="text-xs bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-semibold">
                    {roleInfo.team}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {roleInfo.desc}
                </p>
                {!isAlive && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-700/60 text-red-300 rounded-lg text-xs font-bold">
                    <Skull className="w-3.5 h-3.5" />
                    <span>Anda telah tereliminasi (Menjadi Spectator)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowRoleSecret(true)}
              className="py-5 text-center cursor-pointer select-none bg-slate-950/60 rounded-2xl border border-dashed border-slate-700 hover:border-slate-500 transition-all"
            >
              <div className="flex justify-center mb-1">
                <Eye className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-slate-300">
                Peran Tersembunyi (Aman dari Lirikan Teman)
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sentuh untuk melihat peran Anda secara rahasia
              </p>
            </div>
          )}
        </div>

        {/* GAME OVER SCREEN */}
        {room.phase === 'ended' && (
          <div className="p-6 bg-slate-900/90 rounded-3xl border border-amber-500/40 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="inline-flex p-4 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-3xl text-slate-950 shadow-xl">
              <Award className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                Permainan Mafia Selesai
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {room.winner === 'villagers' ? '🏆 WARGA KOTA MENANG!' : '🔴 MAFIA MENANG!'}
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
                {room.winReason || 'Semua misi peran telah terselesaikan.'}
              </p>
            </div>

            {/* Complete Role Reveal Table */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Identitas Rahasia Seluruh Pemain:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {room.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        {p.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-500">@{p.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.role === 'mafia'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : p.role === 'doctor'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : p.role === 'detective'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {p.role?.toUpperCase() || 'WARGA'}
                      </span>
                      {!p.isAlive && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          Gugur
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restart Button for Host */}
            {isHost && (
              <div className="pt-2">
                <button
                  onClick={onRestartGame}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-2 mx-auto transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Main Lagi (Kembali ke Lobby)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* FASE MALAM (Night Phase Actions) */}
        {room.phase === 'night' && (
          <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-indigo-900/60 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-950 rounded-2xl border border-indigo-800 text-indigo-400">
                <Moon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Malam Telah Tiba... Kota Tertidur</h3>
                <p className="text-xs text-slate-400">
                  Semua warga kota menutup mata. Sistem moderator memanggil peran khusus secara rahasia.
                </p>
              </div>
            </div>

            {/* Dead players message */}
            {!isAlive && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                <Skull className="w-6 h-6 text-red-500/70 mx-auto mb-1.5" />
                Anda sudah tereliminasi. Saksikan permainan berlangsung sebagai penonton.
              </div>
            )}

            {/* Mafia Night Action */}
            {isAlive && role === 'mafia' && (
              <div className="p-4 bg-red-950/30 rounded-2xl border border-red-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400">
                    <Crosshair className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      Aksi Rahasia Mafia: Pilih Target Pembunuhan
                    </span>
                  </div>
                  {hasSubmittedNightAction && (
                    <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                      Target Terkunci ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {alivePlayers
                    .filter((p) => p.id !== currentPlayer.id)
                    .map((target) => (
                      <button
                        key={target.id}
                        disabled={hasSubmittedNightAction}
                        onClick={() => setSelectedNightTarget(target.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedNightTarget === target.id
                            ? 'bg-red-600/30 border-red-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-red-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {target.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{target.name}</div>
                            <div className="text-[11px] text-slate-500">@{target.username}</div>
                          </div>
                        </div>
                        {selectedNightTarget === target.id && (
                          <Crosshair className="w-4 h-4 text-red-400 animate-spin-slow" />
                        )}
                      </button>
                    ))}
                </div>

                <button
                  disabled={!selectedNightTarget || hasSubmittedNightAction}
                  onClick={handleNightActionSubmit}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Skull className="w-4 h-4" />
                  <span>{hasSubmittedNightAction ? 'Target Telah Diserahkan' : 'Konfirmasi Target Mafia'}</span>
                </button>
              </div>
            )}

            {/* Doctor Night Action */}
            {isAlive && role === 'doctor' && (
              <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Heart className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      Aksi Rahasia Dokter: Lindungi 1 Pemain
                    </span>
                  </div>
                  {hasSubmittedNightAction && (
                    <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                      Target Terkunci ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {alivePlayers.map((target) => (
                    <button
                      key={target.id}
                      disabled={hasSubmittedNightAction}
                      onClick={() => setSelectedNightTarget(target.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedNightTarget === target.id
                          ? 'bg-emerald-600/30 border-emerald-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                          {target.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {target.name} {target.id === currentPlayer.id && '(Anda)'}
                          </div>
                          <div className="text-[11px] text-slate-500">@{target.username}</div>
                        </div>
                      </div>
                      {selectedNightTarget === target.id && (
                        <Heart className="w-4 h-4 text-emerald-400 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedNightTarget || hasSubmittedNightAction}
                  onClick={handleNightActionSubmit}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>{hasSubmittedNightAction ? 'Target Telah Dilindungi' : 'Lindungi Pemain Ini'}</span>
                </button>
              </div>
            )}

            {/* Detective Night Action */}
            {isAlive && role === 'detective' && (
              <div className="p-4 bg-sky-950/30 rounded-2xl border border-sky-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Search className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      Aksi Rahasia Detektif: Periksa Identitas 1 Pemain
                    </span>
                  </div>
                  {hasSubmittedNightAction && (
                    <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                      Pemeriksaan Terkirim ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {alivePlayers
                    .filter((p) => p.id !== currentPlayer.id)
                    .map((target) => (
                      <button
                        key={target.id}
                        disabled={hasSubmittedNightAction}
                        onClick={() => setSelectedNightTarget(target.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedNightTarget === target.id
                            ? 'bg-sky-600/30 border-sky-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-sky-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {target.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{target.name}</div>
                            <div className="text-[11px] text-slate-500">@{target.username}</div>
                          </div>
                        </div>
                        {selectedNightTarget === target.id && (
                          <Search className="w-4 h-4 text-sky-400" />
                        )}
                      </button>
                    ))}
                </div>

                <button
                  disabled={!selectedNightTarget || hasSubmittedNightAction}
                  onClick={handleNightActionSubmit}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{hasSubmittedNightAction ? 'Pemeriksaan Selesai' : 'Periksa Pemain Ini'}</span>
                </button>

                {/* Detective Investigation Result Box */}
                {detectiveResult && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-sky-700 animate-in zoom-in-95 duration-200">
                    <div className="text-[10px] text-sky-400 uppercase font-bold tracking-wider mb-1">
                      Hasil Intelijen Detektif:
                    </div>
                    <div className="text-sm font-bold text-white">
                      {detectiveResult.targetName} adalah:{' '}
                      <span className={detectiveResult.isMafia ? 'text-red-400' : 'text-emerald-400'}>
                        {detectiveResult.isMafia ? '🔴 ANGGOTA MAFIA!' : '👤 BUKAN MAFIA (Warga Baik)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Villager Peaceful Night Screen */}
            {isAlive && role === 'villager' && (
              <div className="p-8 bg-slate-950/50 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-700 flex items-center justify-center mx-auto text-indigo-400">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-black text-white text-base">Anda Sedang Tidur Lelap</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Sebagai warga kota biasa, Anda tidak memiliki aksi malam hari. Tetap tenang, jangan melihat layar teman, dan siapkan argumen cerdas saat fajar menyingsing!
                </p>
              </div>
            )}
          </div>
        )}

        {/* FASE PENGUMUMAN PAGI (Day Announcement) */}
        {room.phase === 'day_announcement' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-amber-900/50 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-950 border border-amber-600 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
              <Sun className="w-8 h-8 animate-spin-slow" />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Pengumuman Pagi Hari • Putaran {room.round}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {room.savedByDoctor
                  ? 'Dokter Berhasil Menyelamatkan Korban!'
                  : room.nightVictimId
                  ? 'Warga Kota Ditemukan Tewas!'
                  : 'Malam Berlalu dengan Damai'}
              </h3>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-xl mx-auto text-sm text-slate-200 leading-relaxed font-medium">
              {room.chatMessages
                ?.filter((m) => m.isSystem && m.text.includes('Pagi'))
                ?.slice(-1)[0]?.text ||
                'Pagi hari telah tiba. Warga kota berkumpul di alun-alun untuk memeriksa keadaan.'}
            </div>

            {/* Detective Result Notification if played */}
            {role === 'detective' && detectiveResult && (
              <div className="p-3 bg-sky-950/60 rounded-xl border border-sky-800 max-w-md mx-auto text-xs text-sky-200">
                🔍 <strong>Catatan Rahasia Detektif:</strong> {detectiveResult.targetName} adalah{' '}
                <strong className={detectiveResult.isMafia ? 'text-red-400' : 'text-emerald-400'}>
                  {detectiveResult.isMafia ? 'MAFIA' : 'BUKAN MAFIA'}
                </strong>
                .
              </div>
            )}

            {isHost && (
              <div className="pt-2">
                <button
                  onClick={() => onAdvancePhase('discussion')}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Mulai Diskusi Siang</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* FASE DISKUSI (Day Discussion) */}
        {room.phase === 'discussion' && (
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-sky-900/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-950 rounded-xl border border-sky-800 text-sky-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Waktu Diskusi Terbuka</h3>
                  <p className="text-xs text-slate-400">
                    Bahas kejadian malam ini, amati alibi teman, dan cari siapa pembunuh berdarah dingin.
                  </p>
                </div>
              </div>
              {timeLeft > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Sisa Waktu:</span>
                  <span className="font-mono text-base font-black text-amber-400">{timeLeft}s</span>
                </div>
              )}
            </div>

            {/* Alive Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {alivePlayers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Aktif Diskusi</div>
                  </div>
                </div>
              ))}
            </div>

            {isHost && (
              <div className="pt-2 text-right">
                <button
                  onClick={() => onAdvancePhase('voting')}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Mulai Voting Sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* FASE VOTING (Day Voting) */}
        {room.phase === 'voting' && (
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-red-900/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-950 rounded-xl border border-red-800 text-red-400">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Sesi Voting Eliminasi Tersangka</h3>
                  <p className="text-xs text-slate-400">
                    Pilih 1 pemain yang Anda curigai sebagai Mafia. Pemain dengan suara terbanyak akan dieksekusi.
                  </p>
                </div>
              </div>
              {hasVoted && (
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
                  Suara Masuk ✓
                </span>
              )}
            </div>

            {isAlive ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {alivePlayers
                    .filter((p) => p.id !== currentPlayer.id)
                    .map((target) => (
                      <button
                        key={target.id}
                        disabled={hasVoted}
                        onClick={() => setSelectedVoteTarget(target.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedVoteTarget === target.id
                            ? 'bg-red-600/30 border-red-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-red-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                            {target.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{target.name}</div>
                            <div className="text-[11px] text-slate-500">@{target.username}</div>
                          </div>
                        </div>
                        {selectedVoteTarget === target.id && (
                          <UserCheck className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    ))}
                </div>

                <button
                  disabled={!selectedVoteTarget || hasVoted}
                  onClick={handleVoteSubmit}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Skull className="w-4 h-4" />
                  <span>{hasVoted ? 'Suara Anda Telah Dihitung' : 'Kirim Suara Eliminasi'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                Pemain yang telah tereliminasi tidak memiliki hak suara.
              </div>
            )}
          </div>
        )}

        {/* FASE HASIL VOTING (Vote Result) */}
        {room.phase === 'vote_result' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-950 border border-red-600 flex items-center justify-center mx-auto text-red-400 shadow-xl">
              <Skull className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                Hasil Voting Warga Kota
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {room.wasTieVote ? 'Hasil Voting Seri!' : 'Tersangka Telah Dieliminasi'}
              </h3>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-xl mx-auto text-sm text-slate-200 leading-relaxed font-medium">
              {room.chatMessages
                ?.filter((m) => m.isSystem && (m.text.includes('voting') || m.text.includes('eliminasi')))
                ?.slice(-1)[0]?.text || 'Hasil keputusan warga telah diputuskan.'}
            </div>

            {/* Host Advance to Next Night */}
            {isHost && (
              <div className="pt-2">
                <button
                  onClick={() => onAdvancePhase('next_round')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Lanjut ke Malam Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Drawer / Popout */}
        {showChat && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
              <span>Chat Ruangan ({room.chatMessages?.length || 0})</span>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                Tutup
              </button>
            </div>
            <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs">
              {room.chatMessages?.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl ${
                    m.isSystem
                      ? 'bg-indigo-950/40 border border-indigo-900/40 text-indigo-300'
                      : m.senderId === currentPlayer.userId
                      ? 'bg-slate-800 ml-6 text-slate-100'
                      : 'bg-slate-950 mr-6 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-bold text-slate-400">{m.senderName}</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="leading-relaxed break-words">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
