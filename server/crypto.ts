const enc = new TextEncoder();

// 免费版 Workers 每个请求只有约 10ms CPU：6 万次 PBKDF2 大约 4ms，留出余量。
// 迭代次数存在每个哈希里，以后调高时，老用户下次登录会自动升级
export const PBKDF2_ITERATIONS = 60_000;

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

/** ok：密码对不对；needsRehash：存的迭代次数低于现在的标准，登录成功后顺便重算 */
export async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  const [algo, iterText, salt, hash] = stored.split('$');
  const iterations = Number(iterText);
  if (algo !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 1 || !salt || !hash) {
    return { ok: false, needsRehash: false };
  }
  const actual = await pbkdf2(password, fromB64(salt), iterations);
  return { ok: sameBytes(actual, fromB64(hash)), needsRehash: iterations < PBKDF2_ITERATIONS };
}

/** 逐字节比较且耗时固定，避免通过响应时间猜哈希 */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** 登录令牌：32 字节随机数，base64url */
export function randomToken(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 管理员重置密码时生成的临时密码：去掉容易看错的 i l o 0 1
const TEMP_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function tempPassword(length = 10): string {
  const limit = 256 - (256 % TEMP_ALPHABET.length); // 丢掉会造成偏差的随机字节
  let out = '';
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && out.length < length) out += TEMP_ALPHABET[b % TEMP_ALPHABET.length];
    }
  }
  return out;
}
