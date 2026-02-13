import React, { useState } from 'react';
import { GamePlayer } from '../types';

interface MultiplayerUIProps {
    gameCode: string;
    players: GamePlayer[];
    isHost: boolean;
    onKickPlayer: (playerId: string) => void;
    onForceNextTurn: () => void;
    onDeleteGame: () => void;
    onLeaveGame: () => void;
    waitingForPlayers: boolean;
    activePlayers: number;
    totalPlayers: number;
}

export const MultiplayerUI: React.FC<MultiplayerUIProps> = ({
    gameCode,
    players,
    isHost,
    onKickPlayer,
    onForceNextTurn,
    onDeleteGame,
    onLeaveGame,
    waitingForPlayers,
    activePlayers,
    totalPlayers,
}) => {
    const [confirmKick, setConfirmKick] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleKick = (playerId: string) => {
        setConfirmKick(playerId);
    };

    const confirmKickAction = () => {
        if (confirmKick) {
            onKickPlayer(confirmKick);
            setConfirmKick(null);
        }
    };

    const confirmDeleteAction = () => {
        onDeleteGame();
        setConfirmDelete(false);
    };

    return (
        <div className="border-b border-terminal-gray bg-terminal-black/90 p-2 space-y-2">
            {/* Game Code Display */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="text-terminal-lightGray text-[10px] uppercase tracking-wide">Game Code:</div>
                    <div className="bg-terminal-amber/20 border border-terminal-amber px-3 py-1 rounded">
                        <span className="text-terminal-amber font-bold text-lg tracking-widest">{gameCode}</span>
                    </div>
                </div>

                {/* Turn Status */}
                {waitingForPlayers && (
                    <div className="flex items-center space-x-2 text-terminal-amber text-[10px]">
                        <div className="w-1.5 h-1.5 bg-terminal-amber rounded-full animate-pulse"></div>
                        <span>Waiting for {totalPlayers - activePlayers} player(s)...</span>
                    </div>
                )}
            </div>

            {/* Players List */}
            <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-terminal-lightGray text-[10px] uppercase">Players:</span>
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`flex items-center space-x-2 px-2 py-0.5 rounded border text-xs ${player.is_dead
                            ? 'bg-red-900/20 border-red-500 text-red-400'
                            : player.is_active
                                ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                                : 'bg-terminal-gray/20 border-terminal-gray text-terminal-gray'
                            }`}
                    >
                        <span className="font-mono">{player.username}</span>

                        {player.is_dead && <span className="text-[10px]">☠</span>}
                        {!player.is_active && !player.is_dead && <span className="text-[10px]">⏸</span>}

                        {isHost && player.user_id !== players.find(p => p.id === player.id)?.user_id && (
                            <button
                                onClick={() => handleKick(player.id)}
                                className="text-red-500 hover:text-red-400 text-[10px] ml-1"
                                title="Kick player"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Host Controls */}
            {isHost && (
                <div className="flex items-center space-x-2 pt-1 border-t border-terminal-gray/50">
                    <span className="text-terminal-amber text-[10px] font-bold uppercase mr-2">Host:</span>

                    <button
                        onClick={onForceNextTurn}
                        className="text-[10px] bg-terminal-amber/20 text-terminal-amber border border-terminal-amber px-2 py-0.5 rounded hover:bg-terminal-amber/30 transition-colors uppercase tracking-wide"
                    >
                        Force Turn
                    </button>

                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-[10px] bg-red-900/20 text-red-400 border border-red-500 px-2 py-0.5 rounded hover:bg-red-900/30 transition-colors uppercase tracking-wide"
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* Non-host leave button */}
            {!isHost && (
                <div className="pt-1 border-t border-terminal-gray/50">
                    <button
                        onClick={onLeaveGame}
                        className="text-[10px] bg-terminal-gray/20 text-terminal-lightGray border border-terminal-gray px-2 py-0.5 rounded hover:bg-terminal-gray/30 transition-colors uppercase tracking-wide"
                    >
                        Leave Game
                    </button>
                </div>
            )}

            {/* Kick Confirmation Modal */}
            {confirmKick && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-terminal-black border-2 border-red-500 p-6 rounded-lg shadow-2xl max-w-md">
                        <h3 className="text-red-400 font-bold mb-2">Kick Player?</h3>
                        <p className="text-terminal-lightGray text-sm mb-4">
                            This will remove the player and delete their character file. This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmKick(null)}
                                className="flex-1 bg-terminal-gray/20 text-terminal-lightGray font-bold py-2 px-4 rounded hover:bg-terminal-gray/30 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmKickAction}
                                className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition-colors"
                            >
                                Kick Player
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Game Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-terminal-black border-2 border-red-500 p-6 rounded-lg shadow-2xl max-w-md">
                        <h3 className="text-red-400 font-bold mb-2">Delete Adventure?</h3>
                        <p className="text-terminal-lightGray text-sm mb-4">
                            This will permanently end the game for all players. This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 bg-terminal-gray/20 text-terminal-lightGray font-bold py-2 px-4 rounded hover:bg-terminal-gray/30 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAction}
                                className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition-colors"
                            >
                                Delete Adventure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
