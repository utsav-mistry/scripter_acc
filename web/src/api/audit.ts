import { apiFetch } from './http';

export type AuditItem = {
    id: string;
    ts: string;
    actorUserId?: string;
    entityType: string;
    entityId: string;
    action: string;
    requestId?: string;
    metadata?: unknown;
};

export async function listAudit(accessToken: string, input: { orgId?: string; projectId?: string; limit?: number; cursor?: string }) {
    const params = new URLSearchParams();
    if (input.orgId) params.set('orgId', input.orgId);
    if (input.projectId) params.set('projectId', input.projectId);
    if (input.limit) params.set('limit', String(input.limit));
    if (input.cursor) params.set('cursor', input.cursor);

    return apiFetch<{ items: AuditItem[]; nextCursor: string | null }>(`/api/audit?${params.toString()}`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}
