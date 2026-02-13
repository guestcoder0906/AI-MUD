import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pxdovjbwktuaaolzjijd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_iAxQdLMtg8z2MvNsQPuhxQ_XIGqQGQe';

export const supabase = createClient(supabaseUrl, supabaseKey, {
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

    // Support both localhost and production deployment
    const redirectUrl = window.location.origin;
    console.log('OAuth redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
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
