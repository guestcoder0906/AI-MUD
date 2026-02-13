import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxdovjbwktuaaolzjijd.supabase.co';
const supabaseAnonKey = 'sb_publishable_iAxQdLMtg8z2MvNsQPuhxQ_XIGqQGQe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Persist session across page reloads
        persistSession: true,
        // Use local storage for session persistence
        storage: window.localStorage,
        // Automatically refresh expired tokens
        autoRefreshToken: true,
        // Detect session in URL after OAuth redirect
        detectSessionInUrl: true,
        // Flow type for OAuth
        flowType: 'implicit',
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Helper functions for authentication
export const signInWithGoogle = async () => {
    console.log('Initiating Google sign in...');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });

    if (error) {
        console.error('Google sign in error:', error);
        throw error;
    }

    console.log('Google sign in initiated:', data);
    return data;
};

export const signOut = async () => {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Sign out error:', error);
        throw error;
    }

    console.log('Signed out successfully');
};
