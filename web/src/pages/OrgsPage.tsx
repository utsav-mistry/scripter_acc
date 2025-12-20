import { useQuery } from '@tanstack/react-query';

import { listOrgs, createOrg } from '../api/orgs';
import { useAuth } from '../state/auth/AuthContext';
import { Container } from '../layout/Container';
import { Stack } from '../layout/Stack';
import { OrgList } from '../components/orgs/OrgList';
import { Card } from '../atoms/surface/Card';
import { TextInput } from '../atoms/inputs/TextInput';
import { ButtonPrimary } from '../atoms/buttons/ButtonPrimary';
import { randomId } from '../lib/id';

export function OrgsPage() {
    const { state } = useAuth();
    const accessToken = state.accessToken!;

    const q = useQuery({
        queryKey: ['orgs'],
        queryFn: () => listOrgs(accessToken)
    });

    async function createQuick() {
        await createOrg(accessToken, { name: `Org ${new Date().toISOString()}` }, randomId(12));
        await q.refetch();
    }

    return (
        <Container>
            <Stack gap={12}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <strong>Organizations</strong>
                        <ButtonPrimary onClick={() => void createQuick()}>Create</ButtonPrimary>
                    </div>
                </Card>

                {q.isLoading ? <div>Loading...</div> : null}
                {q.isError ? <div style={{ color: '#b91c1c' }}>{(q.error as any)?.message ?? 'error'}</div> : null}
                {q.data ? <OrgList items={q.data.items} /> : null}
            </Stack>
        </Container>
    );
}
