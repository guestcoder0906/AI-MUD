import React, { useState } from 'react';

interface JoinGameModalProps {
    isOpen: boolean;
    onJoin: (code: string) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({ isOpen, onJoin, onCancel }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (code.trim().length !== 6) {
            setError('Game code must be 6 characters');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const result = await onJoin(code.trim().toUpperCase());

            if (!result.success) {
                setError(result.error || 'Failed to join game');
                setIsLoading(false);
            }
            // If successful, the modal will close via parent component
        } catch (err) {
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().slice(0, 6);
        setCode(value);
        setError(null);
    };

    const handleClose = () => {
        setCode('');
        setError(null);
        setIsLoading(false);
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-terminal-black border-2 border-blue-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-slide-up">
                <h2 className="text-2xl font-bold text-blue-400 mb-4 tracking-wide">JOIN MULTIPLAYER</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-terminal-lightGray text-sm mb-2">
                            Enter 6-character game code:
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            placeholder="ABC123"
                            className="w-full bg-terminal-gray/20 border-2 border-terminal-gray focus:border-blue-500 rounded p-3 text-blue-400 font-bold text-2xl tracking-widest text-center uppercase focus:outline-none transition-colors"
                            maxLength={6}
                            autoFocus
                            disabled={isLoading}
                        />
                        <p className="text-terminal-gray text-xs mt-1 text-center">
                            {code.length}/6 characters
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 bg-terminal-gray/20 text-terminal-lightGray border border-terminal-gray py-2 px-4 rounded hover:bg-terminal-gray/30 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={code.length !== 6 || isLoading}
                            className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Joining...' : 'Join Game'}
                        </button>
                    </div>
                </form>

                <p className="text-terminal-gray text-xs mt-4 text-center">
                    Ask the host for the game code
                </p>
            </div>
        </div>
    );
};
