import { useState } from 'react';
import { useAuth } from '../../state/auth/AuthContext';
import { Card } from '../../atoms/surface/Card';
import { Stack } from '../../layout/Stack';
import { TextInput } from '../../atoms/inputs/TextInput';
import { ButtonPrimary } from '../../atoms/buttons/ButtonPrimary';
import { ButtonSecondary } from '../../atoms/buttons/ButtonSecondary';

export function AuthPanel() {
    const { actions } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function submit() {
        setErr(null);
        setBusy(true);
        try {
            if (mode === 'login') await actions.login({ email, password });
            else await actions.register({ email, password, name });
        } catch (e: any) {
            setErr(e?.message ?? 'failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Card style={{ maxWidth: 420 }}>
            <Stack gap={10}>
                <strong>{mode === 'login' ? 'Login' : 'Register'}</strong>
                {mode === 'register' ? <TextInput placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /> : null}
                <TextInput placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextInput placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {err ? <div style={{ color: '#b91c1c' }}>{err}</div> : null}
                <ButtonPrimary disabled={busy} onClick={() => void submit()}>
                    {busy ? '...' : 'Submit'}
                </ButtonPrimary>
                <ButtonSecondary disabled={busy} onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}>
                    Switch to {mode === 'login' ? 'Register' : 'Login'}
                </ButtonSecondary>
            </Stack>
        </Card>
    );
}
