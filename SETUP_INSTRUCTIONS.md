# Quick Setup Instructions

## Error: 404 on /rest/v1/users

This error means the database tables haven't been created yet. Follow these steps:

## Step-by-Step Setup

### 1. Create Database Tables

1. Open your browser and go to: **https://pxdovjbwktuaaolzjijd.supabase.co**
2. Sign in to your Supabase account
3. In the left sidebar, click **SQL Editor**
4. Click the **New query** button
5. Copy the ENTIRE contents of the file `supabase/schema.sql` from this project
6. Paste it into the SQL editor
7. Click **Run** (or press Cmd+Enter)
8. You should see: "Success. No rows returned"

### 2. Enable Google OAuth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. You'll need to configure Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://pxdovjbwktuaaolzjijd.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. Paste them into the Supabase Google provider settings
7. Click **Save**

### 3. Verify Setup

After running the schema, you should see these tables in **Database** → **Tables**:
- users
- games
- game_players
- player_files
- game_files
- turn_submissions

### 4. Restart Your Dev Server

Once the tables are created:
1. Stop the dev server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Try logging in again

## Troubleshooting

**Still getting 404?**
- Make sure you ran the ENTIRE schema.sql file
- Check the Supabase dashboard → Database → Tables to confirm tables exist
- Check browser console for other errors

**Google OAuth not working?**
- Make sure you added the correct redirect URI
- Double-check Client ID and Secret are correct
- Try signing out and back in to Supabase Dashboard

**Need help?**
Check the detailed setup guide in `README_MULTIPLAYER.md`
