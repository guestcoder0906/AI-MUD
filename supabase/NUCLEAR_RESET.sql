-- ============================================
-- NUCLEAR OPTION: DROP EVERYTHING
-- This will delete ALL tables, policies, and data
-- ============================================

-- Drop ALL existing tables (including old ones)
DROP TABLE IF EXISTS turn_submissions CASCADE;
DROP TABLE IF EXISTS game_files CASCADE;
DROP TABLE IF EXISTS player_files CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old/leftover tables
DROP TABLE IF EXISTS game_inputs CASCADE;
DROP TABLE IF EXISTS game_history CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS player_data CASCADE;
DROP TABLE IF EXISTS world_state CASCADE;

-- Drop any other potential old tables (common names)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS actions CASCADE;

-- Verify all tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- You should see EMPTY results here (no tables)
-- If you see any tables listed, manually drop them:
-- DROP TABLE IF EXISTS [table_name] CASCADE;
