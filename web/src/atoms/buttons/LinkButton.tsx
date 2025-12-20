import type { ButtonHTMLAttributes } from 'react';

export function LinkButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                cursor: 'pointer',
                textDecoration: 'underline',
                ...(props.style ?? {})
            }}
        />
    );
}
