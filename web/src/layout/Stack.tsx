export function Stack(props: { children: React.ReactNode; gap?: number; direction?: 'row' | 'column'; style?: React.CSSProperties }) {
    const dir = props.direction ?? 'column';
    const gap = props.gap ?? 10;
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: dir,
                gap,
                ...(props.style ?? {})
            }}
        >
            {props.children}
        </div>
    );
}
