import type { Task } from '../../api/tasks';
import { Card } from '../../atoms/surface/Card';
import { Stack } from '../../layout/Stack';
import { MutedText } from '../../atoms/text/MutedText';

export function KanbanColumn(props: { title: string; items: Task[]; onOpenTask?: (id: string) => void }) {
    return (
        <div style={{ minWidth: 280 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{props.title}</div>
            <Stack gap={10}>
                {props.items.map((t) => (
                    <Card key={t.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => props.onOpenTask?.(t.id)}>
                                {t.title}
                            </div>
                            <MutedText>prio {t.priority}</MutedText>
                        </div>
                    </Card>
                ))}
            </Stack>
        </div>
    );
}
