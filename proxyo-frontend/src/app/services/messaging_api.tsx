import { fetchWithAuth } from './auth_api';

const API_URL = 'http://127.0.0.1:8000/api/';
const WS_BASE  = 'ws://127.0.0.1:8000/ws/';

// ── Types ──────────────────────────────────────────────────
export interface ChatMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_logo: string | null;
    body: string;
    is_read: boolean;
    created_at: string;
}

export interface Channel {
    id: number;
    mission_id: number;
    mission_title: string;
    is_closed: boolean;
    created_at: string;
    messages?: ChatMessage[];
    interlocutor_name?: string | null;
    interlocutor_logo?: string | null;
    last_message?: { body: string; sender_name: string; created_at: string } | null;
    unread_count?: number;
}

// ── REST ───────────────────────────────────────────────────
export async function getChannel(missionId: number): Promise<Channel> {
    const response = await fetchWithAuth(`${API_URL}missions/${missionId}/channel/`);
    if (!response.ok) throw new Error('Canal introuvable');
    return response.json();
}

export async function getMessages(missionId: number): Promise<ChatMessage[]> {
    const response = await fetchWithAuth(`${API_URL}missions/${missionId}/channel/messages/`);
    if (!response.ok) throw new Error('Erreur lors du chargement des messages');
    return response.json();
}

export async function markMessageRead(missionId: number, messageId: number): Promise<void> {
    await fetchWithAuth(`${API_URL}missions/${missionId}/channel/messages/${messageId}/read/`, {
        method: 'POST',
    });
}

// ── WebSocket ──────────────────────────────────────────────
export function createChatSocket(missionId: number): WebSocket {
    const token = localStorage.getItem('access_token');
    return new WebSocket(`${WS_BASE}missions/${missionId}/channel/?token=${token}`);
}
