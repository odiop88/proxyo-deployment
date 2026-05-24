import { fetchWithAuth } from './auth_api';

const API_URL = 'http://127.0.0.1:8000/api/';

// ── Candidater à une mission ───────────────────────────────
export async function applyToMission(missionId: number, payload: {
    cover_letter: string;
    proposed_price: number;
    estimated_days: number;
    apply_tva?: boolean;
    tva_rate?: number;
}) {
    const response = await fetchWithAuth(`${API_URL}missions/${missionId}/apply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la candidature');
    }
    return response.json();
}

// ── Accepter / Rejeter une candidature ────────────────────
export async function actionApplication(applicationId: number, action: 'accept' | 'reject') {
    const response = await fetchWithAuth(`${API_URL}applications/${applicationId}/action/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur lors de l'action");
    }
    return response.json();
}

// ── Retirer sa candidature ─────────────────────────────────
export async function withdrawApplication(applicationId: number) {
    const response = await fetchWithAuth(`${API_URL}applications/${applicationId}/withdraw/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors du retrait');
    }
    return response.json();
}

// ── Mes candidatures envoyées ──────────────────────────────
export async function getMyApplications() {
    const response = await fetchWithAuth(`${API_URL}applications/my/`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des candidatures');
    return response.json();
}
