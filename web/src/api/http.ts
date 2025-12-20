export type ApiError = {
    error: string;
    message?: string;
    requestId?: string;
};

async function readJsonSafe(res: Response) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {})
        },
        credentials: 'include'
    });

    const body = await readJsonSafe(res);

    if (!res.ok) {
        const err = (body ?? { error: 'http_error' }) as ApiError;
        throw Object.assign(new Error(err.message ?? err.error ?? 'request_failed'), {
            status: res.status,
            details: err
        });
    }

    return body as T;
}
