import { Container } from '../layout/Container';
import { AppHeader } from '../layout/AppHeader';
import { SpaRoutes } from './SpaRoutes';

export function RootApp() {
    return (
        <div style={{ fontFamily: 'system-ui', background: '#f9fafb', minHeight: '100vh' }}>
            <Container>
                <AppHeader />
            </Container>
            <SpaRoutes />
        </div>
    );
}
