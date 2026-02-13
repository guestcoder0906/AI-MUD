-- ============================================
-- COMPLETE DATABASE RESET SCRIPT
-- Run this in Supabase SQL Editor to clean slate
-- ============================================

-- Step 1: Drop all existing tables (if they exist)
DROP TABLE IF EXISTS turn_submissions CASCADE;
DROP TABLE IF EXISTS game_files CASCADE;
DROP TABLE IF EXISTS player_files CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create tables fresh
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting_for_world',
    current_turn INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    has_sent_turn BOOLEAN DEFAULT false,
    character_created BOOLEAN DEFAULT false,
    is_dead BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

CREATE TABLE player_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, user_id, filename)
);

CREATE TABLE game_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, filename)
);

CREATE TABLE turn_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_submissions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Users: Can read all, can only insert/update own profile
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Games: Can read all, only authenticated users can create
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games" ON games FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Host can update own games" ON games FOR UPDATE USING (auth.uid() = host_user_id);
CREATE POLICY "Host can delete own games" ON games FOR DELETE USING (auth.uid() = host_user_id);

-- Game players: Can read all in same game, can insert self, can update self
CREATE POLICY "Players can view players in their games" ON game_players FOR SELECT USING (true);
CREATE POLICY "Users can join games" ON game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update themselves" ON game_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can leave games" ON game_players FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Hosts can manage players" ON game_players FOR ALL USING (
    EXISTS (
        SELECT 1 FROM games WHERE games.id = game_players.game_id AND games.host_user_id = auth.uid()
    )
);

-- Player files: Can read own files, can write own files
CREATE POLICY "Players can view own files" ON player_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players can create own files" ON player_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own files" ON player_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can delete own files" ON player_files FOR DELETE USING (auth.uid() = user_id);

-- Game files: Can read if in game, host can write
CREATE POLICY "Players can view game files in their games" ON game_files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_players 
        WHERE game_players.game_id = game_files.game_id 
        AND game_players.user_id = auth.uid()
    )
);
CREATE POLICY "Hosts can manage game files" ON game_files FOR ALL USING (
    EXISTS (
        SELECT 1 FROM games WHERE games.id = game_files.game_id AND games.host_user_id = auth.uid()
    )
);

-- Turn submissions: Can read own, can write own
CREATE POLICY "Players can view own submissions" ON turn_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_players 
        WHERE game_players.id = turn_submissions.player_id 
        AND game_players.user_id = auth.uid()
    )
);
CREATE POLICY "Players can submit turns" ON turn_submissions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM game_players 
        WHERE game_players.id = turn_submissions.player_id 
        AND game_players.user_id = auth.uid()
    )
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_games_host ON games(host_user_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
CREATE INDEX idx_player_files_game_user ON player_files(game_id, user_id);
CREATE INDEX idx_game_files_game ON game_files(game_id);

-- Step 6: Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
