import { Navigate } from 'react-router-dom';
import { useAuth } from '../../state/auth/AuthContext';

export function AuthGate(props: { children: React.ReactNode }) {
    const { state } = useAuth();
    if (!state.accessToken) return <Navigate to="/auth" replace />;
    return <>{props.children}</>;
}
