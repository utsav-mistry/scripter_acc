import { apiFetch } from './http';

export type AuthUser = { id: string; email: string; name: string };

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
};

export async function register(input: { email: string; password: string; name: string }) {
    return apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export async function login(input: { email: string; password: string }) {
    return apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input)
    });
}

export async function logout() {
    return apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}
