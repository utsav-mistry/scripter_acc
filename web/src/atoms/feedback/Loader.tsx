export function Loader(props: { label?: string }) {
    return <div style={{ color: '#374151' }}>{props.label ?? 'Loading...'}</div>;
}
