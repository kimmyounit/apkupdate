import React, { useState } from 'react';
import {
  ArrowLeft,
  Flame,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Shield,
  HelpCircle,
  Check,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { TRUTH_CARDS, DARE_CARDS, type TruthDareCard } from '../../constants/schoolGamesData.ts';
import { offlineStore } from '../../lib/api.ts';

interface TruthOrDareViewProps {
  onBack: () => void;
}

type Mode = 'solo' | 'berdua' | 'multiplayer';

export const TruthOrDareView: React.FC<TruthOrDareViewProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [mode, setMode] = useState<Mode>('solo');
  const [gameStarted, setGameStarted] = useState(false);

  // Players
  const [players, setPlayers] = useState<string[]>([currentUser?.name || 'Siswa', 'Teman 1']);
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Active Card
  const [selectedType, setSelectedType] = useState<'truth' | 'dare' | null>(null);
  const [activeCard, setActiveCard] = useState<TruthDareCard | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Handle Pick Truth or Dare
  const handlePick = (type: 'truth' | 'dare') => {
    setSelectedType(type);
    const deck = type === 'truth' ? TRUTH_CARDS : DARE_CARDS;
    const rand = deck[Math.floor(Math.random() * deck.length)];
    setActiveCard(rand);
  };

  const handleNextTurn = () => {
    setCompletedCount((prev) => prev + 1);
    setSelectedType(null);
    setActiveCard(null);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

  const handleAddPlayer = () => {
    if (!newPlayerInput.trim()) return;
    setPlayers((prev) => [...prev, newPlayerInput.trim()]);
    setNewPlayerInput('');
  };

  const handleRemovePlayer = (idx: number) => {
    if (players.length <= 2) return;
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
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
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-black">
            Truth or Dare
          </span>
        </div>
      </div>

      {!gameStarted ? (
        /* SETUP LOBBY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg text-white font-black text-2xl">
              🎲
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Truth or Dare Tamvesta</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tantangan dan pertanyaan ramah lingkungan sekolah. Seru, aman, menjaga sopan santun dan persahabatan!
            </p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Pilih Mode Permainan:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('solo');
                  setPlayers([currentUser?.name || 'Siswa']);
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'solo'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Solo (Latihan)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('berdua');
                  setPlayers([currentUser?.name || 'Siswa', 'Teman Sebangku']);
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'berdua'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Berdua (2 Pemain)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('multiplayer');
                  setPlayers([currentUser?.name || 'Siswa', 'Teman 1', 'Teman 2']);
                }}
                className={`py-3 px-2 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'multiplayer'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Multiplayer Kelas</span>
              </button>
            </div>
          </div>

          {/* Player Roster for Berdua & Multiplayer */}
          {mode !== 'solo' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-400 block">Daftar Nama Pemain:</label>
              <div className="flex flex-wrap gap-2">
                {players.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                  >
                    <span>{idx + 1}. {p}</span>
                    {players.length > 2 && (
                      <button
                        onClick={() => handleRemovePlayer(idx)}
                        className="text-slate-400 hover:text-rose-400 font-black text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {mode === 'multiplayer' && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Tambah nama teman..."
                    value={newPlayerInput}
                    onChange={(e) => setNewPlayerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={handleAddPlayer}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                  >
                    Tambah
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Safe School Notice */}
          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-center gap-3 text-purple-200 text-xs">
            <Shield className="w-5 h-5 text-purple-400 shrink-0" />
            <span>Semua kartu tantangan & pertanyaan telah difilter agar sopan, aman, dan tanpa unsur perundungan.</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPlayerIndex(0);
              setSelectedType(null);
              setActiveCard(null);
              setCompletedCount(0);
              setGameStarted(true);
            }}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98"
          >
            Mulai Permainan Truth or Dare
          </button>
        </div>
      ) : (
        /* GAMEPLAY BOARD */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl text-center">
          {/* Turn Banner */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
              Pemain Yang Sedang Giliran:
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
              <Smile className="w-5 h-5 text-amber-300" />
              <span>{players[currentPlayerIndex]}</span>
            </h3>
            {mode !== 'solo' && (
              <p className="text-[11px] text-slate-400">
                Giliran {currentPlayerIndex + 1} dari {players.length} pemain • Selesai: {completedCount} kartu
              </p>
            )}
          </div>

          {!selectedType ? (
            /* STEP 1: PICK TRUTH OR DARE */
            <div className="space-y-4 py-4">
              <p className="text-sm font-bold text-slate-300">
                Pilih kartu yang ingin kamu ambil:
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handlePick('truth')}
                  className="py-8 px-4 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 text-white font-black text-lg shadow-xl border border-blue-400/40 transition active:scale-95 group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🕊️</div>
                  <div>TRUTH</div>
                  <div className="text-[10px] text-cyan-200 font-normal mt-1">Kejujuran Santai</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePick('dare')}
                  className="py-8 px-4 rounded-3xl bg-gradient-to-br from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-lg shadow-xl border border-rose-400/40 transition active:scale-95 group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
                  <div>DARE</div>
                  <div className="text-[10px] text-amber-200 font-normal mt-1">Tantangan Seru</div>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: SHOW CARD */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div
                className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
                  selectedType === 'truth'
                    ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 border-cyan-500/40 text-cyan-100'
                    : 'bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 border-amber-500/40 text-amber-100'
                }`}
              >
                <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border bg-white/10 text-white">
                  KARTU {selectedType.toUpperCase()}
                </div>

                <p className="text-base sm:text-lg font-black text-white leading-relaxed max-w-lg mx-auto">
                  "{activeCard?.text}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Selesai & Lanjut Giliran Berikutnya</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePick(selectedType)}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ganti Kartu</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom control */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Mode: {mode.toUpperCase()}</span>
            <button
              onClick={() => setGameStarted(false)}
              className="text-rose-400 hover:text-rose-300 font-bold"
            >
              Selesai & Keluar ke Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
