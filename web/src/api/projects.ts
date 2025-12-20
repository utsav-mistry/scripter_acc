import { apiFetch } from './http';

export type Project = { id: string; name: string; key: string; visibility?: string };

export async function listProjects(accessToken: string, orgId: string, workspaceId: string) {
    const params = new URLSearchParams({ orgId, workspaceId });
    return apiFetch<{ items: Project[]; nextCursor: string | null }>(`/api/projects?${params.toString()}`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createProject(
    accessToken: string,
    input: { orgId: string; workspaceId: string; name: string; key?: string; description?: string; visibility?: 'private' | 'org' },
    idempotencyKey: string
) {
    return apiFetch<Project>('/api/projects', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(input)
    });
}
