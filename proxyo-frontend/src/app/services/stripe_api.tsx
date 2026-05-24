import { fetchWithAuth } from './auth_api';

const API_URL = 'http://127.0.0.1:8000/api/';


export async function getOnboardingStatus(): Promise<{ onboarded: boolean; has_account: boolean }> {
    const response = await fetchWithAuth(`${API_URL}stripe/onboarding/status/`);
    if (!response.ok) throw new Error('Erreur lors de la vérification du statut');
    return response.json();
}

export async function startOnboarding(): Promise<{ onboarding_url: string }> {
    const response = await fetchWithAuth(`${API_URL}stripe/onboarding/`, { method: 'POST' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors du démarrage de l\'onboarding');
    }
    return response.json();
}
