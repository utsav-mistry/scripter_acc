import { apiFetch } from './http';

export type Org = { id: string; name: string; slug: string; plan: string };
export type Workspace = { id: string; name: string; key: string };

export async function listOrgs(accessToken: string) {
    return apiFetch<{ items: Org[]; nextCursor: string | null }>('/api/orgs', {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createOrg(accessToken: string, input: { name: string; slug?: string; plan?: string }, idempotencyKey: string) {
    return apiFetch<Org>('/api/orgs', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(input)
    });
}

export async function listWorkspaces(accessToken: string, orgId: string) {
    return apiFetch<{ items: Workspace[]; nextCursor: string | null }>(`/api/orgs/${orgId}/workspaces`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createWorkspace(accessToken: string, orgId: string, input: { name: string; key?: string }, idempotencyKey: string) {
    return apiFetch<Workspace>(`/api/orgs/${orgId}/workspaces`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(input)
    });
}
