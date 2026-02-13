import React, { useState } from 'react';

interface AuthModalProps {
    isOpen: boolean;
    onSetUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
    onSkip: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSetUsername, onSkip }) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await onSetUsername(username);

        if (!result.success) {
            setError(result.error || 'Failed to set username');
            setIsLoading(false);
        }
        // If success, the modal will close via parent state change
    };

    const handleSkip = async () => {
        setIsLoading(true);
        await onSkip();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-terminal-black border-2 border-terminal-green p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-slide-up">
                <h2 className="text-2xl font-bold text-terminal-green mb-2 tracking-wider">WELCOME TO AI-MUD</h2>
                <p className="text-terminal-lightGray text-sm mb-6">Choose a username to begin your adventure</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-terminal-green text-sm font-bold mb-2 uppercase tracking-wide">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username..."
                            className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-3 text-terminal-green focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green placeholder-terminal-gray/50 transition-all"
                            disabled={isLoading}
                            autoFocus
                            maxLength={20}
                        />
                        <p className="text-terminal-gray text-xs mt-1">3-20 characters, letters, numbers, and underscores only</p>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading || !username.trim()}
                            className="flex-1 bg-terminal-green text-terminal-black font-bold py-3 px-4 rounded hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                        >
                            {isLoading ? 'Setting...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={isLoading}
                            className="flex-1 bg-terminal-gray/20 text-terminal-lightGray font-bold py-3 px-4 rounded hover:bg-terminal-gray/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-terminal-gray"
                        >
                            {isLoading ? 'Generating...' : 'Random Name'}
                        </button>
                    </div>
                </form>

                <p className="text-terminal-gray text-xs mt-6 text-center">
                    Your username will be visible to other players in multiplayer games
                </p>
            </div>
        </div>
    );
};
