import { useState, useCallback, useRef } from 'react';
import { GameState, FileObject, LogEntry, LiveUpdate, EngineResponse, INITIAL_FILES, GameMode } from '../types';
import { sendToEngine } from '../services/gemini';

// Since uuid is not in dependencies, we'll use a simple implementation
const simpleUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

interface UseGameEngineOptions {
    gameMode?: GameMode;
    multiplayerUserId?: string;
    multiplayerUsername?: string;
    onTurnComplete?: () => void;
}

export const useGameEngine = (options: UseGameEngineOptions = {}) => {
    const {
        gameMode = 'single',
        multiplayerUserId,
        multiplayerUsername,
        onTurnComplete
    } = options;

    const [gameState, setGameState] = useState<GameState>({
        isInitialized: false,
        isLoading: false,
        debugMode: false,
        worldTime: 0,
        files: INITIAL_FILES,
        history: [],
        liveUpdates: [],
        isPlayerDead: false,
    });

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const turnProcessingRef = useRef(false);

    const getPlayerFileName = useCallback(() => {
        if (gameMode === 'multiplayer' && multiplayerUsername) {
            return `Player_${multiplayerUsername}.txt`;
        }
        return 'Player.txt';
    }, [gameMode, multiplayerUsername]);

    const checkPlayerDeath = (files: Record<string, FileObject>): boolean => {
        const playerFileName = getPlayerFileName();
        const playerFile = files[playerFileName];

        if (!playerFile) return false;

        // Check if player file contains Health: 0 or status DEAD
        const content = playerFile.content;
        return content.includes('Health: 0') || content.includes('DEAD');
    };

    const handleInput = useCallback(async (userInput: string) => {
        if (!userInput.trim() || gameState.isLoading || gameState.isPlayerDead) return;

        // Prevent duplicate processing
        if (turnProcessingRef.current) return;
        turnProcessingRef.current = true;

        setGameState(prev => ({ ...prev, isLoading: true }));

        // Add user input to history
        const inputEntry: LogEntry = {
            id: simpleUuid(),
            type: 'INPUT',
            text: `> ${userInput}`,
            timestamp: Date.now(),
        };

        setGameState(prev => ({
            ...prev,
            history: [...prev.history, inputEntry],
        }));

        try {
            const response: EngineResponse = await sendToEngine(
                userInput,
                gameState.files,
                gameState.history,
                gameState.worldTime
            );

            // Process response
            const newFiles = { ...gameState.files };

            // Handle file updates
            response.fileUpdates?.forEach(update => {
                // If multiplayer and it's a player file, make sure it's for this player
                if (gameMode === 'multiplayer' && update.type === 'PLAYER') {
                    // Ensure player file has correct naming
                    if (!update.fileName.includes('_')) {
                        update.fileName = getPlayerFileName();
                    }
                }

                if (update.operation === 'DELETE') {
                    delete newFiles[update.fileName];
                } else {
                    newFiles[update.fileName] = {
                        name: update.fileName,
                        content: update.content,
                        type: update.type,
                        lastUpdated: gameState.worldTime + response.timeDelta,
                        isHidden: update.isHidden ?? false,
                    };
                }
            });

            // Handle initial time setup
            let newWorldTime = gameState.worldTime;
            if (response.initialTime && gameState.worldTime === 0) {
                newWorldTime = new Date(response.initialTime).getTime();
            } else if (response.timeDelta) {
                newWorldTime += response.timeDelta * 1000; // Convert seconds to ms
            }

            // Parse live updates
            const parsedLiveUpdates: LiveUpdate[] = response.liveUpdates?.map(update => ({
                id: simpleUuid(),
                text: update,
                type: update.startsWith('+') || update.includes('+')
                    ? 'POSITIVE'
                    : update.startsWith('-') || update.includes('-')
                        ? 'NEGATIVE'
                        : 'NEUTRAL',
            })) || [];

            // Add narrative to history
            const narrativeEntry: LogEntry = {
                id: simpleUuid(),
                type: 'NARRATIVE',
                text: response.narrative,
                timestamp: Date.now(),
            };

            // Check for player death
            const isDead = checkPlayerDeath(newFiles);

            setGameState(prev => ({
                ...prev,
                isInitialized: true,
                isLoading: false,
                worldTime: newWorldTime,
                files: newFiles,
                history: [...prev.history, narrativeEntry],
                liveUpdates: parsedLiveUpdates,
                isPlayerDead: isDead,
            }));

            // If player died, delete their file
            if (isDead && !gameState.isPlayerDead) {
                const playerFileName = getPlayerFileName();
                setGameState(prev => {
                    const updatedFiles = { ...prev.files };
                    delete updatedFiles[playerFileName];

                    return {
                        ...prev,
                        files: updatedFiles,
                        history: [
                            ...prev.history,
                            {
                                id: simpleUuid(),
                                type: 'ERROR',
                                text: 'You died! Reset for a new adventure.',
                                timestamp: Date.now(),
                            },
                        ],
                    };
                });
            }

            // Notify multiplayer turn complete
            if (onTurnComplete) {
                onTurnComplete();
            }

        } catch (error) {
            console.error('Engine error:', error);
            const errorEntry: LogEntry = {
                id: simpleUuid(),
                type: 'ERROR',
                text: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: Date.now(),
            };

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                history: [...prev.history, errorEntry],
            }));
        } finally {
            turnProcessingRef.current = false;
        }
    }, [gameState, gameMode, multiplayerUsername, onTurnComplete]);

    const resetGame = useCallback(() => {
        setGameState({
            isInitialized: false,
            isLoading: false,
            debugMode: gameState.debugMode, // Preserve debug mode
            worldTime: 0,
            files: INITIAL_FILES,
            history: [],
            liveUpdates: [],
            isPlayerDead: false,
        });
        setSelectedFile(null);
    }, [gameState.debugMode]);

    const toggleDebug = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            debugMode: !prev.debugMode,
        }));
    }, []);

    const inspectItem = useCallback((ref: string) => {
        // Extract file name from reference (format: [FileName])
        const fileName = ref.replace(/[\[\]]/g, '');
        setSelectedFile(fileName);
    }, []);

    return {
        gameState,
        handleInput,
        resetGame,
        toggleDebug,
        inspectItem,
        selectedFile,
        setSelectedFile,
        isPlayerDead: gameState.isPlayerDead,
    };
};
