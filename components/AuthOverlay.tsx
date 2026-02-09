
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthOverlayProps {
    onLogin: (user: any) => void;
    onGuest: () => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin, onGuest }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                onLogin(session.user);
            }
        };
        checkSession();
    }, [onLogin]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Sign Up
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username || `User_${Math.floor(Math.random() * 10000)}`,
                        },
                    },
                });
                if (error) throw error;
                if (data.user) {
                    // Use sign up automatically logs you in if email confirmation is disabled, 
                    // otherwise prompts for confirmation. Assuming auto-confirm or ignoring for now.
                    onLogin(data.user);
                }
            } else {
                // Login
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.user) {
                    onLogin(data.user);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-terminal-black border border-terminal-green rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                <h2 className="text-2xl font-bold text-terminal-green mb-6 text-center tracking-widest uppercase">
                    {isSignUp ? 'Initialize User Identity' : 'Authenticate Access'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-500 text-sm rounded">
                        ERROR: {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-terminal-lightGray text-xs uppercase mb-1">Email Coordinates</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-2 text-terminal-green focus:border-terminal-green focus:outline-none"
                            placeholder="user@net.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-terminal-lightGray text-xs uppercase mb-1">Passcode Sequence</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-2 text-terminal-green focus:border-terminal-green focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {isSignUp && (
                        <div>
                            <label className="block text-terminal-lightGray text-xs uppercase mb-1">Display Alias (Optional)</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-2 text-terminal-green focus:border-terminal-green focus:outline-none"
                                placeholder="Unique_ID"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-terminal-green text-terminal-black font-bold py-2 rounded hover:bg-green-400 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'REGISTER ENTITY' : 'ESTABLISH LINK')}
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center space-y-3">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-terminal-lightGray hover:text-terminal-green text-sm underline decoration-terminal-gray hover:decoration-terminal-green underline-offset-4"
                    >
                        {isSignUp ? 'Provide existing credentials' : 'Create new identity record'}
                    </button>

                    <div className="w-full border-t border-terminal-gray/50"></div>

                    <button
                        onClick={onGuest}
                        className="text-terminal-amber text-xs uppercase tracking-wider hover:text-yellow-300 transition-colors"
                    >
                        [ Initiate Guest Protocol (Local Storage Only) ]
                    </button>
                </div>
            </div>
        </div>
    );
};
