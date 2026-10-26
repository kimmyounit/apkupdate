import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  Sparkles,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  History,
  Send,
  Trophy,
} from 'lucide-react';
import { STARTING_WORDS } from '../../constants/schoolGamesData.ts';
import { offlineStore } from '../../lib/api.ts';

interface SambungKataViewProps {
  onBack: () => void;
}

type Mode = 'solo' | 'berdua' | 'multiplayer';

export const SambungKataView: React.FC<SambungKataViewProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [mode, setMode] = useState<Mode>('solo');
  const [gameStarted, setGameStarted] = useState(false);

  // Players
  const [players, setPlayers] = useState<string[]>([currentUser?.name || 'Siswa', 'Komputer (Bot)']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Word chain
  const [wordHistory, setWordHistory] = useState<Array<{ word: string; author: string }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer: 20 seconds per turn
  const [turnTime, setTurnTime] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loser, setLoser] = useState<string | null>(null);

  const lastWordEntry = wordHistory.length > 0 ? wordHistory[wordHistory.length - 1] : null;
  const requiredInitialLetter = lastWordEntry
    ? lastWordEntry.word.charAt(lastWordEntry.word.length - 1).toUpperCase()
    : 'S';

  const handleStartGame = () => {
    const initPlayers =
      mode === 'solo'
        ? [currentUser?.name || 'Siswa', 'Komputer (Bot)']
        : [currentUser?.name || 'Siswa', 'Teman Sebangku'];

    const firstWord = STARTING_WORDS[Math.floor(Math.random() * STARTING_WORDS.length)];
    setPlayers(initPlayers);
    setCurrentPlayerIndex(0);
    setWordHistory([{ word: firstWord, author: 'SISTEM' }]);
    setCurrentInput('');
    setErrorMessage(null);
    setTurnTime(20);
    setGameOver(false);
    setLoser(null);
    setIsTimerActive(true);
    setGameStarted(true);
  };

  // Turn timer countdown
  useEffect(() => {
    let timer: any;
    if (gameStarted && isTimerActive && !gameOver && turnTime > 0) {
      timer = setInterval(() => {
        setTurnTime((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, isTimerActive, gameOver, turnTime]);

  const handleTimeOut = () => {
    const failedPlayer = players[currentPlayerIndex];
    setLoser(failedPlayer);
    setGameOver(true);
    setIsTimerActive(false);
    setErrorMessage(`Waktu habis! ${failedPlayer} gagal menjawab kata tepat waktu.`);
  };

  const handleWordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameOver) return;

    const clean = currentInput.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Harap ketik kata terlebih dahulu!');
      return;
    }

    if (clean.length < 3) {
      setErrorMessage('Kata minimal terdiri dari 3 huruf.');
      return;
    }

    // 1. Must start with required letter
    if (clean.charAt(0) !== requiredInitialLetter) {
      setErrorMessage(`Kata harus diawali huruf "${requiredInitialLetter}"!`);
      return;
    }

    // 2. Cannot repeat already used words
    const isRepeated = wordHistory.some((item) => item.word.toUpperCase() === clean);
    if (isRepeated) {
      setErrorMessage(`Kata "${clean}" sudah digunakan pada ronde ini!`);
      return;
    }

    // Accept word
    setErrorMessage(null);
    const authorName = players[currentPlayerIndex];
    setWordHistory((prev) => [...prev, { word: clean, author: authorName }]);
    setCurrentInput('');

    // Advance turn
    const nextIdx = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIdx);
    setTurnTime(20);

    // If solo and next is Bot
    if (mode === 'solo' && nextIdx === 1) {
      triggerBotWord(clean);
    }
  };

  const triggerBotWord = (prevWord: string) => {
    setIsTimerActive(false);
    setTimeout(() => {
      const lastChar = prevWord.charAt(prevWord.length - 1).toUpperCase();
      // Look for a starting word or generate reasonable word
      const botPool = [
        'KUCING', 'KAPAL', 'KELAPA', 'KERTAS', 'KERETA',
        'HARIMAU', 'HUJAN', 'HUTAN', 'HARI', 'HEWAN',
        'ANGIN', 'AYAM', 'API', 'AWAN', 'APEL',
        'MAKAN', 'MALAM', 'MERAH', 'MOBIL', 'MINUM',
        'GURU', 'GAJAH', 'GELAS', 'GELOMBANG', 'GARAM',
        'RUMAH', 'RUSA', 'RUMPUT', 'RAGI', 'RANTING',
        'SEKOLAH', 'SINGA', 'SUNGAI', 'SURAT', 'SEPATU',
        'BURUNG', 'BUKU', 'BULAN', 'BINTANG', 'BUNGA',
        'TEMAN', 'TANAH', 'TAMAN', 'TANGGA', 'TERBANG',
        'PENSIL', 'POHON', 'PANTAI', 'PULAU', 'PINTAR',
      ];

      const candidates = botPool.filter(
        (w) => w.startsWith(lastChar) && !wordHistory.some((item) => item.word === w)
      );

      if (candidates.length > 0) {
        const botWord = candidates[Math.floor(Math.random() * candidates.length)];
        setWordHistory((prev) => [...prev, { word: botWord, author: 'Komputer (Bot)' }]);
        setCurrentPlayerIndex(0);
        setTurnTime(20);
        setIsTimerActive(true);
      } else {
        // Bot fails
        setGameOver(true);
        setErrorMessage('Komputer tidak menemukan kata baru! Kamu menang!');
      }
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar Permainan</span>
        </button>

        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-black">
          Sambung Kata
        </span>
      </div>

      {!gameStarted ? (
        /* LOBBY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg text-white font-black text-3xl">
              💬
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Sambung Kata Tamvesta</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Sistem memberikan kata awal. Sambung dengan kata baru yang diawali huruf terakhir kata sebelumnya sebelum waktu habis!
            </p>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-400">Pilih Mode Permainan:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'solo'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Solo (Vs Komputer)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('berdua')}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'berdua'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Berdua (Pass & Play)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('multiplayer')}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'multiplayer'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Multiplayer Kelas</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98"
          >
            Mulai Permainan Sambung Kata
          </button>
        </div>
      ) : (
        /* GAMEPLAY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          {/* Top Status: Turn & Timer */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                Giliran Pemain:
              </span>
              <h3 className="text-base font-black text-white">
                {players[currentPlayerIndex]}
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Clock className={`w-4 h-4 ${turnTime <= 5 ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
              <span className={`font-mono text-sm font-black ${turnTime <= 5 ? 'text-rose-400' : 'text-white'}`}>
                {turnTime}s
              </span>
            </div>
          </div>

          {/* Current Word & Next Letter Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950 border border-cyan-500/30 text-center space-y-2">
            <span className="text-xs text-slate-400 font-bold">Kata Sebelumnya:</span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-wider flex items-center justify-center gap-1">
              <span>{lastWordEntry?.word.slice(0, -1)}</span>
              <span className="text-amber-400 underline decoration-wavy decoration-amber-400">
                {lastWordEntry?.word.slice(-1)}
              </span>
            </div>
            <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-black">
              Huruf Wajib Berikutnya: "{requiredInitialLetter}"
            </div>
          </div>

          {/* Game Over Notice */}
          {gameOver && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-center space-y-2 animate-in zoom-in-95">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-base font-black text-white">Ronde Selesai!</h4>
              <p className="text-xs font-semibold">{errorMessage}</p>
              <button
                onClick={handleStartGame}
                className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
              >
                Main Ronde Baru
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !gameOver && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Word Input Form */}
          {!gameOver && (
            <form onSubmit={handleWordSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ketik kata diawali huruf "${requiredInitialLetter}"...`}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  disabled={mode === 'solo' && currentPlayerIndex === 1}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50 uppercase"
                />
                <button
                  type="submit"
                  disabled={mode === 'solo' && currentPlayerIndex === 1}
                  className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Kirim</span>
                </button>
              </div>
            </form>
          )}

          {/* Word Chain History */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <History className="w-4 h-4 text-slate-400" />
              <span>Rantai Kata ({wordHistory.length} kata):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              {wordHistory.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center gap-1"
                >
                  <span className="text-slate-500 text-[10px]">{idx + 1}.</span>
                  <span>{item.word}</span>
                  <span className="text-[9px] text-cyan-400/80">({item.author})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
