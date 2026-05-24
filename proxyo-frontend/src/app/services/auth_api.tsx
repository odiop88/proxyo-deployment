const API_URL = 'http://127.0.0.1:8000/api/';

//login
export async function login(email: string, password: string) {
    try {
        console.log('Tentative de connexion avec:', email);

        const response = await fetch(`${API_URL}auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Identifiants invalides');
        }

        const data = await response.json();
        console.log('Réponse login:', data);

        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        if (data.company) {
            localStorage.setItem('company', JSON.stringify(data.company));
        }

        return data;
    } catch (error) {
        console.error('Erreur login:', error);
        throw error;
    }
}

//register

export async function register(payload: {
    company_name: string;
    siret: string;
    contact_email: string;
    phone: string;
    sector: string;
    address: string;
    city: string;
    postal_code: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_email: string;
    owner_tel: string;
    password: string;
    password_confirm: string;
}) {
    try {
        console.log('📝 Tentative d\'inscription...');

        const response = await fetch(`${API_URL}auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erreur lors de l\'inscription');
        }

        const data = await response.json();
        console.log(' Inscription réussie:', data);

        return data;
    } catch (error) {
        console.error('Erreur register:', error);
        throw error;
    }
}

// ── Verify Email ───────────────────────────────────────────

export async function verifyEmail(token: string) {
    try {
        console.log('Vérification email...');

        const response = await fetch(`${API_URL}auth/verify-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Token invalide ou expiré');
        }

        const data = await response.json();
        console.log('Email vérifié:', data);

        return data;
    } catch (error) {
        console.error('Erreur vérification email:', error);
        throw error;
    }
}

//Resend Verification 

export async function resendVerification(email: string) {
    try {
        console.log('Renvoi email de vérification à:', email);

        const response = await fetch(`${API_URL}auth/resend-verification/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erreur lors du renvoi');
        }

        const data = await response.json();
        console.log('Email renvoyé:', data);

        return data;
    } catch (error) {
        console.error('Erreur renvoi vérification:', error);
        throw error;
    }
}

//Logout

export function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
}

// ── Refresh du token ───────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return null;

    const response = await fetch(`${API_URL}auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
}

// ── Fetch authentifié avec refresh automatique ─────────────
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('access_token');

    const makeRequest = (t: string | null) => fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
    });

    let response = await makeRequest(token);

    // Token expiré → on refresh et on relance
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            response = await makeRequest(newToken);
        } else {
            // Refresh impossible → déconnexion
            logout();
            window.location.href = '/auth';
        }
    }

    return response;
}