import { useState, useCallback, useEffect } from 'react';
import { GameState, LogEntry, FileObject, INITIAL_FILES, EngineResponse } from '../types';
import { sendToEngine } from '../services/gemini';
import { multiplayerService, GameStateSync, Participant } from '../services/MultiplayerService';
import { useAuth } from '../contexts/AuthContext';
import { parseContentForUser } from '../utils/contentParser';

const LOCAL_STORAGE_KEY = 'ai-mud_save_v1';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    isInitialized: false,
    isLoading: false,
    debugMode: false,
    worldTime: 0,
    files: INITIAL_FILES,
    history: [],
    liveUpdates: [],
  });

  const { user, username } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [waitingForTurn, setWaitingForTurn] = useState(false);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState({ ...parsed, debugMode: parsed.debugMode || false });
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  useEffect(() => {
    if (gameState.isInitialized) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

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

      const newEntry: LogEntry = {
        id: crypto.randomUUID(),
        text: response.narrative,
        type: 'NARRATIVE',
        timestamp: Date.now(),
      };

      const newState = {
        ...prev,
        isInitialized: true,
        isLoading: false,
        worldTime: prev.worldTime + response.timeDelta,
        files: newFiles,
        history: [...prev.history, newEntry],
        liveUpdates: [...newLiveUpdates, ...prev.liveUpdates].slice(0, 50),
      };

      // If Host, sync state to DB
      if (isMultiplayer && roomId) {
        multiplayerService.updateGameState(roomId, {
          world_time: newState.worldTime,
          files: newState.files,
          history: newState.history,
          turn_context: { active_turn: newState.worldTime, actions_submitted: [] } // Reset turn
        });
      }

      return newState;
    });
  };

  // Multiplayer State Sync
  useEffect(() => {
    if (roomId) {
      setIsMultiplayer(true);
      multiplayerService.subscribeToRoom(
        roomId,
        (syncState) => {
          // Received new game state from server
          setGameState(prev => ({
            ...prev,
            worldTime: syncState.world_time,
            files: syncState.files,
            history: syncState.history,
            isLoading: false // If we received a state, we are done waiting
          }));
          setWaitingForTurn(false);
        },
        (updatedParticipants) => {
          setParticipants(updatedParticipants);

          // Check if we are Host and everyone is ready
          if (updatedParticipants.length > 0 && user?.id === updatedParticipants[0].user_id) { // Simple Host check: first user
            const activePlayers = updatedParticipants.filter(p => p.is_active);
            const allsubmitted = activePlayers.every(p => p.status === 'submitted_action');

            if (allsubmitted && activePlayers.length > 0 && waitingForTurn) {
              // Trigger AI Turn!
              // We need to aggregate inputs? Or just process the last one? 
              // The prompt says "waits for all players to submit and then game continues accuratly".
              // Ideally we'd send ALL inputs. For now let's just trigger a "Turn Resolution".
              // TODO: enhance sendToEngine to take multiple inputs. 
              // For this step, we just assume the last input triggers it, but we need to fetch all inputs.
              // We'll trust the engine to process based on state. 
            }
          }
        }
      );
    }
  }, [roomId, user, waitingForTurn]);

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

    if (isMultiplayer) {
      setWaitingForTurn(true);
      await multiplayerService.submitAction(input);
      // We wait for the subscription to update us
    } else {
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
    }
  }, [gameState.files, gameState.history, gameState.worldTime, isMultiplayer, roomId]);

  // Apply user-specific filtering to the exposed state
  const filesForUser = Object.fromEntries(
    Object.entries(gameState.files).map(([k, v]) => [
      k,
      { ...v, content: parseContentForUser(v.content, username) }
    ])
  );

  const historyForUser = gameState.history.map(h => ({
    ...h,
    text: parseContentForUser(h.text, username)
  }));

  const exposedState = {
    ...gameState,
    files: filesForUser,
    history: historyForUser
  };

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

  return {
    gameState: exposedState,
    handleInput,
    toggleDebug,
    inspectItem,
    selectedFile,
    setSelectedFile,
    error,
    resetGame,
    isPlayerDead,
    multiplayer: {
      createRoom: async () => {
        if (!user) return;
        const room = await multiplayerService.createRoom(user.id);
        if (room) {
          setRoomId(room.id);
          setIsMultiplayer(true);
        }
      },
      joinRoom: async (code: string) => {
        if (!user) return;
        const rid = await multiplayerService.joinRoom(code, user.id);
        if (rid) {
          setRoomId(rid);
          setIsMultiplayer(true);
        }
      },
      kickPlayer: multiplayerService.kickPlayer.bind(multiplayerService),
      participants,
      isMultiplayer,
      roomId,
      waitingForTurn
    }
  };
};