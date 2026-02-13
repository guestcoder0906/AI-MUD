# AI-MUD Engine - Multiplayer Setup Guide

## Overview

This guide explains how to set up and run the AI-MUD Engine with multiplayer support using Supabase.

## Prerequisites

- Node.js (v14 or higher)
- Google AI API Key
- Supabase account

## Supabase Setup

### 1. Create Database Tables

Log into your Supabase dashboard at: https://pxdovjbwktuaaolzjijd.supabase.co

Navigate to the SQL Editor and run the schema located in `supabase/schema.sql`. This will create:
- `users` table for player profiles
- `games` table for multiplayer games
- `game_players` table for tracking players in games
- `player_files` table for per-player game state
- `game_files` table for shared world state (NPCs, locations, items)
- `turn_submissions` table for turn tracking

### 2. Configure Google OAuth

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Google provider
3. Configure the OAuth redirect URL:
   - For development: `http://localhost:3000`
   - For production: Your deployed URL

### 3. Row Level Security (RLS)

The schema includes RLS policies that:
- Allow users to view all profiles but only edit their own
- Allow game hosts to manage their games
- Allow players to join games and manage their own files
- Restrict access to game data based on participation

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
API_KEY=your_google_ai_api_key_here
```

The Supabase credentials are already configured in `supabase/client.ts`.

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## How to Use

### Single Player Mode

1. Click "SINGLE PLAYER" on the game mode selector
2. Describe your world (e.g., "A cyberpunk city in the rain")
3. Start adventuring!

### Multiplayer Mode

#### Hosting a Game

1. Sign in with Google
2. Set up your username (or get a random one)
3. Click "HOST MULTIPLAYER"
4. Share the 6-character game code with friends
5. Describe the world (as host, you go first)
6. Wait for all players to create their characters
7. Adventure together!

#### Joining a Game

1. Sign in with Google
2. Set up your username
3. Click "JOIN MULTIPLAYER"
4. Enter the 6-character game code
5. Wait for world generation (if in progress)
6. Create your character
7. Join the adventure!

### Host Controls

As the host, you can:
- **Kick players**: Remove a player from the game (deletes their character file)
- **Force Next Turn**: Process the turn even if not all players have submitted actions
- **Delete Adventure**: End the game for all players permanently

### Player-Specific Content

The AI can create content that only specific players can see using:

```
target(username1, username2[content only they can see])
```

For example:
- "The NPC whispers to target(alice[you alone that the treasure is hidden north])"
- "You find a note that reads target(bob, charlie[Meet me at midnight. -X])"

### Player Death

If your HP reaches 0:
- Your character file is deleted
- You can't take actions
- Other players continue playing
- You can create a new character to rejoin

### Activity Tracking

- Players are marked "inactive" when they switch tabs or close the game
- The game doesn't wait for inactive players to submit turns
- Return to the tab to become active again

## Troubleshooting

### "Game not found" Error

- Double-check the game code
- The host may have deleted the game
- The game may have expired

### "Failed to authenticate"

- Ensure Google OAuth is properly configured in Supabase
- Check that redirect URLs match your environment

### Players Not Syncing

- Check browser console for Realtime subscription errors
- Verify RLS policies are correctly applied
- Ensure all players are in the same game (check game code)

## Technical Notes

### File System

- **Single Player**: Uses `Player.txt` for the player's state
- **Multiplayer**: Each player has `Player_{username}.txt`
- Shared files (NPCs, Locations, Items) are accessible to all players

### Turn Processing

1. All active players submit their actions
2. System waits for all submissions
3. AI processes all inputs simultaneously
4. Creates a coherent narrative including everyone's actions
5. Updates each player'sfile individually

### Real-time Synchronization

The app uses Supabase Realtime to sync:
- Player list and status
- Game state changes
- Turn submissions
- Host disconnect detection

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google AI Documentation](https://ai.google.dev/)
- [Project GitHub](your-repo-url-here)
