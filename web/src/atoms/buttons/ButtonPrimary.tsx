import type { ButtonHTMLAttributes } from 'react';

export function ButtonPrimary(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #111827',
                background: '#111827',
                color: '#fff',
                cursor: 'pointer',
                ...(props.style ?? {})
            }}
        />
    );
}
