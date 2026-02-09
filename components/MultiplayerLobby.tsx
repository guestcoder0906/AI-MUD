
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Participant } from '../services/MultiplayerService';

interface MultiplayerLobbyProps {
    onCreateRoom: () => void;
    onJoinRoom: (code: string) => void;
    onKickPlayer: (userId: string) => void;
    participants: Participant[];
    roomId: string | null;
    isMultiplayer: boolean;
    waitingForTurn: boolean;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
    onCreateRoom,
    onJoinRoom,
    onKickPlayer,
    participants,
    roomId,
    isMultiplayer,
    waitingForTurn
}) => {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [showLobby, setShowLobby] = useState(false);

    if (!user) return null;

    // If we are in a game, show a compact status
    if (isMultiplayer && roomId) {
        const isHost = participants.length > 0 && participants[0].user_id === user.id;

        return (
            <div className="fixed top-12 left-0 right-0 z-40 bg-black/80 border-b border-terminal-gray p-2 px-4 flex justify-between items-center text-xs backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                    <span className="text-terminal-amber font-bold">MULTIPLAYER SESSION</span>
                    <span className="hidden sm:inline text-terminal-gray">
                        Players: {participants.length}
                    </span>
                    {waitingForTurn && (
                        <span className="text-yellow-500 animate-pulse font-bold">WAITING FOR OTHERS...</span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowLobby(!showLobby)}
                        className="border border-terminal-green text-terminal-green px-2 py-1 hover:bg-terminal-green/20"
                    >
                        {showLobby ? 'Hide Roster' : 'Show Roster'}
                    </button>
                </div>

                {showLobby && (
                    <div className="absolute top-10 right-4 w-64 bg-terminal-black border border-terminal-green shadow-xl p-4 rounded">
                        <h3 className="text-terminal-green font-bold mb-2">PARTICIPANTS</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {participants.map(p => (
                                <div key={p.user_id} className="flex justify-between items-center bg-terminal-gray/10 p-2 rounded">
                                    <div>
                                        <div className="text-terminal-lightGray font-mono">{p.username}</div>
                                        <div className={`text-[10px] ${p.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                            {p.status} {p.user_id === user.id && '(YOU)'}
                                        </div>
                                    </div>
                                    {isHost && p.user_id !== user.id && (
                                        <button
                                            onClick={() => onKickPlayer(p.user_id)}
                                            className="text-red-500 hover:text-red-300 text-[10px] border border-red-900 px-1"
                                        >
                                            KICK
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {roomId && ( // We actually need the short code here, but useGameEngine only provided ID...
                            // TODO: Fix this. For now just show "Room Active"
                            <div className="mt-4 pt-2 border-t border-terminal-gray text-[10px] text-center text-terminal-gray">
                                Share the Room Code from your URL (Implement URL param later)
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Lobby Entrance
    return (
        <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-terminal-black/90 border border-terminal-gray p-2 rounded shadow-lg backdrop-blur-sm">
                {!showLobby ? (
                    <button
                        onClick={() => setShowLobby(true)}
                        className="text-terminal-green text-xs font-bold px-2 py-1 hover:bg-terminal-green/10"
                    >
                        MULTIPLAYER LOBBY
                    </button>
                ) : (
                    <div className="p-2 w-64">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-terminal-green font-bold text-sm">CONNECTION</span>
                            <button onClick={() => setShowLobby(false)} className="text-terminal-gray">✕</button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={onCreateRoom}
                                className="w-full bg-terminal-green/20 border border-terminal-green text-terminal-green py-2 text-xs font-bold hover:bg-terminal-green/40"
                            >
                                CREATE NEW REALITY
                            </button>

                            <div className="flex items-center space-x-2">
                                <div className="h-px bg-terminal-gray flex-1"></div>
                                <span className="text-terminal-gray text-[10px]">OR</span>
                                <div className="h-px bg-terminal-gray flex-1"></div>
                            </div>

                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="CODE"
                                    className="bg-black border border-terminal-gray text-terminal-green text-xs p-2 w-20 text-center uppercase"
                                    maxLength={6}
                                />
                                <button
                                    onClick={() => onJoinRoom(joinCode)}
                                    className="flex-1 bg-terminal-gray/20 border border-terminal-gray text-terminal-lightGray text-xs hover:border-terminal-green hover:text-terminal-green"
                                >
                                    JOIN UPLINK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
