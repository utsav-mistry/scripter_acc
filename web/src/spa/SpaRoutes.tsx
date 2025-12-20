import { Routes, Route, Navigate } from 'react-router-dom';

import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { OrgsPage } from '../pages/OrgsPage';
import { OrgDetailPage } from '../pages/OrgDetailPage';
import { ProjectKanbanPage } from '../pages/ProjectKanbanPage';
import { AuditPage } from '../pages/AuditPage';
import { AuthGate } from '../components/auth/AuthGate';

export function SpaRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route
                path="/orgs"
                element={
                    <AuthGate>
                        <OrgsPage />
                    </AuthGate>
                }
            />
            <Route
                path="/orgs/:orgId"
                element={
                    <AuthGate>
                        <OrgDetailPage />
                    </AuthGate>
                }
            />

            <Route
                path="/projects/:projectId/kanban"
                element={
                    <AuthGate>
                        <ProjectKanbanPage />
                    </AuthGate>
                }
            />

            <Route
                path="/audit"
                element={
                    <AuthGate>
                        <AuditPage />
                    </AuthGate>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
