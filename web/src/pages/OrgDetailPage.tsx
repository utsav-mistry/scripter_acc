import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid';

import { useAuth } from '../state/auth/AuthContext';
import { listWorkspaces, createWorkspace } from '../api/orgs';
import { listProjects, createProject } from '../api/projects';
import { Container } from '../layout/Container';
import { Stack } from '../layout/Stack';
import { Card } from '../atoms/surface/Card';
import { ButtonPrimary } from '../atoms/buttons/ButtonPrimary';
import { WorkspaceList } from '../components/workspaces/WorkspaceList';

export function OrgDetailPage() {
    const { orgId } = useParams();
    const { state } = useAuth();
    const accessToken = state.accessToken!;

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

    const wq = useQuery({
        queryKey: ['org', orgId, 'workspaces'],
        queryFn: () => listWorkspaces(accessToken, orgId!),
        enabled: !!orgId
    });

    const pq = useQuery({
        queryKey: ['org', orgId, 'workspace', selectedWorkspaceId, 'projects'],
        queryFn: () => listProjects(accessToken, orgId!, selectedWorkspaceId!),
        enabled: !!orgId && !!selectedWorkspaceId
    });

    const workspaceItems = wq.data?.items ?? [];

    const selectedWorkspace = useMemo(
        () => workspaceItems.find((w) => w.id === selectedWorkspaceId) ?? null,
        [workspaceItems, selectedWorkspaceId]
    );

    async function createWsQuick() {
        await createWorkspace(accessToken, orgId!, { name: `Workspace ${new Date().toISOString()}` }, nanoid());
        await wq.refetch();
    }

    async function createProjectQuick() {
        if (!selectedWorkspaceId) return;
        await createProject(accessToken, { orgId: orgId!, workspaceId: selectedWorkspaceId, name: `Project ${new Date().toISOString()}` }, nanoid());
        await pq.refetch();
    }

    return (
        <Container>
            <Stack gap={12}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <strong>Org: {orgId}</strong>
                        <ButtonPrimary onClick={() => void createWsQuick()}>Create Workspace</ButtonPrimary>
                    </div>
                </Card>

                {wq.isLoading ? <div>Loading workspaces...</div> : null}
                {wq.isError ? <div style={{ color: '#b91c1c' }}>{(wq.error as any)?.message ?? 'error'}</div> : null}

                <WorkspaceList items={workspaceItems} onSelect={(id) => setSelectedWorkspaceId(id)} />

                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <strong>Projects {selectedWorkspace ? `in ${selectedWorkspace.name}` : ''}</strong>
                        <ButtonPrimary disabled={!selectedWorkspaceId} onClick={() => void createProjectQuick()}>
                            Create Project
                        </ButtonPrimary>
                    </div>
                </Card>

                {pq.isLoading ? <div>Loading projects...</div> : null}
                {pq.data ? (
                    <Stack gap={10}>
                        {pq.data.items.map((p) => (
                            <Card key={p.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ color: '#6b7280', fontSize: 12 }}>{p.key}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </Stack>
                ) : null}
            </Stack>
        </Container>
    );
}
