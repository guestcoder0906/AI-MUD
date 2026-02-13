import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { Game, GamePlayer, User, GameStatus } from '../types';
import { generateGameCode } from '../utils/username';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseMultiplayerReturn {
    currentGame: Game | null;
    players: GamePlayer[];
    isHost: boolean;
    isLoading: boolean;
    createGame: () => Promise<{ success: boolean; error?: string }>;
    joinGame: (code: string) => Promise<{ success: boolean; error?: string }>;
    leaveGame: () => Promise<void>;
    deleteGame: () => Promise<void>;
    kickPlayer: (playerId: string) => Promise<void>;
    forceNextTurn: () => void;
    updatePlayerActivity: (isActive: boolean) => Promise<void>;
    markTurnSubmitted: (submitted: boolean) => Promise<void>;
    markCharacterCreated: () => Promise<void>;
    markPlayerDead: (isDead: boolean) => Promise<void>;
}

export const useMultiplayer = (user: User | null): UseMultiplayerReturn => {
    const [currentGame, setCurrentGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<GamePlayer[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Track page visibility for activity status
    useEffect(() => {
        if (!currentGame || !user) return;

        let isActive = true;

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';

            // Only mark inactive if hidden for more than a few seconds
            if (!isVisible) {
                // Delay marking as inactive
                setTimeout(() => {
                    if (document.visibilityState === 'hidden') {
                        console.log('Marking player as inactive after delay');
                        isActive = false;
                        updatePlayerActivity(false);
                    }
                }, 3000); // Wait 3 seconds before marking inactive
            } else {
                console.log('Player is active (page visible)');
                isActive = true;
                updatePlayerActivity(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set active when component mounts
        updatePlayerActivity(true);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Don't mark inactive on unmount - they might be refreshing
        };
    }, [currentGame, user]);

    // Subscribe to game updates
    useEffect(() => {
        if (!currentGame) {
            if (channel) {
                channel.unsubscribe();
                setChannel(null);
            }
            return;
        }

        console.log('Setting up real-time subscriptions for game:', currentGame.id);

        const gameChannel = supabase.channel(`game:${currentGame.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'games',
                    filter: `id=eq.${currentGame.id}`,
                },
                (payload) => {
                    console.log('Game update received:', payload);
                    if (payload.eventType === 'DELETE') {
                        // Game was deleted
                        handleGameDeleted();
                    } else if (payload.eventType === 'UPDATE') {
                        setCurrentGame(payload.new as Game);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_players',
                    filter: `game_id=eq.${currentGame.id}`,
                },
                (payload) => {
                    console.log('Player update received:', payload.eventType, payload);
                    // Reload players list on any change
                    loadPlayers(currentGame.id);
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        setChannel(gameChannel);

        // Load initial players
        loadPlayers(currentGame.id);

        // Check for host disconnection periodically
        const hostCheckInterval = setInterval(() => {
            checkHostStatus();
        }, 5000);

        return () => {
            console.log('Cleaning up subscriptions');
            gameChannel.unsubscribe();
            clearInterval(hostCheckInterval);
        };
    }, [currentGame?.id]);

    const loadPlayers = async (gameId: string) => {
        console.log('Loading players for game:', gameId);
        const { data, error } = await supabase
            .from('game_players')
            .select('*')
            .eq('game_id', gameId)
            .order('joined_at', { ascending: true });

        if (!error && data) {
            console.log('Players loaded:', data.length, 'players');
            setPlayers(data);
            // Force re-render
            setTimeout(() => setPlayers(data), 50);
        } else {
            console.error('Error loading players:', error);
        }
    };

    const checkHostStatus = async () => {
        if (!currentGame) return;

        const { data: game, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', currentGame.id)
            .single();

        if (error || !game) {
            // Game no longer exists
            handleGameDeleted();
            return;
        }

        // Check if host is still active
        const { data: hostPlayer } = await supabase
            .from('game_players')
            .select('*')
            .eq('game_id', currentGame.id)
            .eq('user_id', game.host_user_id)
            .single();

        if (hostPlayer && !hostPlayer.is_active && user?.id !== game.host_user_id) {
            // Host is inactive and we're not the host - delete game
            await handleHostDisconnect();
        }
    };

    const handleGameDeleted = () => {
        setCurrentGame(null);
        setPlayers([]);
        setIsHost(false);
        alert('Game has ended. The host has left.');
        // Force reload to reset state
        setTimeout(() => window.location.reload(), 100);
    };

    const handleHostDisconnect = async () => {
        if (!currentGame) return;

        // Delete the game
        await supabase
            .from('games')
            .delete()
            .eq('id', currentGame.id);

        handleGameDeleted();
    };

    const createGame = async (): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Not authenticated' };

        setIsLoading(true);
        try {
            // Generate unique code
            let code = generateGameCode();
            let attempts = 0;

            while (attempts < 10) {
                const { data: existing } = await supabase
                    .from('games')
                    .select('id')
                    .eq('code', code)
                    .single();

                if (!existing) break;

                code = generateGameCode();
                attempts++;
            }

            // Create game
            const { data: game, error: gameError } = await supabase
                .from('games')
                .insert({
                    code,
                    host_user_id: user.id,
                    status: 'waiting_for_world',
                })
                .select()
                .single();

            if (gameError) throw gameError;

            // Add creator as player
            const { error: playerError } = await supabase
                .from('game_players')
                .insert({
                    game_id: game.id,
                    user_id: user.id,
                    username: user.username,
                    is_active: true,
                });

            if (playerError) throw playerError;

            setCurrentGame(game);
            setIsHost(true);

            // Force a re-render
            setTimeout(() => {
                setCurrentGame(game);
                setIsHost(true);
            }, 100);

            return { success: true };
        } catch (error) {
            console.error('Error creating game:', error);
            return { success: false, error: 'Failed to create game' };
        } finally {
            setIsLoading(false);
        }
    };

    const joinGame = async (code: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            console.error('Join game failed: User not authenticated');
            return { success: false, error: 'Not authenticated' };
        }

        console.log('Attempting to join game with code:', code);
        setIsLoading(true);

        try {
            // Add timeout to prevent hanging
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            // Find game by code
            console.log('Querying games table...');
            const gameQuery = supabase
                .from('games')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            const { data: game, error: gameError } = await Promise.race([
                gameQuery,
                timeout
            ]) as any;

            console.log('Game lookup result:', { game, gameError });

            if (gameError) {
                console.error('Game lookup error:', gameError);

                // Check if it's a "not found" error vs other error
                if (gameError.code === 'PGRST116') {
                    return { success: false, error: 'Game not found. Check the code and try again.' };
                }

                // Other errors (like RLS or permission issues)
                return { success: false, error: `Database error: ${gameError.message}` };
            }

            if (!game) {
                return { success: false, error: 'Game not found. Check the code and try again.' };
            }

            console.log('Found game:', game);

            // Check if already in game
            console.log('Checking if player already in game...');
            const { data: existing, error: existingError } = await supabase
                .from('game_players')
                .select('*')
                .eq('game_id', game.id)
                .eq('user_id', user.id)
                .single();

            if (existingError && existingError.code !== 'PGRST116') {
                console.error('Error checking existing player:', existingError);
            }

            console.log('Existing player check:', existing);

            if (!existing) {
                // Add as player
                console.log('Adding player to game');
                const { error: playerError } = await supabase
                    .from('game_players')
                    .insert({
                        game_id: game.id,
                        user_id: user.id,
                        username: user.username,
                        is_active: true,
                    });

                if (playerError) {
                    console.error('Error adding player:', playerError);
                    return { success: false, error: `Failed to join: ${playerError.message}` };
                }
                console.log('Player added successfully');
            } else {
                console.log('Player already in game, rejoining');
            }

            setCurrentGame(game);
            setIsHost(game.host_user_id === user.id);

            // Force a re-render to ensure UI updates
            setTimeout(() => {
                setCurrentGame(game);
                setIsHost(game.host_user_id === user.id);
            }, 100);

            console.log('Successfully joined game:', game.code);
            return { success: true };
        } catch (error: any) {
            console.error('Error joining game:', error);

            if (error.message === 'Request timed out') {
                return {
                    success: false,
                    error: 'Connection timed out. Check that the database is set up correctly.'
                };
            }

            return { success: false, error: error.message || 'Failed to join game. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    };

    const leaveGame = async () => {
        if (!currentGame || !user) return;

        try {
            // Remove player from game
            await supabase
                .from('game_players')
                .delete()
                .eq('game_id', currentGame.id)
                .eq('user_id', user.id);

            // If host is leaving, delete the game
            if (isHost) {
                await supabase
                    .from('games')
                    .delete()
                    .eq('id', currentGame.id);
            }

            setCurrentGame(null);
            setPlayers([]);
            setIsHost(false);
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    };

    const deleteGame = async () => {
        if (!currentGame || !isHost) return;

        try {
            await supabase
                .from('games')
                .delete()
                .eq('id', currentGame.id);

            setCurrentGame(null);
            setPlayers([]);
            setIsHost(false);
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    const kickPlayer = async (playerId: string) => {
        if (!currentGame || !isHost) return;

        try {
            // Delete player's files
            const player = players.find(p => p.id === playerId);
            if (player) {
                await supabase
                    .from('player_files')
                    .delete()
                    .eq('game_id', currentGame.id)
                    .eq('user_id', player.user_id);
            }

            // Remove player
            await supabase
                .from('game_players')
                .delete()
                .eq('id', playerId);
        } catch (error) {
            console.error('Error kicking player:', error);
        }
    };

    const forceNextTurn = () => {
        // This will be handled by the game engine
        // Just reset all players' has_sent_turn status
        if (!currentGame || !isHost) return;

        players.forEach(async (player) => {
            await supabase
                .from('game_players')
                .update({ has_sent_turn: false })
                .eq('id', player.id);
        });
    };

    const updatePlayerActivity = async (isActive: boolean) => {
        if (!currentGame || !user) return;

        try {
            await supabase
                .from('game_players')
                .update({ is_active: isActive })
                .eq('game_id', currentGame.id)
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    };

    const markTurnSubmitted = async (submitted: boolean) => {
        if (!currentGame || !user) return;

        try {
            await supabase
                .from('game_players')
                .update({ has_sent_turn: submitted })
                .eq('game_id', currentGame.id)
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error marking turn:', error);
        }
    };

    const markCharacterCreated = async () => {
        if (!currentGame || !user) return;

        try {
            await supabase
                .from('game_players')
                .update({ character_created: true })
                .eq('game_id', currentGame.id)
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error marking character created:', error);
        }
    };

    const markPlayerDead = async (isDead: boolean) => {
        if (!currentGame || !user) return;

        try {
            await supabase
                .from('game_players')
                .update({ is_dead: isDead })
                .eq('game_id', currentGame.id)
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error marking player dead:', error);
        }
    };

    return {
        currentGame,
        players,
        isHost,
        isLoading,
        createGame,
        joinGame,
        leaveGame,
        deleteGame,
        kickPlayer,
        forceNextTurn,
        updatePlayerActivity,
        markTurnSubmitted,
        markCharacterCreated,
        markPlayerDead,
    };
};
