import React, { useEffect, useState } from 'react';
import { supabase } from './supabase/client';

// Debug page to test Supabase connection
export const DebugAuth: React.FC = () => {
    const [status, setStatus] = useState<string[]>([]);

    useEffect(() => {
        const test = async () => {
            const logs: string[] = [];

            // Test 1: Supabase client
            logs.push('✅ Supabase client initialized');

            // Test 2: Check users table
            try {
                const { data, error } = await supabase.from('users').select('count');
                if (error) {
                    logs.push(`❌ Users table: ${error.message}`);
                } else {
                    logs.push('✅ Users table accessible');
                }
            } catch (e: any) {
                logs.push(`❌ Users table error: ${e.message}`);
            }

            // Test 3: Check auth session
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    logs.push(`❌ Auth session: ${error.message}`);
                } else {
                    logs.push(`✅ Auth session: ${session ? 'Active' : 'None'}`);
                }
            } catch (e: any) {
                logs.push(`❌ Auth error: ${e.message}`);
            }

            // Test 4: Try Google sign in
            logs.push('');
            logs.push('Click the button below to test Google OAuth');

            setStatus(logs);
        };

        test();
    }, []);

    const testGoogleSignIn = async () => {
        setStatus(prev => [...prev, '', 'Attempting Google sign in...']);
        try {
            // Support both localhost and production deployment
            const redirectUrl = window.location.origin;
            setStatus(prev => [...prev, `Using redirect URL: ${redirectUrl}`]);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) {
                setStatus(prev => [...prev, `❌ OAuth error: ${error.message}`]);
            } else {
                setStatus(prev => [...prev, '✅ OAuth redirect initiated']);
            }
        } catch (e: any) {
            setStatus(prev => [...prev, `❌ Exception: ${e.message}`]);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-8">
            <h1 className="text-2xl mb-4">🔍 Supabase Auth Debug</h1>

            <div className="bg-gray-900 p-4 rounded mb-4">
                <h2 className="font-bold mb-2">Status:</h2>
                {status.map((line, i) => (
                    <div key={i} className="text-sm">{line}</div>
                ))}
            </div>

            <button
                onClick={testGoogleSignIn}
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
                Test Google OAuth
            </button>

            <div className="mt-8 bg-gray-900 p-4 rounded">
                <h2 className="font-bold mb-2">Common Issues:</h2>
                <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Google OAuth not enabled in Supabase Dashboard</li>
                    <li>Incorrect redirect URL configured</li>
                    <li>Missing Client ID/Secret for Google</li>
                </ul>
            </div>
        </div>
    );
};
