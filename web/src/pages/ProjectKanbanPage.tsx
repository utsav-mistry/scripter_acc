import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../state/auth/AuthContext';
import { listBoards, createBoard } from '../api/boards';
import { listTasks, createTask } from '../api/tasks';
import { Container } from '../layout/Container';
import { Stack } from '../layout/Stack';
import { Card } from '../atoms/surface/Card';
import { ButtonPrimary } from '../atoms/buttons/ButtonPrimary';
import { Loader } from '../atoms/feedback/Loader';
import { EmptyState } from '../atoms/feedback/EmptyState';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskDetailPanel } from '../components/kanban/TaskDetailPanel';
import { randomId } from '../lib/id';

const STATUSES = [
    { key: 'todo', title: 'To do' },
    { key: 'in_progress', title: 'In progress' },
    { key: 'blocked', title: 'Blocked' },
    { key: 'done', title: 'Done' }
] as const;

export function ProjectKanbanPage() {
    const { projectId } = useParams();
    const { state } = useAuth();
    const accessToken = state.accessToken!;

    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [openTaskId, setOpenTaskId] = useState<string | null>(null);

    const bq = useQuery({
        queryKey: ['project', projectId, 'boards'],
        queryFn: () => listBoards(accessToken, projectId!),
        enabled: !!projectId
    });

    const boardItems = bq.data?.items ?? [];

    const selectedBoardId = useMemo(() => {
        if (activeBoardId) return activeBoardId;
        return boardItems.length ? boardItems[0].id : null;
    }, [activeBoardId, boardItems]);

    const tq = useQuery({
        queryKey: ['project', projectId, 'board', selectedBoardId, 'tasks'],
        queryFn: () => listTasks(accessToken, { projectId: projectId!, boardId: selectedBoardId!, limit: 200 }),
        enabled: !!projectId && !!selectedBoardId
    });

    const tasks = tq.data?.items ?? [];

    const grouped = useMemo(() => {
        const m: Record<string, typeof tasks> = {};
        for (const s of STATUSES) m[s.key] = [];
        for (const t of tasks) (m[t.status] ?? (m[t.status] = [])).push(t);
        return m;
    }, [tasks]);

    async function createBoardQuick() {
        await createBoard(accessToken, projectId!, { name: `Board ${new Date().toISOString()}` }, randomId(12));
        await bq.refetch();
    }

    async function createTaskQuick() {
        if (!selectedBoardId) return;
        await createTask(accessToken, { projectId: projectId!, boardId: selectedBoardId, title: `Task ${new Date().toISOString()}` }, randomId(12));
        await tq.refetch();
    }

    return (
        <Container>
            <Stack gap={12}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <strong>Project Kanban: {projectId}</strong>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <ButtonPrimary onClick={() => void createBoardQuick()}>Create Board</ButtonPrimary>
                            <ButtonPrimary disabled={!selectedBoardId} onClick={() => void createTaskQuick()}>
                                Create Task
                            </ButtonPrimary>
                        </div>
                    </div>
                </Card>

                {bq.isLoading ? <Loader label="Loading boards..." /> : null}
                {bq.data && bq.data.items.length === 0 ? <EmptyState title="No boards" description="Create a board to start" /> : null}

                {boardItems.length ? (
                    <Card>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {boardItems.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => setActiveBoardId(b.id)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        border: '1px solid #d1d5db',
                                        background: selectedBoardId === b.id ? '#111827' : '#fff',
                                        color: selectedBoardId === b.id ? '#fff' : '#111827',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    </Card>
                ) : null}

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                    {STATUSES.map((s) => (
                        <KanbanColumn key={s.key} title={s.title} items={grouped[s.key] ?? []} onOpenTask={(id) => setOpenTaskId(id)} />
                    ))}
                </div>

                {openTaskId ? <TaskDetailPanel accessToken={accessToken} taskId={openTaskId} /> : null}
            </Stack>
        </Container>
    );
}
