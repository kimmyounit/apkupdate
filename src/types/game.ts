export type GameType = 'spy' | 'mafia';
export type RoomStatus = 'waiting' | 'playing' | 'ended';

export type SpyCategory = 'sekolah' | 'hewan' | 'makanan' | 'tempat' | 'benda' | 'campuran';

export type SpyPhase =
  | 'lobby'
  | 'word_reveal'
  | 'clues'
  | 'discussion'
  | 'voting'
  | 'vote_result'
  | 'spy_guess'
  | 'ended';

export type MafiaPhase =
  | 'lobby'
  | 'role_reveal'
  | 'night'
  | 'day_announcement'
  | 'discussion'
  | 'voting'
  | 'vote_result'
  | 'ended';

export type GameRole =
  | 'civilian'
  | 'spy'
  | 'villager'
  | 'mafia'
  | 'doctor'
  | 'detective';

export interface GamePlayer {
  id: string; // unique player ID within room (e.g. p_username)
  userId: string;
  username: string;
  name: string;
  kelas?: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  role?: GameRole;
  secretWord?: string; // only populated for spy game
  voteTargetId?: string | null;
  nightTargetId?: string | null;
  eliminatedAtRound?: number;
  eliminationReason?: string;
  isSpectator?: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface SpySettings {
  playerCount: number;
  spyCount: number;
  category: SpyCategory;
  clueDuration: number; // in seconds
  discussionDuration: number; // in seconds
  votingDuration: number; // in seconds
  allowSpyGuess: boolean;
  tieRule: 'no_elimination' | 'revote';
}

export interface MafiaSettings {
  playerCount: number;
  mafiaCount: number;
  doctorCount: number;
  detectiveCount: number;
  nightDuration: number; // in seconds
  discussionDuration: number; // in seconds
  votingDuration: number; // in seconds
  tieRule: 'no_elimination' | 'revote';
}

export interface GameChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameRoom {
  id: string;
  code: string; // e.g. "SPY-812" or "MFA-305"
  gameType: GameType;
  hostId: string;
  hostUsername: string;
  status: RoomStatus;
  phase: string;
  round: number;
  players: GamePlayer[];
  spySettings: SpySettings;
  mafiaSettings: MafiaSettings;

  // Who's the Spy specific state
  civilianWord?: string;
  spyWord?: string;
  categoryUsed?: SpyCategory;
  activeCluePlayerIndex?: number;
  spyGuessResult?: {
    guess: string;
    isCorrect: boolean;
    spyName: string;
  } | null;

  // Mafia specific state
  nightActions?: {
    mafiaVotes?: Record<string, string>; // mafiaPlayerId -> targetPlayerId
    doctorTargetId?: string | null;
    detectiveTargetId?: string | null;
    detectiveResult?: {
      targetId: string;
      targetName: string;
      isMafia: boolean;
    } | null;
  };
  nightVictimId?: string | null;
  savedByDoctor?: boolean;

  // Voting state (both games)
  votes?: Record<string, string>; // voterPlayerId -> targetPlayerId
  voteTally?: Record<string, number>;
  lastEliminatedPlayerId?: string | null;
  lastEliminatedPlayerRole?: string | null;
  wasTieVote?: boolean;

  // Win state
  winner?: 'civilians' | 'spies' | 'villagers' | 'mafia' | null;
  winReason?: string;

  // Timers & Sync
  phaseEndTime?: number; // timestamp in ms
  phaseDurationSeconds?: number;

  chatMessages: GameChatMessage[];
  createdAt: number;
  updatedAt: number;
}
