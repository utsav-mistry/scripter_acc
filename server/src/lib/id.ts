import crypto from 'node:crypto';

export function randomId(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}
