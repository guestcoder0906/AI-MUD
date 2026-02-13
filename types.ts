export interface FileObject {
  name: string;
  content: string;
  type: 'SYSTEM' | 'PLAYER' | 'LOCATION' | 'ITEM' | 'GUIDE' | 'NPC';
  lastUpdated: number; // World time timestamp
  isHidden: boolean; // Controls visibility to the player
}

export interface LogEntry {
  id: string;
  type: 'NARRATIVE' | 'SYSTEM' | 'ERROR' | 'INPUT';
  text: string;
  timestamp: number;
}

export interface LiveUpdate {
  id: string;
  text: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface GameState {
  isInitialized: boolean;
  isLoading: boolean;
  debugMode: boolean; // Controls visibility of system files
  worldTime: number; // Seconds
  files: Record<string, FileObject>;
  history: LogEntry[];
  liveUpdates: LiveUpdate[];
  isPlayerDead: boolean;
}

export interface EngineResponse {
  narrative: string;
  liveUpdates: string[]; // Strings to be parsed into LiveUpdate objects
  fileUpdates: {
    fileName: string;
    content: string;
    type: 'SYSTEM' | 'PLAYER' | 'LOCATION' | 'ITEM' | 'GUIDE' | 'NPC';
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    isHidden?: boolean;
  }[];
  timeDelta: number;
  initialTime?: string;
}


export const INITIAL_FILES: Record<string, FileObject> = {
  'Guide.txt': {
    name: 'Guide.txt',
    content: 'System Initializing... Waiting for world parameters.',
    type: 'GUIDE',
    lastUpdated: 0,
    isHidden: false,
  },
};

// Multiplayer Types
export interface User {
  id: string;
  username: string;
  created_at?: string;
}

export type GameStatus = 'waiting_for_world' | 'waiting_for_characters' | 'active' | 'ended';

export interface Game {
  id: string;
  code: string;
  host_user_id: string;
  world_description: string | null;
  world_time: number;
  status: GameStatus;
  created_at?: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  username: string;
  is_active: boolean;
  has_sent_turn: boolean;
  character_created: boolean;
  is_dead: boolean;
  joined_at?: string;
}

export type GameMode = 'single' | 'multiplayer';

export interface MultiplayerGameState extends GameState {
  gameMode: GameMode;
  currentGame: Game | null;
  currentUser: User | null;
  players: GamePlayer[];
  isHost: boolean;
  currentTurnNumber: number;
}

declare global {
  // Fix: Define AIStudio interface to match the type expected by the environment
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Use AIStudio type to avoid "Subsequent property declarations must have the same type" error
    aistudio?: AIStudio;
  }
}