import { createContext, useContext, useMemo, useState } from 'react';
import * as AuthApi from '../../api/auth';

export type AuthState = {
    accessToken: string | null;
    user: AuthApi.AuthUser | null;
};

type AuthContextValue = {
    state: AuthState;
    actions: {
        register: (input: { email: string; password: string; name: string }) => Promise<void>;
        login: (input: { email: string; password: string }) => Promise<void>;
        logout: () => Promise<void>;
    };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ accessToken: null, user: null });

    const actions = useMemo(
        () => ({
            async register(input: { email: string; password: string; name: string }) {
                const res = await AuthApi.register(input);
                setState({ accessToken: res.accessToken, user: res.user });
            },
            async login(input: { email: string; password: string }) {
                const res = await AuthApi.login(input);
                setState({ accessToken: res.accessToken, user: res.user });
            },
            async logout() {
                await AuthApi.logout();
                setState({ accessToken: null, user: null });
            }
        }),
        []
    );

    return <AuthContext.Provider value={{ state, actions }}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('AuthProvider missing');
    return ctx;
}
