import type { Workspace } from '../../api/orgs';
import { Card } from '../../atoms/surface/Card';
import { Stack } from '../../layout/Stack';

export function WorkspaceList(props: { items: Workspace[]; onSelect?: (id: string) => void }) {
    return (
        <Stack gap={10}>
            {props.items.map((w) => (
                <Card key={w.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{w.name}</div>
                            <div style={{ color: '#6b7280', fontSize: 12 }}>{w.key}</div>
                        </div>
                        {props.onSelect ? (
                            <button onClick={() => props.onSelect?.(w.id)} style={{ cursor: 'pointer' }}>
                                Select
                            </button>
                        ) : null}
                    </div>
                </Card>
            ))}
        </Stack>
    );
}
