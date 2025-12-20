import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'storage');

export async function ensureDir(p: string) {
    await fs.mkdir(p, { recursive: true });
}

export function storageRoot() {
    return ROOT;
}

export function taskAttachmentDir(taskId: string) {
    return path.join(ROOT, 'tasks', taskId, 'attachments');
}
