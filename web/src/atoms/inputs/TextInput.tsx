import type { InputHTMLAttributes } from 'react';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                width: '100%',
                ...(props.style ?? {})
            }}
        />
    );
}
