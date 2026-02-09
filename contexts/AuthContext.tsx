import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    username: string | null;
    isGuest: boolean;
    signInAsGuest: () => Promise<void>;
    updateUsername: (name: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADJECTIVES = ['Silent', 'Wandering', 'Lost', 'Brave', 'Digital', 'Cipher', 'Neon', 'Echo'];
const NOUNS = ['Traveler', 'Drifter', 'Hacker', 'Signal', 'Ghost', 'User', 'Operator', 'Byte'];

const generateRandomUsername = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${num}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setIsGuest(session.user.is_anonymous || false);
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(session.user.is_anonymous || false);
                fetchProfile(session.user.id);
            } else {
                setUsername(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();

            if (data) {
                setUsername(data.username);
            } else if (!data && !error) {
                // Profile doesn't exist yet, create one
                const newUsername = generateRandomUsername();
                await updateUsername(newUsername);
            }
        } catch (e) {
            console.error('Error fetching profile:', e);
        } finally {
            setLoading(false);
        }
    };

    const signInAsGuest = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;

            if (data.user) {
                const newUsername = generateRandomUsername();
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    username: newUsername,
                    is_guest: true
                });
                setUsername(newUsername);
            }
        } catch (error) {
            console.error('Error signing in anonymously:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUsername = async (name: string) => {
        if (!user) return;
        try {
            // Validate uniqueness
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', name)
                .neq('id', user.id) // check if anyone ELSE has this name
                .single();

            if (existing) {
                throw new Error('Username already taken');
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: name,
                    is_guest: isGuest,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setUsername(name);
        } catch (error) {
            console.error('Error updating username:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, username, isGuest, signInAsGuest, updateUsername, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
