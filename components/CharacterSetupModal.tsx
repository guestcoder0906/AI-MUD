
import React, { useState } from 'react';

interface CharacterSetupModalProps {
    onComplete: (description: string) => void;
}

export const CharacterSetupModal: React.FC<CharacterSetupModalProps> = ({ onComplete }) => {
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim().length > 5) {
            onComplete(description);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-terminal-black border border-terminal-green p-6 w-full max-w-md shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-terminal-green to-transparent opacity-50"></div>

                <div className="text-terminal-green font-bold mb-4 text-xs tracking-[0.2em] uppercase text-center border-b border-terminal-green/30 pb-2">
                    Identity Required
                </div>

                <p className="text-terminal-lightGray text-sm font-mono mb-6 text-center leading-relaxed">
                    The simulation has already begun. You must define your physical and mental parameters to materialize within this reality.
                </p>

                <form onSubmit={handleSubmit}>
                    <textarea
                        autoFocus
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your character (e.g., 'A rogue hacker with a cybernetic eye and a grudge against the system')..."
                        className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-3 text-terminal-green outline-none focus:border-terminal-green/50 mb-6 font-mono text-sm h-32 resize-none placeholder:opacity-30"
                    />

                    <button
                        type="submit"
                        disabled={description.length <= 5}
                        className="w-full bg-terminal-green/10 border border-terminal-green text-terminal-green py-3 text-xs font-bold hover:bg-terminal-green hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        Materialize
                    </button>
                </form>
            </div>
        </div>
    );
};
