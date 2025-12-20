import { Routes, Route, Navigate, Link } from 'react-router-dom';

export function App() {
    return (
        <div style={{ fontFamily: 'system-ui', padding: 16 }}>
            <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <strong>PM Suite</strong>
                <nav style={{ display: 'flex', gap: 10 }}>
                    <Link to="/">Home</Link>
                    <Link to="/orgs">Orgs</Link>
                    <Link to="/projects">Projects</Link>
                    <Link to="/tasks">Tasks</Link>
                </nav>
            </header>
            <hr />
            <Routes>
                <Route path="/" element={<div>Welcome</div>} />
                <Route path="/orgs" element={<div>Organizations</div>} />
                <Route path="/projects" element={<div>Projects</div>} />
                <Route path="/tasks" element={<div>Tasks</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
