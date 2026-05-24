import { fetchWithAuth } from './auth_api';

const API_URL = 'http://127.0.0.1:8000/api/';

// ── Lister mes missions ────────────────────────────────────
export async function getMissions() {
    const response = await fetchWithAuth(`${API_URL}mission/publier/`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des missions');
    return response.json();
}

// ── Détail d'une mission ───────────────────────────────────
export async function getMission(id: number) {
    const response = await fetchWithAuth(`${API_URL}mission/${id}/`);
    if (!response.ok) throw new Error('Mission introuvable');
    return response.json();
}

// ── Publier une mission ────────────────────────────────────
export async function createMission(payload: {
    title: string;
    description: string;
    sector: string;
    city: string;
    postal_code: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
}) {
    const response = await fetchWithAuth(`${API_URL}mission/publier/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la publication');
    }
    return response.json();
}

// ── Modifier une mission ───────────────────────────────────
export async function updateMission(id: number, payload: Partial<{
    title: string;
    description: string;
    sector: string;
    city: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
    status: string;
}>) {
    const response = await fetchWithAuth(`${API_URL}mission/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la modification');
    }
    return response.json();
}

// ── Supprimer une mission ──────────────────────────────────
export async function deleteMission(id: number) {
    const response = await fetchWithAuth(`${API_URL}mission/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la suppression');
    }
    return true;
}

// ── Candidatures reçues pour une mission ──────────────────
export async function getMissionApplications(id: number) {
    const response = await fetchWithAuth(`${API_URL}missions/${id}/applications/`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des candidatures');
    return response.json();
}

// ── Prestataire : marquer la mission terminée ──────────────
export async function completeMission(id: number) {
    const response = await fetchWithAuth(`${API_URL}missions/${id}/complete/`, { method: 'PATCH' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur');
    }
    return response.json();
}

// ── Client : confirmer la mission terminée ─────────────────
export async function confirmMission(id: number) {
    const response = await fetchWithAuth(`${API_URL}missions/${id}/confirm/`, { method: 'PATCH' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur');
    }
    return response.json();
}
