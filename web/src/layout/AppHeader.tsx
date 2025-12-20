import { Link } from 'react-router-dom';
import { useAuth } from '../state/auth/AuthContext';
import { ButtonSecondary } from '../atoms/buttons/ButtonSecondary';

export function AppHeader() {
    const { state, actions } = useAuth();

    return (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong>PM Suite</strong>
                <nav style={{ display: 'flex', gap: 10 }}>
                    <Link to="/">Home</Link>
                    <Link to="/orgs">Orgs</Link>
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {state.user ? (
                    <>
                        <span style={{ color: '#374151' }}>{state.user.email}</span>
                        <ButtonSecondary onClick={() => void actions.logout()}>Logout</ButtonSecondary>
                    </>
                ) : (
                    <Link to="/auth">Login</Link>
                )}
            </div>
        </header>
    );
}
