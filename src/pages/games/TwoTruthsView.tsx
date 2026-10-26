import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle,
  XCircle,
  HelpCircle,
  Users,
  User,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { TWO_TRUTHS_PRESETS, type TwoTruthsSet } from '../../constants/schoolGamesData.ts';
import { offlineStore } from '../../lib/api.ts';

interface TwoTruthsViewProps {
  onBack: () => void;
}

export const TwoTruthsView: React.FC<TwoTruthsViewProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [mode, setMode] = useState<'solo' | 'multiplayer'>('solo');
  const [gameStarted, setGameStarted] = useState(false);

  // Solo mode state: guess computer / curriculum facts
  const [soloSetIndex, setSoloSetIndex] = useState(0);
  const [selectedGuessIndex, setSelectedGuessIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [soloScore, setSoloScore] = useState(0);

  // Multiplayer mode state: player writes 3 statements
  const [statement1, setStatement1] = useState('');
  const [statement2, setStatement2] = useState('');
  const [statement3, setStatement3] = useState('');
  const [lieIndex, setLieIndex] = useState<number>(2); // 0, 1, or 2
  const [multiplayerStep, setMultiplayerStep] = useState<'author_input' | 'guess_phase' | 'result'>('author_input');
  const [authorName, setAuthorName] = useState(currentUser?.name || 'Siswa');
  const [multiplayerScore, setMultiplayerScore] = useState<Record<string, number>>({});
  const [roundHistory, setRoundHistory] = useState<Array<{ topic: string; isCorrect: boolean }>>([]);

  const currentSoloSet = TWO_TRUTHS_PRESETS[soloSetIndex % TWO_TRUTHS_PRESETS.length];

  const handleStartGame = () => {
    setSoloSetIndex(0);
    setSelectedGuessIndex(null);
    setIsRevealed(false);
    setSoloScore(0);
    setMultiplayerStep('author_input');
    setGameStarted(true);
  };

  const handleSoloGuess = (index: number) => {
    if (isRevealed) return;
    setSelectedGuessIndex(index);
    setIsRevealed(true);
    const isCorrect = currentSoloSet.statements[index].isLie;
    if (isCorrect) {
      setSoloScore((prev) => prev + 10);
    }
    setRoundHistory((prev) => [
      ...prev,
      { topic: currentSoloSet.topic, isCorrect },
    ]);
  };

  const handleNextSoloRound = () => {
    setSelectedGuessIndex(null);
    setIsRevealed(false);
    setSoloSetIndex((prev) => prev + 1);
  };

  // Multiplayer Actions
  const handleAuthorSubmitStatements = () => {
    if (!statement1.trim() || !statement2.trim() || !statement3.trim()) {
      alert('Harap isi ketiga pernyataan terlebih dahulu!');
      return;
    }
    setMultiplayerStep('guess_phase');
    setSelectedGuessIndex(null);
    setIsRevealed(false);
  };

  const handleMultiplayerGuess = (idx: number) => {
    setSelectedGuessIndex(idx);
    setIsRevealed(true);
    setMultiplayerStep('result');
    const isCorrect = idx === lieIndex;
    if (isCorrect) {
      setSoloScore((prev) => prev + 10);
    }
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

        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black">
          Two Truths and a Lie
        </span>
      </div>

      {!gameStarted ? (
        /* LOBBY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg text-white font-black text-3xl">
              🎭
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Two Truths and a Lie</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Dua pernyataan benar dan satu pernyataan bohong. Bisakah kamu menebak mana pernyataan yang bohong?
            </p>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-400">Pilih Mode Permainan:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`p-4 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'solo'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Solo (Tebak Fakta Ilmiah & Sekolah)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('multiplayer')}
                className={`p-4 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'multiplayer'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Multiplayer (Tulis Pernyataan Sendiri)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98"
          >
            Mulai Permainan Two Truths and a Lie
          </button>
        </div>
      ) : mode === 'solo' ? (
        /* SOLO MODE GAMEPLAY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                Topik Ronde:
              </span>
              <h3 className="text-base font-black text-white">{currentSoloSet.topic}</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">Total Skor:</span>
              <span className="font-mono text-base font-black text-amber-400">{soloScore} Poin</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-bold text-center">
            Pilihlah 1 pernyataan di bawah ini yang menurutmu adalah <strong>BOHONG (LIE)</strong>:
          </p>

          {/* 3 Statements List */}
          <div className="space-y-3">
            {currentSoloSet.statements.map((stmt, idx) => {
              const isSelected = selectedGuessIndex === idx;
              let borderClass = 'border-slate-800 hover:border-indigo-500/60 bg-slate-950';

              if (isRevealed) {
                if (stmt.isLie) {
                  borderClass = 'border-amber-400 bg-amber-950/40 text-amber-200';
                } else if (isSelected && !stmt.isLie) {
                  borderClass = 'border-rose-500 bg-rose-950/40 text-rose-300';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSoloGuess(idx)}
                  disabled={isRevealed}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3 ${borderClass}`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {stmt.text}
                    </p>
                    {isRevealed && stmt.isLie && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40">
                        ★ INI PERNYATAAN BOHONG (LIE)
                      </span>
                    )}
                    {isRevealed && !stmt.isLie && isSelected && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-400/40">
                        ✕ INI SEBENARNYA BENAR (BUKAN LIE)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isRevealed && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-black">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Penjelasan Ilmiah:</span>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                {currentSoloSet.explanation}
              </p>
            </div>
          )}

          {isRevealed && (
            <button
              onClick={handleNextSoloRound}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-98"
            >
              Lanjut ke Ronde Berikutnya ➔
            </button>
          )}
        </div>
      ) : (
        /* MULTIPLAYER MODE GAMEPLAY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          {multiplayerStep === 'author_input' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-400 inline mr-1.5" />
                <span>Tuliskan 3 pernyataan tentang hobimu/pengalamanmu. 2 harus <strong>BENAR</strong> dan 1 harus <strong>BOHONG</strong>. Jangan masukkan data pribadi/rahasia sensitif.</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Pernyataan 1:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Saya pernah juara lomba catur di SD..."
                    value={statement1}
                    onChange={(e) => setStatement1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Pernyataan 2:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Saya punya kucing peliharaan bernama Mochi..."
                    value={statement2}
                    onChange={(e) => setStatement2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Pernyataan 3:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Saya tidak suka makan cokelat..."
                    value={statement3}
                    onChange={(e) => setStatement3(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-black text-amber-400 block">
                    Pilih mana nomor pernyataan yang BOHONG (LIE):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLieIndex(idx)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          lieIndex === idx
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Pernyataan #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAuthorSubmitStatements}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-98"
              >
                Kirim & Mulai Tebak Bersama Teman
              </button>
            </div>
          )}

          {(multiplayerStep === 'guess_phase' || multiplayerStep === 'result') && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs text-indigo-400 font-bold uppercase">Pernyataan dari {authorName}</span>
                <h3 className="text-sm font-black text-white">Tebak mana yang merupakan kebohongan!</h3>
              </div>

              <div className="space-y-3">
                {[statement1, statement2, statement3].map((stmt, idx) => {
                  const isLie = idx === lieIndex;
                  const isSelected = selectedGuessIndex === idx;
                  let border = 'border-slate-800 bg-slate-950 hover:border-indigo-400';

                  if (multiplayerStep === 'result') {
                    if (isLie) border = 'border-amber-400 bg-amber-950/40 text-amber-200';
                    else if (isSelected) border = 'border-rose-500 bg-rose-950/40 text-rose-300';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={multiplayerStep === 'result'}
                      onClick={() => handleMultiplayerGuess(idx)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition ${border}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                        {stmt}
                      </p>
                    </button>
                  );
                })}
              </div>

              {multiplayerStep === 'result' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 animate-in fade-in">
                  <h4 className="text-sm font-black text-white">
                    {selectedGuessIndex === lieIndex ? '🎉 Tebakanmu Tepat Sekali!' : '😅 Tebakanmu Salah!'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pernyataan bohong sebenarnya adalah nomor #{lieIndex + 1}.
                  </p>
                  <button
                    onClick={() => {
                      setStatement1('');
                      setStatement2('');
                      setStatement3('');
                      setMultiplayerStep('author_input');
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition"
                  >
                    Main Ronde Baru
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
