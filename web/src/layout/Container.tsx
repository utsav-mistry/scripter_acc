export function Container(props: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div
            style={{
                maxWidth: 1100,
                margin: '0 auto',
                padding: 16,
                ...(props.style ?? {})
            }}
        >
            {props.children}
        </div>
    );
}
