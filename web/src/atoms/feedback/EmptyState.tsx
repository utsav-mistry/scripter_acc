import { Card } from '../surface/Card';
import { MutedText } from '../text/MutedText';

export function EmptyState(props: { title: string; description?: string }) {
    return (
        <Card>
            <div style={{ fontWeight: 600 }}>{props.title}</div>
            {props.description ? <MutedText>{props.description}</MutedText> : null}
        </Card>
    );
}
