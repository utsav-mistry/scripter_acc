import { apiFetch } from './http';

export type Task = {
    id: string;
    projectId: string;
    boardId: string;
    title: string;
    description?: string;
    status: string;
    priority: number;
    assigneeUserId?: string;
    dueAt?: string;
    createdAt?: string;
};

export type TaskComment = { id: string; body: string; createdAt?: string; createdByUserId: string };

export type Label = { id: string; name: string; color: string };

export type Attachment = { id: string; filename: string; contentType: string; sizeBytes: number };

export async function listTasks(
    accessToken: string,
    query: { projectId: string; boardId?: string; status?: string; assigneeUserId?: string; limit?: number; cursor?: string }
) {
    const params = new URLSearchParams();
    params.set('projectId', query.projectId);
    if (query.boardId) params.set('boardId', query.boardId);
    if (query.status) params.set('status', query.status);
    if (query.assigneeUserId) params.set('assigneeUserId', query.assigneeUserId);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.cursor) params.set('cursor', query.cursor);

    return apiFetch<{ items: Task[]; nextCursor: string | null }>(`/api/tasks?${params.toString()}`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createTask(
    accessToken: string,
    input: {
        projectId: string;
        boardId: string;
        title: string;
        description?: string;
        status?: string;
        priority?: 1 | 2 | 3 | 4;
        assigneeUserId?: string;
        dueAt?: string;
    },
    idempotencyKey: string
) {
    return apiFetch<{ id: string }>(`/api/tasks`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input)
    });
}

export async function patchTask(accessToken: string, taskId: string, patch: any, idempotencyKey: string) {
    return apiFetch<{ ok: true }>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(patch)
    });
}

export async function listComments(accessToken: string, taskId: string) {
    return apiFetch<{ items: TaskComment[]; nextCursor: string | null }>(`/api/tasks/${taskId}/comments`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createComment(accessToken: string, taskId: string, body: string, idempotencyKey: string) {
    return apiFetch<{ id: string }>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ body })
    });
}

export async function listProjectLabels(accessToken: string, projectId: string) {
    return apiFetch<{ items: Label[]; nextCursor: string | null }>(`/api/tasks/projects/${projectId}/labels`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createProjectLabel(accessToken: string, projectId: string, input: { name: string; color: string }, idempotencyKey: string) {
    return apiFetch<Label>(`/api/tasks/projects/${projectId}/labels`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input)
    });
}

export async function listTaskLabels(accessToken: string, taskId: string) {
    return apiFetch<{ items: Label[]; nextCursor: string | null }>(`/api/tasks/${taskId}/labels`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function attachTaskLabel(accessToken: string, taskId: string, labelId: string, idempotencyKey: string) {
    return apiFetch<{ ok: true }>(`/api/tasks/${taskId}/labels`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ labelId })
    });
}

export async function detachTaskLabel(accessToken: string, taskId: string, labelId: string, idempotencyKey: string) {
    return apiFetch<{ ok: true }>(`/api/tasks/${taskId}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${accessToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({})
    });
}

export async function listAttachments(accessToken: string, taskId: string) {
    return apiFetch<{ items: Attachment[]; nextCursor: string | null }>(`/api/tasks/${taskId}/attachments`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function uploadAttachment(accessToken: string, taskId: string, file: File, idempotencyKey: string) {
    const buf = await file.arrayBuffer();
    const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey,
            'content-type': 'application/octet-stream',
            'x-filename': file.name
        },
        body: buf,
        credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message ?? json?.error ?? 'upload_failed');
    return json as { id: string; filename: string; sizeBytes: number };
}

export function downloadAttachmentUrl(taskId: string, attachmentId: string) {
    return `/api/tasks/${taskId}/attachments/${attachmentId}/download`;
}
