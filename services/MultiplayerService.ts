import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Room {
    id: string;
    short_code: string;
    host_id: string;
    status: 'waiting' | 'active' | 'completed';
    created_at: string;
}

export interface Participant {
    user_id: string;
    username: string; // Joined from profiles
    status: 'joined' | 'ready' | 'submitted_action';
    is_active: boolean; // For auto-skip
    last_seen: string; // For heartbeat
}

export interface GameStateSync {
    room_id: string;
    world_time: number;
    files: any; // JSONB
    history: any; // JSONB
    turn_context: {
        active_turn: number;
        actions_submitted: string[]; // user_ids
    };
}

class MultiplayerService {
    private channel: RealtimeChannel | null = null;
    private roomId: string | null = null;
    private userId: string | null = null;

    async createRoom(hostId: string): Promise<Room | null> {
        const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create room
        const { data: room, error } = await supabase
            .from('rooms')
            .insert({
                host_id: hostId,
                short_code: shortCode,
                status: 'waiting'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return null;
        }

        // Host joins as participant
        await this.joinRoom(room.short_code, hostId);
        return room;
    }

    async joinRoom(shortCode: string, userId: string): Promise<string | null> {
        // Get room ID
        const { data: room, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('short_code', shortCode)
            .single();

        if (error || !room) {
            console.error('Room not found');
            return null;
        }

        this.roomId = room.id;
        this.userId = userId;

        // Add participant
        const { error: joinError } = await supabase
            .from('participants')
            .upsert({
                room_id: room.id,
                user_id: userId,
                status: 'joined',
                is_active: true,
                last_seen: new Date().toISOString()
            });

        if (joinError) console.error('Error joining room:', joinError);

        this.startHeartbeat();
        return room.id;
    }

    // Subscribe to changes
    subscribeToRoom(roomId: string, onStateChange: (state: GameStateSync) => void, onPresenceChange: (participants: Participant[]) => void) {
        if (this.channel) this.channel.unsubscribe();

        this.channel = supabase.channel(`room:${roomId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` }, (payload) => {
                onStateChange(payload.new as GameStateSync);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, () => {
                // Reload participants list on any change
                this.fetchParticipants(roomId).then(onPresenceChange);
            })
            .subscribe();

        // Initial fetch
        this.fetchParticipants(roomId).then(onPresenceChange);
    }

    async fetchParticipants(roomId: string): Promise<Participant[]> {
        const { data } = await supabase
            .from('participants')
            .select(`
        user_id,
        status,
        is_active,
        last_seen,
        profiles (username)
      `)
            .eq('room_id', roomId);

        if (!data) return [];

        return data.map((p: any) => ({
            ...p,
            username: p.profiles?.username || 'Unknown'
        }));
    }

    async submitAction(action: string) {
        if (!this.roomId || !this.userId) return;

        await supabase
            .from('participants')
            .update({
                status: 'submitted_action',
                last_action: action
            })
            .eq('room_id', this.roomId)
            .eq('user_id', this.userId);
    }

    async updateGameState(roomId: string, state: Partial<GameStateSync>) {
        await supabase
            .from('game_states')
            .upsert({
                room_id: roomId,
                ...state
            });
    }

    // Host only
    async kickPlayer(targetUserId: string) {
        if (!this.roomId) return;
        await supabase
            .from('participants')
            .delete()
            .eq('room_id', this.roomId)
            .eq('user_id', targetUserId);
    }

    private startHeartbeat() {
        setInterval(async () => {
            if (this.roomId && this.userId) {
                await supabase
                    .from('participants')
                    .update({ last_seen: new Date().toISOString(), is_active: true })
                    .eq('room_id', this.roomId)
                    .eq('user_id', this.userId);
            }
        }, 10000); // 10s heartbeat
    }
}

export const multiplayerService = new MultiplayerService();
