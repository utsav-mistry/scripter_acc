import createHttpError from 'http-errors';

export type MultipartFilePart = {
    fieldName: string;
    filename: string;
    contentType: string;
    data: Buffer;
};

export type MultipartParsed = {
    fields: Record<string, string>;
    files: MultipartFilePart[];
};

function parseContentType(header: string | undefined) {
    if (!header) return null;
    const [type, ...params] = header.split(';').map((s) => s.trim());
    const map: Record<string, string> = {};
    for (const p of params) {
        const idx = p.indexOf('=');
        if (idx === -1) continue;
        const k = p.slice(0, idx).trim().toLowerCase();
        let v = p.slice(idx + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        map[k] = v;
    }
    return { type: type.toLowerCase(), params: map };
}

function parseDisposition(header: string | undefined) {
    if (!header) return null;
    const [type, ...params] = header.split(';').map((s) => s.trim());
    const map: Record<string, string> = {};
    for (const p of params) {
        const idx = p.indexOf('=');
        if (idx === -1) continue;
        const k = p.slice(0, idx).trim().toLowerCase();
        let v = p.slice(idx + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        map[k] = v;
    }
    return { type: type.toLowerCase(), params: map };
}

function splitHeaderBody(part: Buffer) {
    const sep = Buffer.from('\r\n\r\n');
    const i = part.indexOf(sep);
    if (i === -1) return null;
    const head = part.slice(0, i).toString('utf8');
    const body = part.slice(i + sep.length);
    return { head, body };
}

function parseHeaders(head: string) {
    const headers: Record<string, string> = {};
    const lines = head.split('\r\n');
    for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const k = line.slice(0, idx).trim().toLowerCase();
        const v = line.slice(idx + 1).trim();
        headers[k] = v;
    }
    return headers;
}

export function parseMultipartFormData(input: { contentTypeHeader: string | undefined; body: Buffer; maxFiles?: number }): MultipartParsed {
    const ct = parseContentType(input.contentTypeHeader);
    if (!ct || ct.type !== 'multipart/form-data') throw createHttpError(400, 'invalid_content_type');

    const boundary = ct.params['boundary'];
    if (!boundary) throw createHttpError(400, 'missing_boundary');

    const maxFiles = input.maxFiles ?? 5;

    const boundaryDelim = Buffer.from(`--${boundary}`);
    const endDelim = Buffer.from(`--${boundary}--`);

    const body = input.body;
    if (!Buffer.isBuffer(body) || body.length === 0) throw createHttpError(400, 'empty_body');

    // Split by boundary markers.
    const parts: Buffer[] = [];
    let offset = 0;

    while (offset < body.length) {
        const start = body.indexOf(boundaryDelim, offset);
        if (start === -1) break;
        const isEnd = body.indexOf(endDelim, start) === start;

        // Find the next boundary occurrence to slice the part.
        const next = body.indexOf(boundaryDelim, start + boundaryDelim.length);
        if (next === -1) break;

        // Skip boundary line and optional CRLF.
        let partStart = start + boundaryDelim.length;
        if (body.slice(partStart, partStart + 2).toString('utf8') === '--') {
            break;
        }
        if (body.slice(partStart, partStart + 2).toString('utf8') === '\r\n') partStart += 2;

        // Exclude trailing CRLF before the next boundary.
        let partEnd = next;
        if (body.slice(partEnd - 2, partEnd).toString('utf8') === '\r\n') partEnd -= 2;

        const part = body.slice(partStart, partEnd);
        if (part.length) parts.push(part);

        if (isEnd) break;
        offset = next;
    }

    const out: MultipartParsed = { fields: {}, files: [] };

    for (const p of parts) {
        const hb = splitHeaderBody(p);
        if (!hb) continue;
        const headers = parseHeaders(hb.head);

        const disp = parseDisposition(headers['content-disposition']);
        if (!disp || disp.type !== 'form-data') continue;

        const fieldName = disp.params['name'];
        if (!fieldName) continue;

        const filenameRaw = disp.params['filename'];
        if (filenameRaw) {
            if (out.files.length >= maxFiles) throw createHttpError(413, 'too_many_files');
            out.files.push({
                fieldName,
                filename: filenameRaw,
                contentType: headers['content-type'] ?? 'application/octet-stream',
                data: hb.body
            });
        } else {
            out.fields[fieldName] = hb.body.toString('utf8');
        }
    }

    return out;
}
