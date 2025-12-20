import { Container } from '../layout/Container';
import { AuthPanel } from '../components/auth/AuthPanel';

export function AuthPage() {
    return (
        <Container>
            <div style={{ paddingTop: 40 }}>
                <AuthPanel />
            </div>
        </Container>
    );
}
