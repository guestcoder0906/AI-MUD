import React from 'react';
import { GameMode, User } from '../types';

interface GameModeSelectorProps {
    onSelectMode: (mode: GameMode | 'join') => void;
    isAuthenticated: boolean;
    onSignIn: () => void;
    onSignOut: () => void;
    user: User | null;
    isLoading?: boolean;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
    onSelectMode,
    isAuthenticated,
    onSignIn,
    onSignOut,
    user,
    isLoading = false,
}) => {
    return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-terminal-black to-[#050505]">
            <div className="max-w-2xl w-full mx-4 space-y-6">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-terminal-green mb-4 tracking-wider animate-fade-in">
                        AI-MUD ENGINE
                    </h1>
                    <p className="text-terminal-lightGray text-lg animate-fade-in">
                        Choose your reality simulation mode
                    </p>
                    {isAuthenticated && user && (
                        <p className="text-terminal-amber text-sm mt-2">
                            Logged in as: <span className="font-bold">{user.username}</span>
                        </p>
                    )}
                </div>

                <div className="grid gap-4">
                    {/* Single Player */}
                    <button
                        onClick={() => onSelectMode('single')}
                        className="group bg-terminal-gray/10 hover:bg-terminal-green/10 border-2 border-terminal-gray hover:border-terminal-green p-8 rounded-lg transition-all duration-300 text-left"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-terminal-green mb-2 group-hover:text-terminal-green tracking-wide">
                                    SINGLE PLAYER
                                </h3>
                                <p className="text-terminal-lightGray text-sm mb-3">
                                    Embark on a solo adventure. No login required.
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-terminal-gray">
                                    <span className="px-2 py-1 bg-terminal-green/20 rounded border border-terminal-green/50">OFFLINE</span>
                                    <span className="px-2 py-1 bg-terminal-gray/20 rounded border border-terminal-gray">INSTANT</span>
                                </div>
                            </div>
                            <svg className="w-8 h-8 text-terminal-green opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </button>

                    {/* Host Multiplayer */}
                    <button
                        onClick={() => isAuthenticated ? onSelectMode('multiplayer') : onSignIn()}
                        disabled={isLoading}
                        className={`group bg-terminal-gray/10 hover:bg-terminal-amber/10 border-2 border-terminal-gray hover:border-terminal-amber p-8 rounded-lg transition-all duration-300 text-left ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-terminal-amber mb-2 group-hover:text-terminal-amber tracking-wide">
                                    {isLoading ? 'CREATING...' : 'HOST MULTIPLAYER'}
                                </h3>
                                <p className="text-terminal-lightGray text-sm mb-3">
                                    {isLoading ? 'Establishing quantum link...' : 'Create a shared world. Get a code to invite others.'}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-terminal-gray">
                                    <span className="px-2 py-1 bg-terminal-amber/20 rounded border border-terminal-amber/50">ONLINE</span>
                                    {!isAuthenticated && <span className="px-2 py-1 bg-red-900/20 rounded border border-red-500 text-red-400">LOGIN REQUIRED</span>}
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="w-8 h-8 rounded-full border-2 border-terminal-amber border-t-transparent animate-spin"></div>
                            ) : (
                                <svg className="w-8 h-8 text-terminal-amber opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        </div>
                    </button>

                    {/* Join Multiplayer */}
                    <button
                        onClick={() => isAuthenticated ? onSelectMode('join') : onSignIn()}
                        className="group bg-terminal-gray/10 hover:bg-blue-500/10 border-2 border-terminal-gray hover:border-blue-500 p-8 rounded-lg transition-all duration-300 text-left"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-blue-400 tracking-wide">
                                    JOIN MULTIPLAYER
                                </h3>
                                <p className="text-terminal-lightGray text-sm mb-3">
                                    Enter a game code to join an existing adventure.
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-terminal-gray">
                                    <span className="px-2 py-1 bg-blue-500/20 rounded border border-blue-500/50">ONLINE</span>
                                    {!isAuthenticated && <span className="px-2 py-1 bg-red-900/20 rounded border border-red-500 text-red-400">LOGIN REQUIRED</span>}
                                </div>
                            </div>
                            <svg className="w-8 h-8 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </div>
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="text-center mt-8 p-4 bg-terminal-gray/10 border border-terminal-gray rounded">
                        <p className="text-terminal-lightGray text-sm mb-3">
                            Sign in with Google to play multiplayer
                        </p>
                        <button
                            onClick={onSignIn}
                            className="bg-terminal-green text-terminal-black font-bold py-2 px-6 rounded hover:bg-terminal-green/80 transition-colors uppercase tracking-wide text-sm"
                        >
                            Sign In with Google
                        </button>
                    </div>
                ) : (
                    <div className="text-center mt-8">
                        <button
                            onClick={onSignOut}
                            className="text-terminal-gray hover:text-terminal-lightGray text-sm underline"
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
