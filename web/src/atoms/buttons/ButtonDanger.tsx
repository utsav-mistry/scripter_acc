import type { ButtonHTMLAttributes } from 'react';

export function ButtonDanger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #b91c1c',
                background: '#b91c1c',
                color: '#fff',
                cursor: 'pointer',
                ...(props.style ?? {})
            }}
        />
    );
}
