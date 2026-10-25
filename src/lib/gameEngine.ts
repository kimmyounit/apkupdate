import type {
  GameRoom,
  GamePlayer,
  GameType,
  SpySettings,
  MafiaSettings,
  SpyPhase,
  MafiaPhase,
} from '../types/game.ts';
import type { User } from '../types/index.ts';
import { getRandomSpyWordPair } from '../constants/spyWords.ts';

// Helper to generate 6-character room codes (e.g. SPY-482, MFA-917)
export function generateRoomCode(gameType: GameType): string {
  const prefix = gameType === 'spy' ? 'SPY' : 'MFA';
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randNum}`;
}

export const DEFAULT_SPY_SETTINGS: SpySettings = {
  playerCount: 4,
  spyCount: 1,
  category: 'campuran',
  clueDuration: 30,
  discussionDuration: 60,
  votingDuration: 30,
  allowSpyGuess: true,
  tieRule: 'no_elimination',
};

export const DEFAULT_MAFIA_SETTINGS: MafiaSettings = {
  playerCount: 5,
  mafiaCount: 1,
  doctorCount: 1,
  detectiveCount: 1,
  nightDuration: 30,
  discussionDuration: 60,
  votingDuration: 30,
  tieRule: 'no_elimination',
};

/**
 * Buat Room Baru
 */
export function createGameRoom(
  hostUser: User,
  gameType: GameType,
  customSpySettings?: Partial<SpySettings>,
  customMafiaSettings?: Partial<MafiaSettings>
): GameRoom {
  const now = Date.now();
  const roomCode = generateRoomCode(gameType);
  const hostPlayerId = `p_${hostUser.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const hostPlayer: GamePlayer = {
    id: hostPlayerId,
    userId: hostUser.id,
    username: hostUser.username,
    name: hostUser.name,
    kelas: hostUser.kelas,
    avatarUrl: hostUser.avatarUrl,
    isHost: true,
    isReady: true,
    isAlive: true,
    joinedAt: now,
    lastSeenAt: now,
  };

  return {
    id: `room_${now}_${Math.random().toString(36).substring(2, 7)}`,
    code: roomCode,
    gameType,
    hostId: hostUser.id,
    hostUsername: hostUser.username,
    status: 'waiting',
    phase: 'lobby',
    round: 1,
    players: [hostPlayer],
    spySettings: { ...DEFAULT_SPY_SETTINGS, ...(customSpySettings || {}) },
    mafiaSettings: { ...DEFAULT_MAFIA_SETTINGS, ...(customMafiaSettings || {}) },
    chatMessages: [
      {
        id: `msg_sys_${now}`,
        senderId: 'system',
        senderName: 'Sistem TAMVESTA',
        senderUsername: 'system',
        text: `Room ${roomCode} berhasil dibuat oleh ${hostUser.name}. Selamat bermain!`,
        timestamp: now,
        isSystem: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Bergabung ke Room atau Reconnect jika sudah terdaftar
 */
export function joinOrReconnectRoom(room: GameRoom, user: User): { room: GameRoom; player: GamePlayer } {
  const now = Date.now();
  const cleanU = user.username.toLowerCase().trim();

  // Cek apakah pemain sudah ada sebelumnya (Reconnect logic)
  const existingIndex = room.players.findIndex(
    (p) => p.userId === user.id || p.username.toLowerCase() === cleanU
  );

  if (existingIndex !== -1) {
    // Reconnect: Pertahankan peran rahasia dan status hidup, hanya update timestamp
    const existingPlayer = room.players[existingIndex];
    const updatedPlayer: GamePlayer = {
      ...existingPlayer,
      avatarUrl: user.avatarUrl || existingPlayer.avatarUrl,
      lastSeenAt: now,
      name: user.name || existingPlayer.name,
      kelas: user.kelas || existingPlayer.kelas,
    };

    const newPlayers = [...room.players];
    newPlayers[existingIndex] = updatedPlayer;

    return {
      room: {
        ...room,
        players: newPlayers,
        updatedAt: now,
      },
      player: updatedPlayer,
    };
  }

  // Jika permainan sudah berjalan dan pemain baru mau masuk, masuk sebagai penonton (Spectator)
  const isGameRunning = room.status === 'playing';
  const playerId = `p_${cleanU.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

  const newPlayer: GamePlayer = {
    id: playerId,
    userId: user.id,
    username: user.username,
    name: user.name,
    kelas: user.kelas,
    avatarUrl: user.avatarUrl,
    isHost: false,
    isReady: isGameRunning ? false : false,
    isAlive: !isGameRunning,
    isSpectator: isGameRunning,
    joinedAt: now,
    lastSeenAt: now,
  };

  const updatedRoom: GameRoom = {
    ...room,
    players: [...room.players, newPlayer],
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_join_${now}`,
        senderId: 'system',
        senderName: 'Sistem TAMVESTA',
        senderUsername: 'system',
        text: `${user.name} (@${user.username}) bergabung ke room.`,
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };

  return { room: updatedRoom, player: newPlayer };
}

/**
 * Mulai Permainan Who's the Spy
 */
export function startSpyGame(room: GameRoom): GameRoom {
  const now = Date.now();
  const activePlayers = room.players.filter((p) => !p.isSpectator);
  const minRequired = Math.max(3, room.spySettings.playerCount || 3);

  if (activePlayers.length < 3) {
    throw new Error('Who\'s the Spy membutuhkan minimal 3 pemain untuk memulai.');
  }

  // Pilih pasangan kata rahasia
  const wordPair = getRandomSpyWordPair(room.spySettings.category);

  // Acak siapa yang menjadi Imposter
  const numSpies = Math.min(room.spySettings.spyCount || 1, Math.floor(activePlayers.length / 2));
  const shuffledIndices = activePlayers.map((_, i) => i).sort(() => Math.random() - 0.5);
  const spyIndices = new Set(shuffledIndices.slice(0, numSpies));

  const updatedPlayers = room.players.map((p, idx) => {
    if (p.isSpectator) return p;
    const isSpy = spyIndices.has(idx);
    return {
      ...p,
      role: isSpy ? ('spy' as const) : ('civilian' as const),
      secretWord: isSpy ? wordPair.spy : wordPair.civilian,
      isAlive: true,
      voteTargetId: null,
      eliminatedAtRound: undefined,
      eliminationReason: undefined,
    };
  });

  return {
    ...room,
    status: 'playing',
    phase: 'word_reveal',
    round: 1,
    civilianWord: wordPair.civilian,
    spyWord: wordPair.spy,
    categoryUsed: wordPair.category,
    activeCluePlayerIndex: 0,
    players: updatedPlayers,
    votes: {},
    voteTally: {},
    winner: null,
    winReason: undefined,
    spyGuessResult: null,
    phaseDurationSeconds: 15,
    phaseEndTime: now + 15 * 1000,
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_start_${now}`,
        senderId: 'system',
        senderName: 'Moderator TAMVESTA',
        senderUsername: 'system',
        text: 'Permainan Who\'s the Spy dimulai! Kata rahasia telah dibagikan secara privat. Silakan lihat kata Anda tanpa memperlihatkannya ke teman.',
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Mulai Permainan Mafia dengan Moderator Otomatis
 */
export function startMafiaGame(room: GameRoom): GameRoom {
  const now = Date.now();
  const activePlayers = room.players.filter((p) => !p.isSpectator);

  if (activePlayers.length < 4) {
    throw new Error('Mafia membutuhkan minimal 4 pemain untuk memulai.');
  }

  const { mafiaCount, doctorCount, detectiveCount } = room.mafiaSettings;
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);

  let mCount = Math.max(1, mafiaCount);
  let docCount = doctorCount > 0 ? 1 : 0;
  let detCount = detectiveCount > 0 ? 1 : 0;

  // Pastikan jumlah mafia tidak melebihi setengah pemain
  if (mCount >= Math.floor(activePlayers.length / 2)) {
    mCount = 1;
  }

  const roleAssignments: Record<string, 'mafia' | 'doctor' | 'detective' | 'villager'> = {};

  // Assign Mafia
  for (let i = 0; i < mCount; i++) {
    roleAssignments[shuffled[i].id] = 'mafia';
  }
  let curIdx = mCount;

  // Assign Doctor
  if (docCount > 0 && curIdx < shuffled.length) {
    roleAssignments[shuffled[curIdx].id] = 'doctor';
    curIdx++;
  }

  // Assign Detective
  if (detCount > 0 && curIdx < shuffled.length) {
    roleAssignments[shuffled[curIdx].id] = 'detective';
    curIdx++;
  }

  // Sisanya adalah Warga Kota (Villager)
  for (let i = curIdx; i < shuffled.length; i++) {
    roleAssignments[shuffled[i].id] = 'villager';
  }

  const updatedPlayers = room.players.map((p) => {
    if (p.isSpectator) return p;
    const role = roleAssignments[p.id] || 'villager';
    return {
      ...p,
      role,
      isAlive: true,
      voteTargetId: null,
      nightTargetId: null,
      eliminatedAtRound: undefined,
      eliminationReason: undefined,
    };
  });

  return {
    ...room,
    status: 'playing',
    phase: 'role_reveal',
    round: 1,
    players: updatedPlayers,
    nightActions: {
      mafiaVotes: {},
      doctorTargetId: null,
      detectiveTargetId: null,
      detectiveResult: null,
    },
    nightVictimId: null,
    savedByDoctor: false,
    votes: {},
    voteTally: {},
    winner: null,
    winReason: undefined,
    phaseDurationSeconds: 15,
    phaseEndTime: now + 15 * 1000,
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_mafia_start_${now}`,
        senderId: 'system',
        senderName: 'Moderator TAMVESTA',
        senderUsername: 'system',
        text: 'Permainan Mafia dimulai! Peran rahasia telah dibagikan. Pastikan layar HP Anda terlindungi dari pandangan pemain lain.',
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Tally Votes dan Evaluasi Eliminasi Who's the Spy
 */
export function evaluateSpyVoting(room: GameRoom): GameRoom {
  const now = Date.now();
  const votes = room.votes || {};
  const tally: Record<string, number> = {};

  // Hitung suara
  Object.values(votes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  let maxVotes = 0;
  let topTargetId: string | null = null;
  let isTie = false;

  Object.entries(tally).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topTargetId = targetId;
      isTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  });

  // Jika hasil seri
  if (isTie || !topTargetId || maxVotes === 0) {
    return {
      ...room,
      phase: 'vote_result',
      lastEliminatedPlayerId: null,
      wasTieVote: true,
      votes,
      voteTally: tally,
      chatMessages: [
        ...room.chatMessages,
        {
          id: `msg_tie_${now}`,
          senderId: 'system',
          senderName: 'Moderator TAMVESTA',
          senderUsername: 'system',
          text: 'Hasil voting seri! Tidak ada pemain yang dieliminasi pada putaran ini.',
          timestamp: now,
          isSystem: true,
        },
      ],
      updatedAt: now,
    };
  }

  // Ada pemain tereliminasi
  const eliminatedPlayer = room.players.find((p) => p.id === topTargetId);
  const isSpyEliminated = eliminatedPlayer?.role === 'spy';

  const updatedPlayers = room.players.map((p) =>
    p.id === topTargetId
      ? { ...p, isAlive: false, eliminatedAtRound: room.round, eliminationReason: 'Voting Terbanyak' }
      : p
  );

  // Periksa kondisi kemenangan
  const alivePlayers = updatedPlayers.filter((p) => p.isAlive && !p.isSpectator);
  const aliveSpies = alivePlayers.filter((p) => p.role === 'spy');
  const aliveCivilians = alivePlayers.filter((p) => p.role === 'civilian');

  let winner: 'civilians' | 'spies' | null = null;
  let winReason = '';

  if (aliveSpies.length === 0) {
    winner = 'civilians';
    winReason = 'Seluruh Imposter berhasil ditemukan dan dieliminasi oleh Pemain Biasa!';
  } else if (aliveSpies.length >= aliveCivilians.length) {
    winner = 'spies';
    winReason = 'Imposter berhasil menyamar dan jumlahnya menyamai pemain biasa!';
  }

  // Jika imposter tereliminasi tapi opsi tebak kata aktif
  const nextPhase: SpyPhase =
    winner && room.spySettings.allowSpyGuess && isSpyEliminated
      ? 'spy_guess'
      : winner
      ? 'ended'
      : 'vote_result';

  return {
    ...room,
    phase: nextPhase,
    status: winner && nextPhase === 'ended' ? 'ended' : room.status,
    winner: nextPhase === 'spy_guess' ? null : winner,
    winReason,
    players: updatedPlayers,
    lastEliminatedPlayerId: topTargetId,
    lastEliminatedPlayerRole: eliminatedPlayer?.role,
    wasTieVote: false,
    votes,
    voteTally: tally,
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_elim_${now}`,
        senderId: 'system',
        senderName: 'Moderator TAMVESTA',
        senderUsername: 'system',
        text: `${eliminatedPlayer?.name} mendapatkan suara terbanyak (${maxVotes} suara) dan tereliminasi! Perannya adalah: ${
          isSpyEliminated ? '🕵️ IMPOSTER' : '👤 PEMAIN BIASA'
        }.`,
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Evaluasi Fase Malam Mafia (Diproses Otomatis oleh Moderator Sistem)
 */
export function evaluateMafiaNight(room: GameRoom): GameRoom {
  const now = Date.now();
  const nightActions = room.nightActions || {};
  const mafiaVotes = nightActions.mafiaVotes || {};
  const doctorTargetId = nightActions.doctorTargetId;
  const detectiveTargetId = nightActions.detectiveTargetId;

  // Hitung target mafia
  const tally: Record<string, number> = {};
  Object.values(mafiaVotes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  let topMafiaTarget: string | null = null;
  let maxVotes = 0;
  Object.entries(tally).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topMafiaTarget = targetId;
    }
  });

  // Evaluasi penyelamatan dokter
  const isSaved = Boolean(topMafiaTarget && doctorTargetId && topMafiaTarget === doctorTargetId);
  const victimId = isSaved ? null : topMafiaTarget;

  // Evaluasi pemeriksaan detektif
  let detectiveResult = null;
  if (detectiveTargetId) {
    const inspected = room.players.find((p) => p.id === detectiveTargetId);
    if (inspected) {
      detectiveResult = {
        targetId: inspected.id,
        targetName: inspected.name,
        isMafia: inspected.role === 'mafia',
      };
    }
  }

  // Update status korban
  const updatedPlayers = room.players.map((p) => {
    if (victimId && p.id === victimId) {
      return {
        ...p,
        isAlive: false,
        eliminatedAtRound: room.round,
        eliminationReason: 'Dibunuh oleh Mafia',
      };
    }
    return p;
  });

  const victimPlayer = victimId ? room.players.find((p) => p.id === victimId) : null;

  // Periksa kondisi kemenangan setelah malam
  const alivePlayers = updatedPlayers.filter((p) => p.isAlive && !p.isSpectator);
  const aliveMafia = alivePlayers.filter((p) => p.role === 'mafia');
  const aliveNonMafia = alivePlayers.filter((p) => p.role !== 'mafia');

  let winner: 'villagers' | 'mafia' | null = null;
  let winReason = '';

  if (aliveMafia.length === 0) {
    winner = 'villagers';
    winReason = 'Warga Kota Menang! Seluruh anggota Mafia berhasil disingkirkan.';
  } else if (aliveMafia.length >= aliveNonMafia.length) {
    winner = 'mafia';
    winReason = 'Mafia Menang! Jumlah Mafia telah menyamai atau melebihi jumlah warga kota yang masih hidup.';
  }

  const announcementText = isSaved
    ? '🌅 Pagi telah tiba! Kabar gembira: Dokter berhasil menyelamatkan korban malam ini, tidak ada korban jiwa!'
    : victimPlayer
    ? `🌅 Pagi telah tiba dengan duka. ${victimPlayer.name} (@${victimPlayer.username}) ditemukan tewas dibunuh oleh Mafia tadi malam!`
    : '🌅 Pagi telah tiba! Malam berlalu dengan damai dan tidak ada korban jiwa.';

  return {
    ...room,
    phase: winner ? 'ended' : 'day_announcement',
    status: winner ? 'ended' : room.status,
    winner,
    winReason,
    players: updatedPlayers,
    nightVictimId: victimId,
    savedByDoctor: isSaved,
    nightActions: {
      ...nightActions,
      detectiveResult,
    },
    votes: {},
    voteTally: {},
    phaseDurationSeconds: room.mafiaSettings.discussionDuration || 60,
    phaseEndTime: now + (room.mafiaSettings.discussionDuration || 60) * 1000,
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_night_result_${now}`,
        senderId: 'system',
        senderName: 'Moderator TAMVESTA',
        senderUsername: 'system',
        text: announcementText,
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };
}

/**
 * Evaluasi Voting Siang Hari Mafia
 */
export function evaluateMafiaVoting(room: GameRoom): GameRoom {
  const now = Date.now();
  const votes = room.votes || {};
  const tally: Record<string, number> = {};

  Object.values(votes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  let maxVotes = 0;
  let topTargetId: string | null = null;
  let isTie = false;

  Object.entries(tally).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topTargetId = targetId;
      isTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  });

  if (isTie || !topTargetId || maxVotes === 0) {
    return {
      ...room,
      phase: 'vote_result',
      lastEliminatedPlayerId: null,
      wasTieVote: true,
      votes,
      voteTally: tally,
      chatMessages: [
        ...room.chatMessages,
        {
          id: `msg_mafia_tie_${now}`,
          senderId: 'system',
          senderName: 'Moderator TAMVESTA',
          senderUsername: 'system',
          text: 'Hasil voting warga seri! Tidak ada tersangka yang dieliminasi hari ini.',
          timestamp: now,
          isSystem: true,
        },
      ],
      updatedAt: now,
    };
  }

  const eliminated = room.players.find((p) => p.id === topTargetId);
  const updatedPlayers = room.players.map((p) =>
    p.id === topTargetId
      ? { ...p, isAlive: false, eliminatedAtRound: room.round, eliminationReason: 'Voting Warga Kota' }
      : p
  );

  const alivePlayers = updatedPlayers.filter((p) => p.isAlive && !p.isSpectator);
  const aliveMafia = alivePlayers.filter((p) => p.role === 'mafia');
  const aliveNonMafia = alivePlayers.filter((p) => p.role !== 'mafia');

  let winner: 'villagers' | 'mafia' | null = null;
  let winReason = '';

  if (aliveMafia.length === 0) {
    winner = 'villagers';
    winReason = 'Warga Kota Menang! Seluruh anggota Mafia berhasil dieliminasi.';
  } else if (aliveMafia.length >= aliveNonMafia.length) {
    winner = 'mafia';
    winReason = 'Mafia Menang! Jumlah anggota Mafia telah menguasai mayoritas kota.';
  }

  return {
    ...room,
    phase: winner ? 'ended' : 'vote_result',
    status: winner ? 'ended' : room.status,
    winner,
    winReason,
    players: updatedPlayers,
    lastEliminatedPlayerId: topTargetId,
    lastEliminatedPlayerRole: eliminated?.role,
    wasTieVote: false,
    votes,
    voteTally: tally,
    chatMessages: [
      ...room.chatMessages,
      {
        id: `msg_mafia_elim_${now}`,
        senderId: 'system',
        senderName: 'Moderator TAMVESTA',
        senderUsername: 'system',
        text: `Warga kota sepakat mengeliminasi ${eliminated?.name} (${maxVotes} suara). Peran aslinya adalah: ${
          eliminated?.role === 'mafia'
            ? '🔴 MAFIA'
            : eliminated?.role === 'doctor'
            ? '💉 DOKTER'
            : eliminated?.role === 'detective'
            ? '🔍 DETEKTIF'
            : '👤 WARGA KOTA'
        }!`,
        timestamp: now,
        isSystem: true,
      },
    ],
    updatedAt: now,
  };
}
