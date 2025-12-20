import { Container } from '../layout/Container';
import { Card } from '../atoms/surface/Card';

export function HomePage() {
    return (
        <Container>
            <Card>
                <strong>Welcome</strong>
                <div style={{ marginTop: 8, color: '#374151' }}>
                    Enterprise-ish project management suite scaffold.
                </div>
            </Card>
        </Container>
    );
}
