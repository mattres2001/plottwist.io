import crypto from 'crypto'

export function generateSessionCode(length = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    return Array.from(array, x => chars[x % chars.length]).join('');
}