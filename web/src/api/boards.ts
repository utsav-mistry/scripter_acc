import { apiFetch } from './http';

export type Board = { id: string; name: string; type: string };

export async function listBoards(accessToken: string, projectId: string) {
    return apiFetch<{ items: Board[]; nextCursor: string | null }>(`/api/projects/${projectId}/boards`, {
        headers: { authorization: `Bearer ${accessToken}` }
    });
}

export async function createBoard(accessToken: string, projectId: string, input: { name: string; type?: 'kanban' | 'scrum' | 'backlog' }, idempotencyKey: string) {
    return apiFetch<Board>(`/api/projects/${projectId}/boards`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(input)
    });
}
