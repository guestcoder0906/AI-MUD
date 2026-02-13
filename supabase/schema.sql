-- ============================================
-- AI-MUD Multiplayer Database Schema
-- Clean installation (drops existing tables)
-- ============================================

-- Drop existing tables and policies (in reverse dependency order)
DROP TABLE IF EXISTS turn_submissions CASCADE;
DROP TABLE IF EXISTS game_files CASCADE;
DROP TABLE IF EXISTS player_files CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- GAMES TABLE
-- ============================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  world_description TEXT,
  world_time BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting_for_world',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('waiting_for_world', 'waiting_for_characters', 'active', 'ended'))
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active games" ON games FOR SELECT USING (true);
CREATE POLICY "Hosts can create games" ON games FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Hosts can update their games" ON games FOR UPDATE USING (auth.uid() = host_user_id);
CREATE POLICY "Hosts can delete their games" ON games FOR DELETE USING (auth.uid() = host_user_id);

-- ============================================
-- GAME PLAYERS TABLE
-- ============================================
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  has_sent_turn BOOLEAN DEFAULT false,
  character_created BOOLEAN DEFAULT false,
  is_dead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view players in their games" ON game_players FOR SELECT USING (true);
CREATE POLICY "Users can join games" ON game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their player status" ON game_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Hosts can update players in their games" ON game_players FOR UPDATE USING (
  EXISTS (SELECT 1 FROM games WHERE games.id = game_players.game_id AND games.host_user_id = auth.uid())
);
CREATE POLICY "Hosts can remove players" ON game_players FOR DELETE USING (
  EXISTS (SELECT 1 FROM games WHERE games.id = game_players.game_id AND games.host_user_id = auth.uid())
);

-- ============================================
-- PLAYER FILES TABLE
-- ============================================
CREATE TABLE player_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  last_updated BIGINT NOT NULL,
  UNIQUE(game_id, user_id, file_name)
);

ALTER TABLE player_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view files in their games" ON player_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_players WHERE game_players.game_id = player_files.game_id AND game_players.user_id = auth.uid())
);
CREATE POLICY "Players can manage their own files" ON player_files FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- GAME FILES TABLE (Shared: NPCs, Locations, Items)
-- ============================================
CREATE TABLE game_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  last_updated BIGINT NOT NULL,
  UNIQUE(game_id, file_name)
);

ALTER TABLE game_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view files in their games" ON game_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_players WHERE game_players.game_id = game_files.game_id AND game_players.user_id = auth.uid())
);
CREATE POLICY "System can manage game files" ON game_files FOR ALL USING (true);

-- ============================================
-- TURN SUBMISSIONS TABLE
-- ============================================
CREATE TABLE turn_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  input TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE turn_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view turns in their games" ON turn_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_players WHERE game_players.game_id = turn_submissions.game_id AND game_players.user_id = auth.uid())
);
CREATE POLICY "Players can submit turns" ON turn_submissions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM game_players WHERE game_players.game_id = turn_submissions.game_id AND game_players.user_id = auth.uid())
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_player_files_game_id ON player_files(game_id);
CREATE INDEX idx_player_files_user_id ON player_files(user_id);
CREATE INDEX idx_game_files_game_id ON game_files(game_id);
CREATE INDEX idx_turn_submissions_game_id ON turn_submissions(game_id);
CREATE INDEX idx_games_code ON games(code);

-- ============================================
-- VERIFICATION
-- ============================================
-- Show created tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
