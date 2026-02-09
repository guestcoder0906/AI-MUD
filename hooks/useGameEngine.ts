import { useState, useCallback, useEffect } from 'react';
import { GameState, LogEntry, FileObject, INITIAL_FILES, EngineResponse } from '../types';
import { sendToEngine } from '../services/gemini';
import { supabase } from '../lib/supabaseClient';

const LOCAL_STORAGE_KEY = 'omniscript_save_v2';

export const useGameEngine = (user?: any) => {
  const [gameState, setGameState] = useState<GameState>({
    isInitialized: false,
    isLoading: false,
    debugMode: false,
    worldTime: 0,
    files: INITIAL_FILES,
    history: [],
    liveUpdates: [],
  });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Game State
  useEffect(() => {
    const loadGame = async () => {
      if (user) {
        // Load from Supabase
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('saves')
          .select('state')
          .eq('user_id', user.id)
          .single();

        if (data?.state) {
          setGameState(prev => ({ ...data.state, isLoading: false }));
        } else if (!error) {
          // No save found, try local storage or default
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setGameState({ ...parsed, debugMode: parsed.debugMode || false });
            } catch (e) { }
          }
        }
        setIsSyncing(false);
      } else {
        // Load from Local Storage
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setGameState({ ...parsed, debugMode: parsed.debugMode || false });
          } catch (e) {
            console.error("Failed to load save", e);
          }
        }
      }
    };
    loadGame();
  }, [user]);

  // Save Game State
  useEffect(() => {
    if (!gameState.isInitialized) return;

    // Always save to local storage as backup/fast access
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));

    // If logged in, save to Supabase (debounced/throttled effectively by effect)
    if (user) {
      const saveToCloud = async () => {
        await supabase.from('saves').upsert({
          user_id: user.id,
          state: gameState,
          updated_at: new Date().toISOString()
        });
      };
      // Simple debounce could be added here if updates are too frequent
      const timeout = setTimeout(saveToCloud, 2000);
      return () => clearTimeout(timeout);
    }
  }, [gameState, user]);

  const addLog = (text: string, type: LogEntry['type']) => {
    setGameState(prev => ({
      ...prev,
      history: [
        ...prev.history,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          text,
          type,
        },
      ],
    }));
  };

  const processResponse = (response: EngineResponse) => {
    setGameState(prev => {
      const newFiles = { ...prev.files };

      response.fileUpdates.forEach(update => {
        if (update.operation === 'DELETE') {
          delete newFiles[update.fileName];
        } else {
          // Preserve existing isHidden state if not explicitly provided in update
          const existingFile = newFiles[update.fileName];
          const isHidden = update.isHidden !== undefined
            ? update.isHidden
            : (existingFile ? existingFile.isHidden : false);

          newFiles[update.fileName] = {
            name: update.fileName,
            content: update.content,
            type: update.type,
            lastUpdated: prev.worldTime + response.timeDelta,
            isHidden: isHidden,
          };
        }
      });

      const newLiveUpdates = response.liveUpdates.map(text => ({
        id: crypto.randomUUID(),
        text,
        type: text.includes('-') ? 'NEGATIVE' : text.includes('+') ? 'POSITIVE' : 'NEUTRAL' as any,
      }));

      const newHistory = [
        ...prev.history,
        {
          id: crypto.randomUUID(),
          text: response.narrative,
          type: 'NARRATIVE' as const,
          timestamp: Date.now(),
        },
      ];

      return {
        ...prev,
        isInitialized: true,
        isLoading: false,
        worldTime: prev.worldTime + response.timeDelta,
        files: newFiles,
        history: newHistory,
        liveUpdates: [...newLiveUpdates, ...prev.liveUpdates].slice(0, 50),
      };
    });
  };

  const handleInput = useCallback(async (input: string) => {
    if (!input.trim()) return;

    // Check if player is dead
    const playerFile = gameState.files['Player.txt'];
    const isDead = playerFile && (
      playerFile.content.toLowerCase().includes('status: dead') ||
      playerFile.content.toLowerCase().includes('health: 0')
    );

    if (isDead) {
      addLog(`FATAL: ACCESS DENIED. PLAYER STATUS: DECEASED.`, 'ERROR');
      return;
    }

    setGameState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    addLog(`> ${input}`, 'INPUT');

    try {
      const response = await sendToEngine(
        input,
        gameState.files,
        gameState.history,
        gameState.worldTime
      );
      processResponse(response);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      addLog(`System Error: ${err.message}`, 'ERROR');
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, [gameState.files, gameState.history, gameState.worldTime]);

  const isPlayerDead =
    gameState.files['Player.txt'] && (
      gameState.files['Player.txt'].content.toLowerCase().includes('status: dead') ||
      gameState.files['Player.txt'].content.toLowerCase().includes('health: 0')
    );

  const toggleDebug = () => {
    setGameState(prev => ({ ...prev, debugMode: !prev.debugMode }));
  };

  const inspectItem = (referenceName: string) => {
    const cleanName = referenceName.replace(/[\[\]]/g, '').split('(')[0];
    const foundFile = (Object.values(gameState.files) as FileObject[]).find(f =>
      f.name.includes(cleanName) || cleanName.includes(f.name.replace('.txt', ''))
    );

    // If we click a reference, we likely want to see it even if hidden, 
    // but the system rules usually reveal it before linking. 
    // We force debug mode to allow inspection of "under the hood" mechanics.
    setGameState(prev => ({ ...prev, debugMode: true }));
    if (foundFile) {
      setSelectedFile(foundFile.name);
    }
  };

  const resetGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setGameState({
      isInitialized: false,
      isLoading: false,
      debugMode: false,
      worldTime: 0,
      files: INITIAL_FILES,
      history: [],
      liveUpdates: [],
    });
    window.location.reload();
  };

  // Expose setGameState for Multiplayer
  return {
    gameState,
    setGameState,
    handleInput,
    toggleDebug,
    inspectItem,
    selectedFile,
    setSelectedFile,
    error,
    resetGame,
    isPlayerDead,
    isSyncing
  };
};