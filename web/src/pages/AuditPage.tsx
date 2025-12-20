import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../state/auth/AuthContext';
import { listAudit } from '../api/audit';
import { Container } from '../layout/Container';
import { Stack } from '../layout/Stack';
import { Card } from '../atoms/surface/Card';
import { Loader } from '../atoms/feedback/Loader';

export function AuditPage() {
    const { state } = useAuth();
    const accessToken = state.accessToken!;

    const q = useQuery({
        queryKey: ['audit', 'me'],
        queryFn: () => listAudit(accessToken, { limit: 50, orgId: undefined, projectId: undefined })
    });

    return (
        <Container>
            <Stack gap={12}>
                <Card>
                    <strong>Audit</strong>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                        Pass orgId or projectId in API calls for scoped audit. This page currently shows an error until you wire a scope.
                    </div>
                </Card>

                {q.isLoading ? <Loader /> : null}
                {q.isError ? <div style={{ color: '#b91c1c' }}>{(q.error as any)?.message ?? 'error'}</div> : null}
                {q.data ? (
                    <Stack gap={10}>
                        {q.data.items.map((i) => (
                            <Card key={i.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {i.entityType}:{String(i.entityId)}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: 12 }}>{i.action}</div>
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12 }}>{i.ts}</div>
                                </div>
                            </Card>
                        ))}
                    </Stack>
                ) : null}
            </Stack>
        </Container>
    );
}
