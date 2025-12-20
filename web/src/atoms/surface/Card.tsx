export function Card(props: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
                background: '#fff',
                ...(props.style ?? {})
            }}
        >
            {props.children}
        </div>
    );
}
