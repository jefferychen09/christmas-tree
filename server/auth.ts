import { hashPassword, randomToken, sha256Hex, tempPassword, verifyPassword } from './crypto';
import { HttpError, json, now, readJson } from './http';
import { bump, clearLimit, ipKey, isLimited } from './throttle';

const SESSION_DAYS = 60;
const NAME_MIN = 2;
const NAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
// 用户名：任何语言的文字、数字和 _ . -，中间可以有单个空格
const NAME_RE = /^[\p{L}\p{M}\p{N}_.-]+(?: [\p{L}\p{M}\p{N}_.-]+)*$/u;

export interface SessionUser {
  id: number;
  name: string;
  admin: boolean;
  tokenHash: string;
}

const publicUser = (u: { id: number; name: string; admin: boolean }) => ({ id: u.id, name: u.name, admin: u.admin });

/** 统一用户名写法：全角转半角、去掉首尾空格、多个空格合成一个 */
const normalizeName = (raw: unknown) => (typeof raw === 'string' ? raw.normalize('NFKC').trim().replace(/\s+/g, ' ') : '');
/** 判断重名时不区分大小写 */
const nameKey = (name: string) => name.toLowerCase();

function validName(raw: unknown): string {
  const name = normalizeName(raw);
  const length = [...name].length;
  if (length < NAME_MIN || length > NAME_MAX || !NAME_RE.test(name)) throw new HttpError(400, 'bad_name');
  return name;
}

function validPassword(raw: unknown): string {
  if (typeof raw !== 'string') throw new HttpError(400, 'bad_password');
  const length = [...raw].length;
  if (length < PASSWORD_MIN || length > PASSWORD_MAX) throw new HttpError(400, 'bad_password');
  return raw;
}

async function createSession(env: Env, userId: number): Promise<string> {
  const token = randomToken();
  const t = now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(
      await sha256Hex(token),
      userId,
      t + SESSION_DAYS * 86400,
    ),
  ]);
  return token;
}

/** 从 Authorization: Bearer <token> 找到当前登录的用户 */
export async function currentUser(req: Request, env: Env): Promise<SessionUser | null> {
  const match = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(req.headers.get('Authorization') || '');
  if (!match) return null;
  const tokenHash = await sha256Hex(match[1]);
  const row = await env.DB.prepare(
    `SELECT u.id, u.name, u.is_admin FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(tokenHash, now())
    .first<{ id: number; name: string; is_admin: number }>();
  return row ? { id: row.id, name: row.name, admin: row.is_admin === 1, tokenHash } : null;
}

export async function requireUser(req: Request, env: Env): Promise<SessionUser> {
  const user = await currentUser(req, env);
  if (!user) throw new HttpError(401, 'unauthorized');
  return user;
}

export async function register(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req, 4096);
  const name = validName(body.name);
  const password = validPassword(body.password);

  // 同一个 IP 一小时最多注册 10 个账号
  const limitKey = `reg:${await ipKey(req)}`;
  if (await isLimited(env, limitKey, 10)) throw new HttpError(429, 'too_many');
  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE name_key = ?').bind(nameKey(name)).first();
  if (taken) throw new HttpError(409, 'name_taken');
  await bump(env, limitKey, 3600);

  const pass = await hashPassword(password);
  let id: number;
  try {
    const result = await env.DB.prepare('INSERT INTO users (name, name_key, pass, created_at) VALUES (?, ?, ?, ?)')
      .bind(name, nameKey(name), pass, now())
      .run();
    id = Number(result.meta.last_row_id);
  } catch (err) {
    // 两个人同时注册同一个名字
    if (String(err).includes('UNIQUE')) throw new HttpError(409, 'name_taken');
    throw err;
  }
  const token = await createSession(env, id);
  return json({ token, user: publicUser({ id, name, admin: false }) }, 201);
}

export async function login(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req, 4096);
  const name = normalizeName(body.name);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name || !password) throw new HttpError(401, 'wrong_login');

  // 同一个账号 15 分钟内最多错 8 次；同一个 IP 最多错 30 次
  const userKey = `login:${nameKey(name)}`;
  const addrKey = `loginip:${await ipKey(req)}`;
  if ((await isLimited(env, userKey, 8)) || (await isLimited(env, addrKey, 30))) throw new HttpError(429, 'too_many');

  const row = await env.DB.prepare('SELECT id, name, pass, is_admin FROM users WHERE name_key = ?')
    .bind(nameKey(name))
    .first<{ id: number; name: string; pass: string; is_admin: number }>();
  const check = row ? await verifyPassword(password, row.pass) : { ok: false, needsRehash: false };
  if (!row || !check.ok) {
    await bump(env, userKey, 900);
    await bump(env, addrKey, 900);
    throw new HttpError(401, 'wrong_login');
  }

  await clearLimit(env, userKey);
  if (check.needsRehash) {
    await env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(password), row.id).run();
  }
  const token = await createSession(env, row.id);
  return json({ token, user: publicUser({ id: row.id, name: row.name, admin: row.is_admin === 1 }) });
}

export async function logout(req: Request, env: Env): Promise<Response> {
  const user = await currentUser(req, env);
  if (user) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
  return json({ ok: true });
}

export async function me(req: Request, env: Env): Promise<Response> {
  return json({ user: publicUser(await requireUser(req, env)) });
}

export async function changePassword(req: Request, env: Env): Promise<Response> {
  const user = await requireUser(req, env);
  const body = await readJson(req, 4096);
  const next = validPassword(body.newPassword);
  const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';

  const limitKey = `pw:${user.id}`;
  if (await isLimited(env, limitKey, 8)) throw new HttpError(429, 'too_many');
  const row = await env.DB.prepare('SELECT pass FROM users WHERE id = ?').bind(user.id).first<{ pass: string }>();
  if (!row || !(await verifyPassword(current, row.pass)).ok) {
    await bump(env, limitKey, 900);
    throw new HttpError(403, 'wrong_password');
  }
  // 改密码后，其他设备上的登录全部失效，只保留现在这个
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(next), user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(user.id, user.tokenHash),
  ]);
  await clearLimit(env, limitKey);
  return json({ ok: true });
}

/** 管理员给忘记密码的人生成一个临时密码 */
export async function adminResetPassword(req: Request, env: Env): Promise<Response> {
  const admin = await requireUser(req, env);
  if (!admin.admin) throw new HttpError(403, 'forbidden');
  const body = await readJson(req, 4096);
  const name = normalizeName(body.name);
  const row = await env.DB.prepare('SELECT id, name FROM users WHERE name_key = ?')
    .bind(nameKey(name))
    .first<{ id: number; name: string }>();
  if (!row) throw new HttpError(404, 'no_such_user');

  const password = tempPassword();
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(password), row.id),
    // 让 TA 在所有设备上重新登录（管理员重置自己时，保留当前这次登录）
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(row.id, admin.tokenHash),
    env.DB.prepare('DELETE FROM throttle WHERE key = ?').bind(`login:${nameKey(row.name)}`),
  ]);
  return json({ name: row.name, password });
}
