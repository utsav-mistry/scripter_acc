import type { ButtonHTMLAttributes } from 'react';

export function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
    return (
        <button
            {...props}
            aria-label={props.label}
            title={props.label}
            style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(props.style ?? {})
            }}
        />
    );
}
