import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 32768;
const OPTIONS = { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, OPTIONS, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  return `scrypt$${N}$8$1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const pieces = stored.split('$');
  if (
    pieces.length !== 6 ||
    pieces[0] !== 'scrypt' ||
    pieces[1] !== String(N) ||
    pieces[2] !== '8' ||
    pieces[3] !== '1' ||
    !/^[a-f0-9]{32}$/.test(pieces[4]) ||
    !/^[a-f0-9]{128}$/.test(pieces[5])
  )
    return false;
  const hash = await derive(password, Buffer.from(pieces[4], 'hex'));
  return timingSafeEqual(hash, Buffer.from(pieces[5], 'hex'));
}

export function secretEqual(left: string, right: string) {
  return timingSafeEqual(
    createHash('sha256').update(left).digest(),
    createHash('sha256').update(right).digest(),
  );
}

export function sessionToken() {
  return randomBytes(32).toString('base64url');
}
export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
