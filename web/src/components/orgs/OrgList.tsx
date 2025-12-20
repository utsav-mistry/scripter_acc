import { Link } from 'react-router-dom';
import type { Org } from '../../api/orgs';
import { Card } from '../../atoms/surface/Card';
import { Stack } from '../../layout/Stack';

export function OrgList(props: { items: Org[] }) {
    return (
        <Stack gap={10}>
            {props.items.map((o) => (
                <Card key={o.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{o.name}</div>
                            <div style={{ color: '#6b7280', fontSize: 12 }}>{o.slug} · {o.plan}</div>
                        </div>
                        <Link to={`/orgs/${o.id}`}>Open</Link>
                    </div>
                </Card>
            ))}
        </Stack>
    );
}
