const API_URL = 'http://127.0.0.1:8000/api/';

function getToken() {
    return localStorage.getItem('access_token');
}

// ── Liste des notifications ────────────────────────────────
export async function getNotifications() {
    try {
        const response = await fetch(`${API_URL}notifications/`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des notifications');
        return await response.json();
    } catch (error) {
        console.error('Erreur getNotifications:', error);
        throw error;
    }
}

// ── Marquer une notification comme lue ────────────────────
export async function markNotificationRead(id: number) {
    try {
        const response = await fetch(`${API_URL}notifications/${id}/read/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        return await response.json();
    } catch (error) {
        console.error('Erreur markNotificationRead:', error);
        throw error;
    }
}

// ── Tout marquer comme lu ──────────────────────────────────
export async function markAllNotificationsRead() {
    try {
        const response = await fetch(`${API_URL}notifications/read-all/`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        return await response.json();
    } catch (error) {
        console.error('Erreur markAllNotificationsRead:', error);
        throw error;
    }
}