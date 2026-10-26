import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Gamepad2,
  Users,
  Search,
  Flame,
  PlusCircle,
  LogIn,
  HelpCircle,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  Eye,
  ChevronRight,
  Radio,
  BookOpen,
} from 'lucide-react';
import { gameApi, offlineStore } from '../../lib/api.ts';
import type { GameRoom, GameType } from '../../types/game.ts';
import { GameLobbyView } from './GameLobbyView.tsx';
import { SpyGameView } from './SpyGameView.tsx';
import { MafiaGameView } from './MafiaGameView.tsx';
import { GameRulesModal } from './GameRulesModal.tsx';
import { Abc5DasarView } from './Abc5DasarView.tsx';
import { TruthOrDareView } from './TruthOrDareView.tsx';
import { UlarTanggaView } from './UlarTanggaView.tsx';
import { SambungKataView } from './SambungKataView.tsx';
import { TwoTruthsView } from './TwoTruthsView.tsx';

interface GamesPageProps {
  onBack: () => void;
}

export const GamesPage: React.FC<GamesPageProps> = ({ onBack }) => {
  const currentUser = offlineStore.getCurrentUser();
  const [activeSelectedGame, setActiveSelectedGame] = useState<
    'hub' | 'abc' | 'truth_dare' | 'ular_tangga' | 'sambung_kata' | 'two_truths'
  >('hub');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(() => {
    return sessionStorage.getItem('tamvesta_active_game_code') || null;
  });
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshingList, setRefreshingList] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesTab, setRulesTab] = useState<'spy' | 'mafia'>('spy');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createGameType, setCreateGameType] = useState<GameType>('spy');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Sync active room code to sessionStorage
  useEffect(() => {
    if (activeRoomCode) {
      sessionStorage.setItem('tamvesta_active_game_code', activeRoomCode);
    } else {
      sessionStorage.removeItem('tamvesta_active_game_code');
    }
  }, [activeRoomCode]);

  // Load available rooms for lobby display
  const loadAvailableRooms = useCallback(async () => {
    try {
      setRefreshingList(true);
      const rooms = await gameApi.getGameRooms();
      setAvailableRooms(rooms.filter((r) => r.status === 'waiting'));
    } catch (_) {
      // fallback handled in api.ts
    } finally {
      setRefreshingList(false);
    }
  }, []);

  useEffect(() => {
    if (!activeRoomCode) {
      loadAvailableRooms();
      const interval = setInterval(loadAvailableRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [activeRoomCode, loadAvailableRooms]);

  // Fetch active room state
  const fetchRoomState = useCallback(async (code: string) => {
    try {
      const data = await gameApi.getGameRoom(code);
      setRoom(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Room fetch error:', err);
      // If room no longer exists, exit to hub
      if (err.message && err.message.includes('tidak ditemukan')) {
        setActiveRoomCode(null);
        setRoom(null);
      }
    }
  }, []);

  // Poll active room every 1.5 seconds and listen to multi-tab sync
  useEffect(() => {
    if (!activeRoomCode) {
      setRoom(null);
      return;
    }

    fetchRoomState(activeRoomCode);

    pollIntervalRef.current = setInterval(() => {
      fetchRoomState(activeRoomCode);
    }, 1500);

    // Multi-tab BroadcastChannel listener for 0ms lag
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('tamvesta_game_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'ROOM_UPDATED' && event.data?.room?.code === activeRoomCode) {
          setRoom(event.data.room);
        }
      };
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (channel) channel.close();
    };
  }, [activeRoomCode, fetchRoomState]);

  // Find current player in the room
  const currentPlayer = room?.players.find(
    (p) =>
      p.userId === currentUser?.id ||
      p.username.toLowerCase() === (currentUser?.username || '').toLowerCase()
  );

  // 1. Create Room Handler
  const handleCreateRoom = async (gameType: GameType) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const newRoom = await gameApi.createGameRoom(gameType);
      setActiveRoomCode(newRoom.code);
      setRoom(newRoom);
      setShowCreateModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat room permainan.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Join Room Handler
  const handleJoinRoom = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await gameApi.joinGameRoom(cleanCode);
      setActiveRoomCode(res.room.code);
      setRoom(res.room);
      setShowJoinModal(false);
      setJoinCodeInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal bergabung ke room. Pastikan kode benar.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Toggle Ready
  const handleToggleReady = async () => {
    if (!activeRoomCode) return;
    try {
      const updated = await gameApi.toggleGameReady(activeRoomCode);
      setRoom(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status siap.');
    }
  };

  // 4. Update Settings
  const handleUpdateSettings = async (settings: any) => {
    if (!activeRoomCode) return;
    try {
      const updated = await gameApi.updateGameSettings(activeRoomCode, settings);
      setRoom(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui pengaturan.');
    }
  };

  // 5. Start Game
  const handleStartGame = async () => {
    if (!activeRoomCode) return;
    try {
      const started = await gameApi.startGame(activeRoomCode);
      setRoom(started);
    } catch (err: any) {
      alert(err.message || 'Gagal memulai permainan.');
    }
  };

  // 6. Advance Phase
  const handleAdvancePhase = async (targetPhase: string) => {
    if (!activeRoomCode) return;
    try {
      const next = await gameApi.advanceGamePhase(activeRoomCode, targetPhase);
      setRoom(next);
    } catch (err: any) {
      alert(err.message || 'Gagal berpindah fase.');
    }
  };

  // 7. Cast Vote
  const handleCastVote = async (targetPlayerId: string) => {
    if (!activeRoomCode) return;
    try {
      const voted = await gameApi.castGameVote(activeRoomCode, targetPlayerId);
      setRoom(voted);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim voting.');
    }
  };

  // 8. Submit Spy Guess
  const handleSubmitSpyGuess = async (guess: string) => {
    if (!activeRoomCode) return;
    try {
      const res = await gameApi.submitSpyGuess(activeRoomCode, guess);
      setRoom(res);
    } catch (err: any) {
      alert(err.message || 'Gagal menebak kata.');
    }
  };

  // 9. Submit Mafia Night Action
  const handleSubmitNightAction = async (
    actionType: 'mafia_kill' | 'doctor_heal' | 'detective_inspect',
    targetPlayerId: string
  ) => {
    if (!activeRoomCode) return;
    try {
      const res = await gameApi.submitMafiaNightAction(activeRoomCode, actionType, targetPlayerId);
      setRoom(res);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim aksi malam.');
    }
  };

  // 10. Send Chat
  const handleSendChat = async (text: string) => {
    if (!activeRoomCode) return;
    try {
      const res = await gameApi.sendGameChat(activeRoomCode, text);
      if (res?.room) setRoom(res.room);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim chat.');
    }
  };

  // 11. Restart Game
  const handleRestartGame = async () => {
    if (!activeRoomCode) return;
    try {
      const restarted = await gameApi.restartGame(activeRoomCode);
      setRoom(restarted);
    } catch (err: any) {
      alert(err.message || 'Gagal mengulang permainan.');
    }
  };

  // 12. Leave Room
  const handleLeaveRoom = async () => {
    if (!activeRoomCode) return;
    const confirm = window.confirm('Apakah Anda yakin ingin keluar dari room permainan?');
    if (!confirm) return;
    try {
      await gameApi.leaveGameRoom(activeRoomCode);
    } catch (_) {}
    setActiveRoomCode(null);
    setRoom(null);
  };

  // Render Active Room View if in a room
  if (activeRoomCode && room && currentPlayer) {
    if (room.status === 'waiting') {
      return (
        <>
          <GameLobbyView
            room={room}
            currentPlayer={currentPlayer}
            onToggleReady={handleToggleReady}
            onUpdateSettings={handleUpdateSettings}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onSendChat={handleSendChat}
            onOpenRules={() => {
              setRulesTab(room.gameType);
              setShowRulesModal(true);
            }}
          />
          <GameRulesModal
            isOpen={showRulesModal}
            onClose={() => setShowRulesModal(false)}
            defaultTab={rulesTab}
          />
        </>
      );
    }

    if (room.status === 'playing' || room.status === 'ended') {
      if (room.gameType === 'spy') {
        return (
          <>
            <SpyGameView
              room={room}
              currentPlayer={currentPlayer}
              onAdvancePhase={handleAdvancePhase}
              onCastVote={handleCastVote}
              onSubmitSpyGuess={handleSubmitSpyGuess}
              onSendChat={handleSendChat}
              onRestartGame={handleRestartGame}
              onLeaveRoom={handleLeaveRoom}
              onOpenRules={() => {
                setRulesTab('spy');
                setShowRulesModal(true);
              }}
            />
            <GameRulesModal
              isOpen={showRulesModal}
              onClose={() => setShowRulesModal(false)}
              defaultTab="spy"
            />
          </>
        );
      }

      if (room.gameType === 'mafia') {
        return (
          <>
            <MafiaGameView
              room={room}
              currentPlayer={currentPlayer}
              onAdvancePhase={handleAdvancePhase}
              onCastVote={handleCastVote}
              onSubmitNightAction={handleSubmitNightAction}
              onSendChat={handleSendChat}
              onRestartGame={handleRestartGame}
              onLeaveRoom={handleLeaveRoom}
              onOpenRules={() => {
                setRulesTab('mafia');
                setShowRulesModal(true);
              }}
            />
            <GameRulesModal
              isOpen={showRulesModal}
              onClose={() => setShowRulesModal(false)}
              defaultTab="mafia"
            />
          </>
        );
      }
    }
  }

  // Active Sub-game View Routers
  if (activeSelectedGame === 'abc') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
        <Abc5DasarView onBack={() => setActiveSelectedGame('hub')} />
      </div>
    );
  }
  if (activeSelectedGame === 'truth_dare') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
        <TruthOrDareView onBack={() => setActiveSelectedGame('hub')} />
      </div>
    );
  }
  if (activeSelectedGame === 'ular_tangga') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
        <UlarTanggaView onBack={() => setActiveSelectedGame('hub')} />
      </div>
    );
  }
  if (activeSelectedGame === 'sambung_kata') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
        <SambungKataView onBack={() => setActiveSelectedGame('hub')} />
      </div>
    );
  }
  if (activeSelectedGame === 'two_truths') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
        <TwoTruthsView onBack={() => setActiveSelectedGame('hub')} />
      </div>
    );
  }

  // DEFAULT VIEW: MAIN GAMES HUB MENU
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <button
            onClick={() => {
              setRulesTab('spy');
              setShowRulesModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 rounded-xl border border-emerald-800/60 text-xs font-bold transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Aturan Sekolah</span>
          </button>
        </div>

        {/* Hero Branding Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Menu Permainan Siswa TAMVESTA (Saat Jam Kosong)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Arena Permainan Edukatif & Santai
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Mainkan 7 permainan seru bersama teman saat waktu luang atau jam istirahat. Asah wawasan, konsentrasi, logika, dan sportivitas tanpa mengganggu kegiatan belajar mengajar (KBM).
            </p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <Gamepad2 className="w-64 h-64 text-emerald-400" />
          </div>
        </div>

        {/* ATURAN PENGGUNAAN DI SEKOLAH */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3.5 shadow-lg">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
              Tata Tertib & Aturan Penggunaan di Sekolah
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Fitur permainan ini hanya boleh dimainkan saat <strong>jam istirahat</strong> atau <strong>jam kosong</strong> yang diizinkan sekolah. Dilarang keras bermain saat guru sedang mengajar di kelas. Jaga ketertiban dan sportivitas!
            </p>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* DAFTAR 7 PERMAINAN LENGKAP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-emerald-400" />
              <span>Pilihan 7 Permainan Siswa</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">Solo • Berdua • Multiplayer</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. ABC 5 DASAR */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
                    ABC
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded-full border border-amber-800/60">
                    Solo • Berdua • Room
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                    1. ABC 5 Dasar
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Huruf acak A-Z untuk 5 kategori pilihan (Negara, Buah, Hewan, Makanan, Benda, Profesi, dll). Lengkapi jawaban sebelum waktu habis! Pemain kalah mendapatkan kartu Truth or Dare aman.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">11 Kategori</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Batas Waktu</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Truth/Dare Loser</span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setActiveSelectedGame('abc')}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Mulai Bermain ABC 5 Dasar ➔
                </button>
              </div>
            </div>

            {/* 2. TRUTH OR DARE */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-2xl">
                    🎲
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-950/80 text-purple-300 px-2.5 py-1 rounded-full border border-purple-800/60">
                    Solo • Berdua • Kelas
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">
                    2. Truth or Dare
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Pilih kejujuran santai (Truth) atau tantangan seru (Dare) yang aman, ramah sekolah, bebas dari perundungan atau permintaan kata sandi/privasi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Tantangan Aman</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Giliran Pemain</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Sopan & Edukatif</span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setActiveSelectedGame('truth_dare')}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Mulai Truth or Dare ➔
                </button>
              </div>
            </div>

            {/* 3. ULAR TANGGA */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-2xl">
                    🪜
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/60">
                    Solo Vs Bot • 1 - 4 Pemain
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                    3. Ular Tangga 100
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Papan petak bernomor 1 sampai 100 dengan dadu digital. Bidak bergerak sesuai hasil lemparan, panjat tangga naik dan hindari gigitan ular!
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Papan 1 - 100</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Dadu Digital</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Bidak Tersinkron</span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setActiveSelectedGame('ular_tangga')}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Mulai Ular Tangga ➔
                </button>
              </div>
            </div>

            {/* 4. SAMBUNG KATA */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-2xl">
                    💬
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-800/60">
                    Solo • Berdua • Room
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                    4. Sambung Kata
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Sistem memberikan kata awal. Sambung dengan kata baru yang diawali huruf terakhir kata sebelumnya dalam batas waktu 20 detik tanpa mengulang kata!
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Timer 20 Detik</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Rantai Kata</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Auto-Turn Switch</span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setActiveSelectedGame('sambung_kata')}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Mulai Sambung Kata ➔
                </button>
              </div>
            </div>

            {/* 5. TWO TRUTHS AND A LIE */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-2xl">
                    🎭
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-950/80 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-800/60">
                    Solo • Multiplayer
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">
                    5. Two Truths and a Lie
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Tiga pernyataan disajikan: dua benar dan satu bohong! Tebak mana pernyataan yang bohong, kumpulkan skor tebakan tepat, dan pelajari fakta ilmiahnya.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Sains & Fakta</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Tebak Kebohongan</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Skor & Riwayat</span>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setActiveSelectedGame('two_truths')}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98"
                >
                  Mulai Two Truths & a Lie ➔
                </button>
              </div>
            </div>

            {/* 6. WHO'S THE SPY */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-2xl">
                    <Search className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/60">
                    3 - 10 Pemain • Ruangan
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                    6. Who's the Spy
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Sistem membagikan kata rahasia secara privat. Impostor/Spy memegang kata berbeda yang berkaitan. Berikan petunjuk cerdas, diskusikan, dan lakukan voting tanpa moderator bot!
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Kata Rahasia Privat</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Voting Realtime</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Tanpa Bot Karakter</span>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleCreateRoom('spy')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Room Spy</span>
                </button>
                <button
                  onClick={() => {
                    setRulesTab('spy');
                    setShowRulesModal(true);
                  }}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  title="Aturan Spy"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 7. MAFIA */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-red-500/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-2xl">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-300 px-2.5 py-1 rounded-full border border-red-800/60">
                    4 - 15 Pemain • Ruangan Privat
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white group-hover:text-red-400 transition-colors">
                    7. Mafia (Ruangan Privat)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Peran rahasia: Mafia, Warga, Detektif, dan Dokter. Bergantian antara fase malam (aksi khusus rahasia) dan siang (diskusi & voting warga). Sistem mengelola aturan dan fase secara otomatis tanpa moderator bot karakter yang mengambil alih permainan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Fase Malam & Siang</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Peran Dokter & Detektif</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">Sistem Otomatis Netral</span>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleCreateRoom('mafia')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Room Mafia</span>
                </button>
                <button
                  onClick={() => {
                    setRulesTab('mafia');
                    setShowRulesModal(true);
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  title="Aturan Mafia"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Join by Code Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-950 rounded-xl border border-indigo-800 text-indigo-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Sudah Punya Kode Room?</h4>
              <p className="text-xs text-slate-400">
                Masukkan kode yang dibagikan teman (contoh: SPY-123 atau MFA-456).
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Ketik Kode Room..."
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono font-black text-white focus:outline-none focus:border-emerald-500 uppercase tracking-widest w-full sm:w-44 text-center"
            />
            <button
              disabled={loading || !joinCodeInput.trim()}
              onClick={() => handleJoinRoom(joinCodeInput)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
            >
              Gabung Room
            </button>
          </div>
        </div>

        {/* Available Waiting Rooms in School */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                Room Tersedia ({availableRooms.length})
              </h3>
            </div>
            <button
              onClick={loadAvailableRooms}
              disabled={refreshingList}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Segarkan Room"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {availableRooms.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-400 space-y-2">
              <p className="text-xs">Belum ada room permainan yang sedang menunggu pemain.</p>
              <p className="text-[11px] text-slate-500">
                Jadilah host dengan menekan tombol <strong>Buat Room</strong> di atas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRooms.map((r) => (
                <div
                  key={r.code}
                  className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${
                        r.gameType === 'spy'
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          : 'bg-red-950/80 border-red-800 text-red-400'
                      }`}
                    >
                      {r.gameType === 'spy' ? 'SPY' : 'MFA'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{r.code}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-semibold">
                          Host: @{r.hostUsername}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.players.length} Pemain Bergabung •{' '}
                        {r.gameType === 'spy' ? "Who's the Spy" : 'Mafia'}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleJoinRoom(r.code)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Masuk
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rules Modal */}
      <GameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        defaultTab={rulesTab}
      />
    </div>
  );
};
