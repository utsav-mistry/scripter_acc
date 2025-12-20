export function Heading(props: { children: React.ReactNode; level?: 1 | 2 | 3 }) {
    const level = props.level ?? 2;
    const fontSize = level === 1 ? 24 : level === 2 ? 18 : 14;
    return <div style={{ fontWeight: 700, fontSize }}>{props.children}</div>;
}
