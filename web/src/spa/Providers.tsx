import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../state/auth/AuthContext';

const queryClient = new QueryClient();

export function Providers(props: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{props.children}</AuthProvider>
        </QueryClientProvider>
    );
}
