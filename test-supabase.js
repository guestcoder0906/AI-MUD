// Quick test to verify Supabase connection
import { supabase } from './supabase/client.ts';

console.log('Testing Supabase connection...');

// Test 1: Check users table exists
supabase
  .from('users')
  .select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Users table error:', error.message);
    } else {
      console.log('✅ Users table accessible');
    }
  });

// Test 2: Check auth state
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Auth error:', error.message);
  } else {
    console.log('✅ Auth working, session:', data.session ? 'exists' : 'none');
  }
});
