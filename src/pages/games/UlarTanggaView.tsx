import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Users,
  User,
  Sparkles,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { SNAKES_AND_LADDERS_MAP } from '../../constants/schoolGamesData.ts';
import { offlineStore } from '../../lib/api.ts';

interface UlarTanggaViewProps {
  onBack: () => void;
}

interface PlayerPiece {
  id: string;
  name: string;
  position: number;
  color: string;
  isBot?: boolean;
}

export const UlarTanggaView: React.FC<UlarTanggaViewProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [mode, setMode] = useState<'solo' | 'multiplayer'>('solo');
  const [gameStarted, setGameStarted] = useState(false);

  const PLAYER_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

  const [players, setPlayers] = useState<PlayerPiece[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Dice state
  const [diceNumber, setDiceNumber] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [lastMoveNotice, setLastMoveNotice] = useState<string | null>(null);
  const [winner, setWinner] = useState<PlayerPiece | null>(null);

  // Generate 100 to 1 board layout (serpentine)
  // Row 10: 100 - 91 (left to right)
  // Row 9: 81 - 90 (left to right)
  // ...
  const generateBoardNumbers = () => {
    const rows: number[][] = [];
    for (let r = 9; r >= 0; r--) {
      const rowNumbers: number[] = [];
      const isEvenFromBottom = r % 2 === 1; // 9, 7, 5, 3, 1
      for (let c = 0; c < 10; c++) {
        const num = isEvenFromBottom ? (r + 1) * 10 - c : r * 10 + (c + 1);
        rowNumbers.push(num);
      }
      rows.push(rowNumbers);
    }
    return rows;
  };

  const boardRows = generateBoardNumbers();

  const handleStartGame = () => {
    const initialPlayers: PlayerPiece[] =
      mode === 'solo'
        ? [
            { id: 'p1', name: currentUser?.name || 'Siswa', position: 1, color: PLAYER_COLORS[0] },
            { id: 'p2', name: 'Komputer Siswa (Bot)', position: 1, color: PLAYER_COLORS[1], isBot: true },
          ]
        : [
            { id: 'p1', name: currentUser?.name || 'Siswa', position: 1, color: PLAYER_COLORS[0] },
            { id: 'p2', name: 'Teman 1', position: 1, color: PLAYER_COLORS[1] },
          ];

    setPlayers(initialPlayers);
    setActivePlayerIndex(0);
    setDiceNumber(1);
    setWinner(null);
    setLastMoveNotice('Permainan dimulai! Silakan lempar dadu.');
    setGameStarted(true);
  };

  const checkSnakeOrLadder = (pos: number): { newPos: number; msg?: string } => {
    const item = SNAKES_AND_LADDERS_MAP.find((m) => m.from === pos);
    if (!item) return { newPos: pos };
    if (item.type === 'ladder') {
      return {
        newPos: item.to,
        msg: `Naik TANGGA dari petak ${item.from} ke ${item.to}!`,
      };
    } else {
      return {
        newPos: item.to,
        msg: `Tergigit ULAR! Turun dari petak ${item.from} ke ${item.to}.`,
      };
    }
  };

  const rollDice = () => {
    if (isRolling || winner) return;
    setIsRolling(true);

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceNumber(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceNumber(finalDice);
        setIsRolling(false);
        applyMove(finalDice);
      }
    }, 80);
  };

  const applyMove = (dice: number) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const player = { ...updated[activePlayerIndex] };
      let newPosition = player.position + dice;

      if (newPosition > 100) {
        // Bounce back if overshoot
        const excess = newPosition - 100;
        newPosition = 100 - excess;
      }

      // Check snake or ladder
      const check = checkSnakeOrLadder(newPosition);
      player.position = check.newPos;
      updated[activePlayerIndex] = player;

      const notice = `${player.name} melempar angka ${dice}. Bergerak ke petak ${newPosition}. ${check.msg || ''}`;
      setLastMoveNotice(notice);

      // Check winner
      if (player.position === 100) {
        setWinner(player);
      } else {
        // Switch turn
        const nextIdx = (activePlayerIndex + 1) % prev.length;
        setActivePlayerIndex(nextIdx);

        // If next player is Bot in solo mode, trigger bot roll after 1s
        if (mode === 'solo' && updated[nextIdx].isBot) {
          setTimeout(() => {
            triggerBotTurn(nextIdx);
          }, 1200);
        }
      }

      return updated;
    });
  };

  const triggerBotTurn = (botIdx: number) => {
    if (winner) return;
    setIsRolling(true);
    setTimeout(() => {
      const botDice = Math.floor(Math.random() * 6) + 1;
      setDiceNumber(botDice);
      setIsRolling(false);

      setPlayers((prev) => {
        const updated = [...prev];
        const bot = { ...updated[botIdx] };
        let newPos = bot.position + botDice;
        if (newPos > 100) newPos = 100 - (newPos - 100);

        const check = checkSnakeOrLadder(newPos);
        bot.position = check.newPos;
        updated[botIdx] = bot;

        setLastMoveNotice(`Bot melempar angka ${botDice}. Bergerak ke petak ${newPos}. ${check.msg || ''}`);
        if (bot.position === 100) {
          setWinner(bot);
        } else {
          setActivePlayerIndex(0); // return to human player
        }
        return updated;
      });
    }, 800);
  };

  const renderDiceIcon = (num: number) => {
    const props = { className: `w-12 h-12 text-amber-400 ${isRolling ? 'animate-spin' : ''}` };
    switch (num) {
      case 1: return <Dice1 {...props} />;
      case 2: return <Dice2 {...props} />;
      case 3: return <Dice3 {...props} />;
      case 4: return <Dice4 {...props} />;
      case 5: return <Dice5 {...props} />;
      case 6: return <Dice6 {...props} />;
      default: return <Dice1 {...props} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar Permainan</span>
        </button>

        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black">
          Ular Tangga 100
        </span>
      </div>

      {!gameStarted ? (
        /* LOBBY */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg text-white font-black text-3xl">
              🪜
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Ular Tangga Tamvesta</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Papan permainan 1 sampai 100. Lempar dadu, manfaatkan tangga untuk naik lebih cepat, dan hindari gigitan ular!
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
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Solo (Lawan Komputer)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('multiplayer')}
                className={`p-4 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition ${
                  mode === 'multiplayer'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Multiplayer (Giliran Teman)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98"
          >
            Mulai Permainan Ular Tangga
          </button>
        </div>
      ) : (
        /* GAME BOARD & DICE */
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-2xl">
          {/* Winner Banner if won */}
          {winner && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-center space-y-2 animate-bounce">
              <Trophy className="w-8 h-8 mx-auto" />
              <h3 className="text-lg font-black">{winner.name} TELAH MENCAPAI KOTAK 100!</h3>
              <p className="text-xs font-bold">Selamat! Anda adalah pemenang Ular Tangga ronde ini!</p>
              <button
                onClick={handleStartGame}
                className="mt-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
              >
                Mulai Ulang Permainan
              </button>
            </div>
          )}

          {/* Player status bar */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className={`p-2 rounded-xl border flex items-center justify-between transition ${
                  idx === activePlayerIndex && !winner
                    ? 'border-emerald-500/80 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-bold truncate max-w-[90px]">{p.name}</span>
                </div>
                <span className="font-mono font-black text-emerald-400">Petak {p.position}</span>
              </div>
            ))}
          </div>

          {/* 10x10 Snake & Ladders Board Grid */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
            <div className="grid grid-rows-10 gap-1 aspect-square max-h-[380px] mx-auto w-full">
              {boardRows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-10 gap-1">
                  {row.map((num) => {
                    // Check if ladder or snake
                    const ladder = SNAKES_AND_LADDERS_MAP.find((m) => m.from === num && m.type === 'ladder');
                    const snake = SNAKES_AND_LADDERS_MAP.find((m) => m.from === num && m.type === 'snake');
                    const playersHere = players.filter((p) => p.position === num);

                    let bg = num % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/80';
                    if (ladder) bg = 'bg-emerald-950/80 border border-emerald-500/50';
                    if (snake) bg = 'bg-rose-950/80 border border-rose-500/50';
                    if (num === 100) bg = 'bg-amber-500/30 border border-amber-400';

                    return (
                      <div
                        key={num}
                        className={`relative rounded-lg flex flex-col items-center justify-center p-0.5 text-[8px] sm:text-[9px] font-bold ${bg} text-slate-300 transition-all`}
                        title={`Petak ${num}${ladder ? ` (Tangga ke ${ladder.to})` : snake ? ` (Ular ke ${snake.to})` : ''}`}
                      >
                        <span className="opacity-70 leading-none">{num}</span>
                        {ladder && <span className="text-[7px] text-emerald-400 font-black leading-none">▲{ladder.to}</span>}
                        {snake && <span className="text-[7px] text-rose-400 font-black leading-none">▼{snake.to}</span>}

                        {/* Player Pieces On This Cell */}
                        {playersHere.length > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
                            {playersHere.map((p) => (
                              <div
                                key={p.id}
                                className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-white shadow-md animate-pulse"
                                style={{ backgroundColor: p.color }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Dice & Action Area */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-2xl border border-slate-800">
                {renderDiceIcon(diceNumber)}
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Giliran: {players[activePlayerIndex]?.name}
                </span>
                <p className="text-xs font-semibold text-slate-300 leading-tight">
                  {lastMoveNotice || 'Klik tombol lempar dadu untuk melangkah.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={rollDice}
                disabled={isRolling || Boolean(winner) || Boolean(players[activePlayerIndex]?.isBot)}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isRolling ? 'Mengocok Dadu...' : 'Lempar Dadu 🎲'}
              </button>

              <button
                type="button"
                onClick={handleStartGame}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                title="Mulai Ulang"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
