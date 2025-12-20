import createHttpError from './httpError.js';

export type Validator<T> = (input: unknown) => T;

type Dict = Record<string, unknown>;

export function isRecord(v: unknown): v is Dict {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function requireRecord(v: unknown, code = 'invalid_body'): Dict {
    if (!isRecord(v)) throw createHttpError(400, code);
    return v;
}

export function requireString(v: unknown, code = 'invalid_body'): string {
    if (typeof v !== 'string') throw createHttpError(400, code);
    return v;
}

export function optionalString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
}

export function requireStringMinMax(v: unknown, min: number, max: number, code = 'invalid_body') {
    const s = requireString(v, code).trim();
    if (s.length < min || s.length > max) throw createHttpError(400, code);
    return s;
}

export function optionalStringMinMax(v: unknown, min: number, max: number, code = 'invalid_body') {
    const s = optionalString(v);
    if (s === undefined) return undefined;
    const t = s.trim();
    if (t.length < min || t.length > max) throw createHttpError(400, code);
    return t;
}

export function requireEnum<T extends string>(v: unknown, allowed: readonly T[], code = 'invalid_body'): T {
    const s = requireString(v, code);
    if (!(allowed as readonly string[]).includes(s)) throw createHttpError(400, code);
    return s as T;
}

export function optionalEnum<T extends string>(v: unknown, allowed: readonly T[], code = 'invalid_body'): T | undefined {
    if (v === undefined) return undefined;
    return requireEnum(v, allowed, code);
}

export function requireBoolean(v: unknown, code = 'invalid_body') {
    if (typeof v !== 'boolean') throw createHttpError(400, code);
    return v;
}

export function optionalBoolean(v: unknown) {
    return typeof v === 'boolean' ? v : undefined;
}

export function requireNumberInt(v: unknown, code = 'invalid_body') {
    if (typeof v !== 'number' || !Number.isInteger(v)) throw createHttpError(400, code);
    return v;
}

export function optionalNumberInt(v: unknown) {
    return typeof v === 'number' && Number.isInteger(v) ? v : undefined;
}

export function coerceInt(v: unknown, code = 'invalid_query') {
    if (typeof v === 'number' && Number.isInteger(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isInteger(n)) return n;
    }
    throw createHttpError(400, code);
}

export function optionalCoerceInt(v: unknown, code = 'invalid_query') {
    if (v === undefined) return undefined;
    return coerceInt(v, code);
}

export function requireRegex(v: unknown, re: RegExp, code = 'invalid_body') {
    const s = requireString(v, code);
    if (!re.test(s)) throw createHttpError(400, code);
    return s;
}

export function optionalRegex(v: unknown, re: RegExp, code = 'invalid_body') {
    if (v === undefined) return undefined;
    return requireRegex(v, re, code);
}

export function optionalNullableString(v: unknown, code = 'invalid_body'): string | null | undefined {
    if (v === undefined) return undefined;
    if (v === null) return null;
    return requireString(v, code);
}

export function optionalNullableIsoDate(v: unknown, code = 'invalid_body'): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const s = requireString(v, code);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw createHttpError(400, code);
    return d;
}

export function optionalIsoDate(v: unknown, code = 'invalid_body'): Date | undefined {
    if (v === undefined) return undefined;
    const s = requireString(v, code);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw createHttpError(400, code);
    return d;
}
