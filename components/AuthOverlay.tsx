
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthOverlay: React.FC = () => {
    const { user, username, isGuest, signInAsGuest, updateUsername, loading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setError(null);
        try {
            await updateUsername(newUsername.trim());
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update username');
        }
    };

    if (loading) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-terminal-green font-mono">
                <div className="animate-pulse">Initializing Neural Link...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 text-terminal-green font-mono">
                <div className="max-w-md w-full p-8 border border-terminal-green/30 bg-terminal-black shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                    <h1 className="text-2xl font-bold mb-6 text-center tracking-widest text-terminal-amber">OMNISCRIPT ENGINE</h1>
                    <div className="space-y-4">
                        <p className="text-sm text-terminal-lightGray text-center mb-8">
                            "Reality is a construct. Verification required."
                        </p>

                        <button
                            onClick={signInAsGuest}
                            className="w-full py-3 border border-terminal-green hover:bg-terminal-green/10 text-terminal-green transition-all duration-200 uppercase tracking-wider font-bold"
                        >
                            Enter as Guest Interface
                        </button>

                        <p className="text-xs text-center text-terminal-gray mt-4">
                            *Full account registration disabled for this terminal session.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50">
            {!isEditing ? (
                <div
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer group flex items-center space-x-2 bg-black/80 border border-terminal-gray/50 px-3 py-1.5 rounded hover:border-terminal-amber transition-all"
                >
                    <div className={`w-2 h-2 rounded-full ${isGuest ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
                    <span className="text-xs text-terminal-lightGray font-mono group-hover:text-terminal-amber">
                        {username || 'Unknown'} {isGuest && '(GUEST)'}
                    </span>
                </div>
            ) : (
                <div className="bg-black border border-terminal-green p-3 rounded shadow-lg min-w-[200px]">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder={username || "Set Identity"}
                            className="w-full bg-terminal-gray/10 border border-terminal-gray px-2 py-1 text-xs text-terminal-green focus:border-terminal-green outline-none mb-2"
                            autoFocus
                        />
                        {error && <div className="text-[10px] text-red-500 mb-2">{error}</div>}
                        <div className="flex space-x-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="text-[10px] text-terminal-gray hover:text-white uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="text-[10px] text-terminal-green hover:text-white uppercase font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
