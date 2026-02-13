import { useState, useEffect } from 'react';
import { supabase, signInWithGoogle, signOut } from '../supabase/client';
import { User } from '../types';
import { generateRandomUsername, validateUsername } from '../utils/username';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UseAuthReturn {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    needsUsername: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    setUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
    skipUsername: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsUsername, setNeedsUsername] = useState(false);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            console.log('=== Initializing Auth ===');

            // INSTANT: Load cached user profile from localStorage first
            const cachedUser = localStorage.getItem('user_profile');
            if (cachedUser) {
                try {
                    const parsed = JSON.parse(cachedUser);
                    console.log('✅ Loaded cached profile instantly:', parsed.username);
                    setUser(parsed);
                    setIsLoading(false);
                } catch (e) {
                    console.error('Cache parse error:', e);
                }
            }

            // Get existing session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error('Session check error:', error);
                setIsLoading(false);
                return;
            }

            if (session?.user) {
                console.log('✅ Found Supabase session for:', session.user.email);
                setSupabaseUser(session.user);

                // If we don't have cached user, or want to refresh, load from DB
                if (!cachedUser) {
                    await loadUserProfile(session.user.id);
                } else {
                    // Refresh in background (optional)
                    loadUserProfile(session.user.id, true);
                }
            } else {
                console.log('ℹ️ No existing session');
                // Clear cache if no session
                localStorage.removeItem('user_profile');
                setUser(null);
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes - but ONLY for explicit sign in/out
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('🔔 Auth event:', event);

            // ONLY handle explicit sign in and sign out - ignore everything else
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ User signed in:', session.user.email);
                setSupabaseUser(session.user);
                await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 User explicitly signed out');
                localStorage.removeItem('user_profile');
                setUser(null);
                setSupabaseUser(null);
                setNeedsUsername(false);
                setIsLoading(false);
            }
            // Ignore TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED, etc.
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error checking session:', error);
                setIsLoading(false);
                return;
            }

            if (session?.user) {
                console.log('Found existing session for user:', session.user.id);
                setSupabaseUser(session.user);
                await loadUserProfile(session.user.id);
            } else {
                console.log('No existing session found');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            setIsLoading(false);
        }
    };

    const loadUserProfile = async (userId: string, isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) {
            console.log('📋 Loading user profile for:', userId);
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // User doesn't have a profile yet
                if (error.code === 'PGRST116') {
                    console.log('⚠️ No profile found - user needs to create username');
                    localStorage.removeItem('user_profile');
                    setNeedsUsername(true);
                    setUser(null);
                    setIsLoading(false);
                } else {
                    console.error('❌ Profile load error:', error);
                    // Keep cached user if available, just log error
                    if (!isBackgroundRefresh) {
                        setIsLoading(false);
                    }
                }
            } else {
                console.log('✅ Profile loaded:', data.username);
                // Cache in localStorage for instant load next time
                localStorage.setItem('user_profile', JSON.stringify(data));
                setUser(data);
                setNeedsUsername(false);
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Unexpected error loading profile:', error);
            // Keep cached user if available
            if (!isBackgroundRefresh) {
                setIsLoading(false);
            }
        }
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Error signing in:', error);
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        console.log('🚪 Logging out user...');
        setIsLoading(true);
        try {
            await signOut();
            localStorage.removeItem('user_profile');
            setUser(null);
            setSupabaseUser(null);
            setNeedsUsername(false);
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('❌ Error signing out:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
        if (!supabaseUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const validation = validateUsername(username);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .insert({
                    id: supabaseUser.id,
                    username: username.trim(),
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Username already taken' };
                }
                throw error;
            }

            // Cache immediately
            localStorage.setItem('user_profile', JSON.stringify(data));
            setUser(data);
            setNeedsUsername(false);
            return { success: true };
        } catch (error) {
            console.error('Error setting username:', error);
            return { success: false, error: 'Failed to set username' };
        }
    };

    const handleSkipUsername = async () => {
        if (!supabaseUser) return;

        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const randomUsername = generateRandomUsername();
            const result = await handleSetUsername(randomUsername);

            if (result.success) {
                return;
            }

            attempts++;
        }

        console.error('Failed to generate unique username after max attempts');
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        needsUsername,
        signIn: handleSignIn,
        signOut: handleSignOut,
        setUsername: handleSetUsername,
        skipUsername: handleSkipUsername,
    };
};
