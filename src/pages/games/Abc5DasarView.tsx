import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Users,
  User,
  Flame,
  Volume2,
} from 'lucide-react';
import { ABC_CATEGORIES, TRUTH_CARDS, DARE_CARDS, type AbcCategory } from '../../constants/schoolGamesData.ts';
import { offlineStore } from '../../lib/api.ts';

interface Abc5DasarViewProps {
  onBack: () => void;
}

type GameMode = 'solo' | 'berdua' | 'multiplayer';

export const Abc5DasarView: React.FC<Abc5DasarViewProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [mode, setMode] = useState<GameMode>('solo');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('B');
  const [selectedCategories, setSelectedCategories] = useState<AbcCategory[]>([
    'Negara',
    'Buah',
    'Hewan',
    'Makanan',
    'Benda',
  ]);

  // Player 1 state (CurrentUser / Player 1)
  const [player1Name, setPlayer1Name] = useState(currentUser?.name || 'Pemain 1');
  const [player1Answers, setPlayer1Answers] = useState<Record<string, string>>({});
  const [player1Submitted, setPlayer1Submitted] = useState(false);

  // Player 2 state (for Berdua)
  const [player2Name, setPlayer2Name] = useState('Teman Sebangku');
  const [player2Answers, setPlayer2Answers] = useState<Record<string, string>>({});
  const [player2Submitted, setPlayer2Submitted] = useState(false);
  const [activeTurnPlayer, setActiveTurnPlayer] = useState<1 | 2>(1);

  // Multiplayer Room Code State
  const [roomCode, setRoomCode] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<string[]>([currentUser?.name || 'Siswa']);

  // Timer
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Results & Consequence
  const [showResult, setShowResult] = useState(false);
  const [punishmentCard, setPunishmentCard] = useState<{ type: 'truth' | 'dare'; text: string } | null>(null);

  // Pick random letter from A to Z
  const rollRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPRSTUVW'; // exclude hard letters like X, Q, Z for student fairness
    const rand = letters[Math.floor(Math.random() * letters.length)];
    setCurrentLetter(rand);
    return rand;
  };

  const handleStartGame = () => {
    rollRandomLetter();
    setPlayer1Answers({});
    setPlayer2Answers({});
    setPlayer1Submitted(false);
    setPlayer2Submitted(false);
    setActiveTurnPlayer(1);
    setTimeLeft(60);
    setIsTimerRunning(true);
    setShowResult(false);
    setPunishmentCard(null);
    setGameStarted(true);
  };

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (gameStarted && isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, isTimerRunning, timeLeft]);

  const handleAutoSubmit = () => {
    setPlayer1Submitted(true);
    setPlayer2Submitted(true);
    calculateResults();
  };

  const handlePlayer1Change = (cat: string, val: string) => {
    setPlayer1Answers((prev) => ({ ...prev, [cat]: val }));
  };

  const handlePlayer2Change = (cat: string, val: string) => {
    setPlayer2Answers((prev) => ({ ...prev, [cat]: val }));
  };

  const checkAnswerValidity = (answer: string, letter: string) => {
    const clean = (answer || '').trim();
    if (!clean) return false;
    return clean.charAt(0).toUpperCase() === letter.toUpperCase();
  };

  const getScore = (answers: Record<string, string>) => {
    let score = 0;
    selectedCategories.forEach((cat) => {
      if (checkAnswerValidity(answers[cat], currentLetter)) {
        score += 20; // 5 categories * 20 = 100 max
      }
    });
    return score;
  };

  const calculateResults = () => {
    setShowResult(true);
    setIsTimerRunning(false);

    // If Berdua or Multiplayer, pick Truth or Dare for the loser
    const p1Score = getScore(player1Answers);
    const p2Score = getScore(player2Answers);

    if (mode !== 'solo') {
      const isP1Loser = p1Score < p2Score;
      const isP2Loser = p2Score < p1Score;
      if (isP1Loser || isP2Loser) {
        // Pick random truth or dare
        const pickType = Math.random() > 0.5 ? 'truth' : 'dare';
        const deck = pickType === 'truth' ? TRUTH_CARDS : DARE_CARDS;
        const card = deck[Math.floor(Math.random() * deck.length)];
        setPunishmentCard({
          type: pickType,
          text: card.text,
        });
      }
    }
  };

  const handleFinishTurn1 = () => {
    setPlayer1Submitted(true);
    if (mode === 'berdua') {
      setActiveTurnPlayer(2);
      setTimeLeft(60);
      setIsTimerRunning(true);
    } else {
      calculateResults();
    }
  };

  const handleFinishTurn2 = () => {
    setPlayer2Submitted(true);
    calculateResults();
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

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black">
            ABC 5 Dasar
          </span>
        </div>
      </div>

      {!gameStarted ? (
        /* SETUP LOBBY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg text-white font-black text-2xl">
              ABC
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Permainan ABC 5 Dasar</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tebak dan tuliskan kata sesuai huruf acak untuk 5 kategori pilihan. Uji wawasan dan kecepatan berpikirmu!
            </p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Pilih Mode Permainan:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'solo'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Solo (1 Pemain)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('berdua')}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'berdua'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
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
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Multiplayer Ruangan</span>
              </button>
            </div>
          </div>

          {/* Name Setup for Berdua */}
          {mode === 'berdua' && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Pemain 1:</label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Pemain 2:</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Multiplayer Code Setup */}
          {mode === 'multiplayer' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Kode Ruangan ABC:</h4>
                  <p className="text-[10px] text-slate-400">Bagikan kode ini kepada teman di kelasmu</p>
                </div>
                {!isRoomCreated ? (
                  <button
                    onClick={() => {
                      const code = 'ABC-' + Math.floor(100 + Math.random() * 900);
                      setRoomCode(code);
                      setIsRoomCreated(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl hover:bg-amber-400"
                  >
                    Buat Ruangan
                  </button>
                ) : (
                  <span className="font-mono text-base font-black px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-xl tracking-widest">
                    {roomCode}
                  </span>
                )}
              </div>
              {isRoomCreated && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1.5">Pemain Terhubung:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {multiplayerPlayers.map((p, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold">
                        {p} (Host)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Selection (Pick 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400">
                Pilih 5 Kategori ({selectedCategories.length}/5):
              </label>
              {selectedCategories.length !== 5 && (
                <span className="text-[10px] text-rose-400 font-bold">Wajib pilih tepat 5 kategori</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ABC_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedCategories.length > 3) {
                          setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                        }
                      } else {
                        if (selectedCategories.length < 5) {
                          setSelectedCategories([...selectedCategories, cat]);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            disabled={selectedCategories.length !== 5}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition active:scale-98 disabled:opacity-50"
          >
            Mulai Permainan ABC 5 Dasar
          </button>
        </div>
      ) : showResult ? (
        /* RESULTS & TRUTH OR DARE CONSEQUENCE */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl text-white">
          <div className="text-center space-y-2">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-xl sm:text-2xl font-black">Hasil Ronde ABC 5 Dasar</h2>
            <p className="text-xs text-slate-400">
              Huruf Ronde: <span className="text-amber-400 font-black text-base">{currentLetter}</span>
            </p>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Player 1 Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-black text-sm text-amber-300">{player1Name}</span>
                <span className="text-xs font-extrabold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  Skor: {getScore(player1Answers)} / 100
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {selectedCategories.map((cat) => {
                  const ans = player1Answers[cat] || '-';
                  const valid = checkAnswerValidity(ans, currentLetter);
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">{cat}:</span>
                      <span className={`font-mono font-bold flex items-center gap-1 ${valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ans}
                        {valid ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Player 2 Card (if Berdua) */}
            {mode === 'berdua' && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-black text-sm text-teal-300">{player2Name}</span>
                  <span className="text-xs font-extrabold bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-lg border border-teal-500/30">
                    Skor: {getScore(player2Answers)} / 100
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {selectedCategories.map((cat) => {
                    const ans = player2Answers[cat] || '-';
                    const valid = checkAnswerValidity(ans, currentLetter);
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">{cat}:</span>
                        <span className={`font-mono font-bold flex items-center gap-1 ${valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ans}
                          {valid ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Konsekuensi Truth or Dare untuk yang kalah */}
          {punishmentCard && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-black text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4 text-purple-400" />
                <span>Kartu Konsekuensi untuk Pemain Kalah:</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-white font-extrabold text-[10px]">
                  {punishmentCard.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold text-white bg-black/30 p-3 rounded-xl border border-purple-400/20 leading-relaxed">
                "{punishmentCard.text}"
              </p>
              <p className="text-[10px] text-purple-200/80">
                Konsekuensi ini aman, sopan, dan sesuai untuk lingkungan sekolah.
              </p>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={handleStartGame}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Ronde Baru</span>
            </button>
            <button
              onClick={() => setGameStarted(false)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      ) : (
        /* GAMEPLAY IN PROGRESS */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          {/* Top Status Bar: Letter & Timer */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-md">
                {currentLetter}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Huruf Ronde:
                </span>
                <h3 className="text-base font-black text-white">
                  Awalan Huruf "{currentLetter}"
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
              <span className={`font-mono text-sm font-black ${timeLeft <= 10 ? 'text-rose-400' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Turn Indicator for Berdua */}
          {mode === 'berdua' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <span className="text-xs font-black text-amber-300">
                Giliran: {activeTurnPlayer === 1 ? player1Name : player2Name} (Pemain {activeTurnPlayer})
              </span>
            </div>
          )}

          {/* 5 Input Columns */}
          <div className="space-y-3">
            {selectedCategories.map((cat, idx) => {
              const currentVal =
                activeTurnPlayer === 1 ? player1Answers[cat] || '' : player2Answers[cat] || '';
              const isValid = checkAnswerValidity(currentVal, currentLetter);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-300">
                      {idx + 1}. Kategori {cat} (Huruf {currentLetter}):
                    </span>
                    {currentVal.length > 0 && (
                      <span className={`text-[10px] font-bold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isValid ? '✓ Awalan Sesuai' : '✕ Harus diawali huruf ' + currentLetter}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`Isi nama ${cat.toLowerCase()} berawalan huruf "${currentLetter}"...`}
                    value={currentVal}
                    onChange={(e) => {
                      if (activeTurnPlayer === 1) handlePlayer1Change(cat, e.target.value);
                      else handlePlayer2Change(cat, e.target.value);
                    }}
                    className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none transition ${
                      currentVal.length > 0
                        ? isValid
                          ? 'border-emerald-500/60 bg-emerald-950/10'
                          : 'border-rose-500/60 bg-rose-950/10'
                        : 'border-slate-800 focus:border-amber-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Submit Actions */}
          <div className="pt-2">
            {mode === 'solo' && (
              <button
                type="button"
                onClick={handleFinishTurn1}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-98"
              >
                Kirim Jawaban & Periksa Skor
              </button>
            )}

            {mode === 'berdua' && activeTurnPlayer === 1 && (
              <button
                type="button"
                onClick={handleFinishTurn1}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-98"
              >
                Selesai (Oper ke {player2Name})
              </button>
            )}

            {mode === 'berdua' && activeTurnPlayer === 2 && (
              <button
                type="button"
                onClick={handleFinishTurn2}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-98"
              >
                Kirim Jawaban & Tentukan Pemenang
              </button>
            )}

            {mode === 'multiplayer' && (
              <button
                type="button"
                onClick={handleFinishTurn1}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-98"
              >
                Kirim Jawaban Ronde Ini
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
