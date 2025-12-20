import type { ButtonHTMLAttributes } from 'react';

export function ButtonSecondary(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#111827',
                cursor: 'pointer',
                ...(props.style ?? {})
            }}
        />
    );
}
