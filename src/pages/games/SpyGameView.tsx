import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Send,
  MessageCircle,
  HelpCircle,
  Award,
  Sparkles,
  UserCheck,
  ChevronRight,
  Shield,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GameRoom, GamePlayer } from '../../types/game.ts';

interface SpyGameViewProps {
  room: GameRoom;
  currentPlayer: GamePlayer;
  onAdvancePhase: (targetPhase: string) => Promise<void>;
  onCastVote: (targetPlayerId: string) => Promise<void>;
  onSubmitSpyGuess: (guess: string) => Promise<void>;
  onSendChat: (text: string) => Promise<void>;
  onRestartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onOpenRules: () => void;
}

export const SpyGameView: React.FC<SpyGameViewProps> = ({
  room,
  currentPlayer,
  onAdvancePhase,
  onCastVote,
  onSubmitSpyGuess,
  onSendChat,
  onRestartGame,
  onLeaveRoom,
  onOpenRules,
}) => {
  const [showSecretWord, setShowSecretWord] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [spyGuessInput, setSpyGuessInput] = useState('');
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const isHost = currentPlayer.isHost;
  const isAlive = currentPlayer.isAlive;
  const isSpy = currentPlayer.role === 'spy';
  const secretWord = currentPlayer.secretWord || (isSpy ? room.spyWord : room.civilianWord) || '???';
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

  // Trigger confetti on win
  useEffect(() => {
    if (room.winner) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [room.winner]);

  const handleVoteSubmit = async () => {
    if (!selectedVoteTarget || hasVoted) return;
    try {
      await onCastVote(selectedVoteTarget);
      setHasVoted(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirimkan suara.');
    }
  };

  const handleSpyGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spyGuessInput.trim() || submittingGuess) return;
    setSubmittingGuess(true);
    try {
      await onSubmitSpyGuess(spyGuessInput.trim());
    } catch (err: any) {
      alert(err.message || 'Gagal menebak kata.');
    } finally {
      setSubmittingGuess(false);
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
      {/* Game Stage Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              WHO'S THE SPY • PUTARAN {room.round}
            </span>
            <span className="text-xs text-slate-400">Kode: {room.code}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {room.phase === 'word_reveal' && 'Fase 1: Baca & Ingat Kata Rahasia'}
            {room.phase === 'clues' && 'Fase 2: Berikan Petunjuk Bergiliran'}
            {room.phase === 'discussion' && 'Fase 3: Diskusi & Analisis Kecurigaan'}
            {room.phase === 'voting' && 'Fase 4: Voting Eliminasi Tersangka'}
            {room.phase === 'vote_result' && 'Fase 5: Pengungkapan Hasil Voting'}
            {room.phase === 'spy_guess' && 'Fase Khusus: Tebak Kata Imposter!'}
            {room.phase === 'ended' && 'Permainan Selesai'}
          </h2>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            Kategori: <strong className="capitalize">{room.categoryUsed || room.spySettings.category}</strong>
          </p>
        </div>

        {/* Phase Timer */}
        <div className="flex items-center gap-3">
          {timeLeft > 0 && room.phase !== 'ended' && (
            <div className="bg-black/50 border border-emerald-500/40 px-4 py-2 rounded-2xl flex items-center gap-2 text-center">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Waktu Tersisa</span>
                <span className="font-mono text-xl font-black text-amber-300">{timeLeft}s</span>
              </div>
            </div>
          )}

          <button
            onClick={onOpenRules}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Aturan</span>
          </button>
        </div>
      </div>

      {/* PRIVACY SHIELD CARD (TIRAI PRIVASI KATA RAHASIA) */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800 text-center space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Shield className="w-4 h-4" /> Tirai Privasi Pemain
          </span>
          <span>Lindungi layar dari teman di sebelahmu!</span>
        </div>

        <div className="py-2">
          <p className="text-xs text-slate-400 font-medium">Kata Rahasia Anda:</p>
          {showSecretWord ? (
            <div className="my-2 p-4 bg-emerald-500/20 border-2 border-emerald-500 rounded-2xl animate-in zoom-in-95">
              <span className="text-2xl sm:text-4xl font-black tracking-wider text-emerald-300 drop-shadow">
                "{secretWord}"
              </span>
              <p className="text-[11px] text-emerald-200/90 mt-1">
                {isSpy ? '🕵️ Kamu adalah IMPOSTER! Samarkan dirimu.' : '👤 Kamu adalah PEMAIN BIASA. Cari siapa yang aneh!'}
              </p>
            </div>
          ) : (
            <div className="my-2 p-5 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-2xl">
              <span className="text-xl sm:text-2xl font-mono font-bold text-slate-500 tracking-widest">
                ••••••••••••••••
              </span>
              <p className="text-xs text-slate-400 mt-1">Kata disamarkan demi kerahasiaan</p>
            </div>
          )}

          <button
            onClick={() => setShowSecretWord(!showSecretWord)}
            className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 inline-flex items-center gap-2"
          >
            {showSecretWord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSecretWord ? 'Sembunyikan Kata' : 'Ketuk untuk Melihat Kata'}</span>
          </button>
        </div>
      </div>

      {/* PHASE SPECIFIC VIEWS */}

      {/* 1. WORD REVEAL PHASE */}
      {room.phase === 'word_reveal' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Ingat Kata Milikmu!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Buka tirai privasi di atas untuk melihat kata Anda. Jangan sebutkan kata tersebut ke teman. Setelah siap, masuk ke sesi pemberian petunjuk.
            </p>
          </div>
          {isHost && (
            <button
              onClick={() => onAdvancePhase('clues')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95 inline-flex items-center gap-2"
            >
              <span>Lanjut ke Pemberian Petunjuk</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 2. CLUES PHASE */}
      {room.phase === 'clues' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-900">Giliran Memberikan Petunjuk</h3>
            <p className="text-xs text-slate-500">
              Setiap pemain secara bergantian mengucapkan satu kalimat deskripsi tanpa membocorkan kata rahasia.
            </p>
          </div>

          {/* Turn Order Tracker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {alivePlayers.map((player, idx) => {
              const isCurrentTurn = idx === (room.activeCluePlayerIndex || 0);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border text-center transition ${
                    isCurrentTurn
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 scale-105 shadow-md'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <span className="block text-[10px] font-bold text-slate-400">Giliran #{idx + 1}</span>
                  <span className="font-black text-xs text-slate-900 block truncate mt-0.5">
                    {player.name}
                  </span>
                  {isCurrentTurn ? (
                    <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                      Sedang Berbicara 🗣️
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Menunggu</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Host Next Clue / Advance Control */}
          {isHost && (
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onAdvancePhase('next_clue')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
              >
                Giliran Pemain Berikutnya →
              </button>
              <button
                onClick={() => onAdvancePhase('discussion')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm active:scale-95"
              >
                Selesai Beri Clue, Buka Diskusi!
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DISCUSSION PHASE */}
      {room.phase === 'discussion' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Sesi Diskusi Terbuka!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Bahas petunjuk siapa yang terdengar aneh atau tidak cocok dengan kelompok. Cari siapa yang memiliki kata berbeda!
            </p>
          </div>

          {isHost && (
            <button
              onClick={() => onAdvancePhase('voting')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95"
            >
              Mulai Sesi Voting Sekarang 🗳️
            </button>
          )}
        </div>
      )}

      {/* 4. VOTING PHASE */}
      {room.phase === 'voting' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-900">Voting Eliminasi Tersangka</h3>
            <p className="text-xs text-slate-500">
              Pilih satu pemain yang paling Anda curigai sebagai Imposter!
            </p>
          </div>

          {/* Voting Target Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alivePlayers.map((player) => {
              const isSelected = selectedVoteTarget === player.id;
              const isSelf = player.id === currentPlayer.id;

              return (
                <button
                  key={player.id}
                  disabled={hasVoted || isSelf}
                  onClick={() => setSelectedVoteTarget(player.id)}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                      : isSelf
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      <img
                        src={player.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=0284c7`}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs text-slate-900 truncate">
                        {player.name} {isSelf ? '(Anda)' : ''}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono">@{player.username}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px]">
                      PILIHAN
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col items-center gap-2">
            {!hasVoted ? (
              <button
                onClick={handleVoteSubmit}
                disabled={!selectedVoteTarget}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md transition disabled:opacity-50 active:scale-95"
              >
                Kirim Suara Voting
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Suara Anda telah dicatat! Menunggu pemain lain selesai memilih...</span>
              </div>
            )}

            {isHost && (
              <button
                onClick={() => onAdvancePhase('evaluate_vote')}
                className="mt-2 text-xs text-slate-500 hover:text-slate-800 underline font-bold"
              >
                Hitung Hasil Suara Sekarang (Host Override)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. VOTE RESULT PHASE */}
      {room.phase === 'vote_result' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <h3 className="text-lg font-black text-slate-900">Hasil Pengumuman Suara</h3>
          {room.wasTieVote ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium space-y-1">
              <strong className="block text-sm font-black">Hasil Voting Seri!</strong>
              <span>Tidak ada pemain yang dieliminasi pada putaran ini. Permainan akan berlanjut ke putaran berikutnya.</span>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 text-xs font-medium space-y-1">
              <strong className="block text-sm font-black">Pemain Tereliminasi!</strong>
              <p>
                Identitas asli yang tereliminasi adalah:{' '}
                <strong className="text-base text-rose-700">
                  {room.lastEliminatedPlayerRole === 'spy' ? '🕵️ IMPOSTER' : '👤 PEMAIN BIASA'}
                </strong>
              </p>
            </div>
          )}

          {isHost && (
            <div className="pt-2">
              <button
                onClick={() => onAdvancePhase('next_round')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95"
              >
                Lanjut ke Putaran Berikutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. SPY GUESS PHASE */}
      {room.phase === 'spy_guess' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Kesempatan Terakhir Imposter!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Imposter telah tertangkap, namun Imposter berhak menebak kata yang dimiliki pemain biasa! Jika tebakan benar, Imposter membalikkan kemenangan!
            </p>
          </div>

          {isSpy ? (
            <form onSubmit={handleSpyGuessSubmit} className="max-w-sm mx-auto space-y-3">
              <input
                type="text"
                value={spyGuessInput}
                onChange={(e) => setSpyGuessInput(e.target.value)}
                placeholder="Ketik tebakan kata pemain biasa..."
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500 text-center"
              />
              <button
                type="submit"
                disabled={submittingGuess}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-md transition"
              >
                {submittingGuess ? 'Memeriksa...' : 'Kirim Tebakan Kata Imposter'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Menunggu Imposter mengirimkan tebakan kata rahasia...
            </p>
          )}
        </div>
      )}

      {/* 7. VICTORY / ENDED SCREEN */}
      {room.phase === 'ended' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">HASIL AKHIR PERMAINAN</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {room.winner === 'civilians' ? '🎉 PEMAIN BIASA MENANG!' : '🕵️ IMPOSTER MENANG!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">{room.winReason}</p>
          </div>

          {/* Reveal All Words */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="block text-[10px] font-bold text-emerald-700 uppercase">Kata Pemain Biasa</span>
              <strong className="text-sm sm:text-base font-black text-emerald-950">"{room.civilianWord}"</strong>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="block text-[10px] font-bold text-rose-700 uppercase">Kata Imposter</span>
              <strong className="text-sm sm:text-base font-black text-rose-950">"{room.spyWord}"</strong>
            </div>
          </div>

          {/* Player Roles Reveal List */}
          <div className="max-w-md mx-auto space-y-2 text-left">
            <span className="block text-xs font-bold text-slate-700">Daftar Peran Asli Semua Pemain:</span>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden text-xs">
              {room.players.map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{p.name}</strong>
                    <span className="text-slate-400 font-mono">(@{p.username})</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    p.role === 'spy' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {p.role === 'spy' ? '🕵️ IMPOSTER' : '👤 PEMAIN BIASA'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isHost && (
              <button
                onClick={onRestartGame}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Main Lagi (Putaran Baru)</span>
              </button>
            )}
            <button
              onClick={onLeaveRoom}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs transition active:scale-95 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar ke Menu Game</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Game Live Chat Floating / Bottom Box */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Obrolan Siswa:</span>
        </span>
        <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl text-xs">
          {room.chatMessages.slice(-10).map((m) => (
            <div key={m.id} className="text-[11px]">
              <strong className={m.isSystem ? 'text-amber-800 font-bold' : 'text-emerald-700'}>
                {m.senderName}:{' '}
              </strong>
              <span className="text-slate-800">{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ketik chat..."
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
