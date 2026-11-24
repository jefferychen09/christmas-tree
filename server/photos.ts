import { requireUser } from './auth';
import { HttpError, json, now, readJson } from './http';
import { bump, isLimited } from './throttle';

const LIST_LIMIT = 80; // 大家的树上挂最新的 80 张
const MAX_PER_USER = 40;
// 免费版 D1 单个数据库最多 500MB，每张照片约 0.2MB，留足余量
const MAX_TOTAL = 1500;
const MAX_FULL_B64 = 1_000_000;
const MAX_THUMB_B64 = 120_000;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

interface PhotoRow {
  id: number;
  user_id: number;
  name: string;
  created_at: number;
  thumb: string;
}

const toPublic = (r: PhotoRow) => ({ id: r.id, userId: r.user_id, by: r.name, at: r.created_at, thumb: r.thumb });

/** base64 编码的 JPEG（JPEG 文件头 FF D8 FF 编码后以 /9j/ 开头） */
const isJpegB64 = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.length <= maxLength &&
  value.length % 4 === 0 &&
  value.startsWith('/9j/') &&
  B64_RE.test(value);

const bumpVersion = (env: Env) => env.DB.prepare("UPDATE meta SET value = value + 1 WHERE key = 'photos_version'");

/** 大家的照片（最新的在前）。照片没有变化时返回 304，浏览器直接用缓存 */
export async function listPhotos(req: Request, env: Env): Promise<Response> {
  const version = await env.DB.prepare("SELECT value FROM meta WHERE key = 'photos_version'").first<{ value: number }>();
  const etag = `"v${version?.value ?? 0}"`;
  const headers = { 'Cache-Control': 'no-cache', ETag: etag };
  // Cloudflare 压缩响应时会把 ETag 变成弱 ETag（W/"…"），比较时去掉 W/
  const sent = (req.headers.get('If-None-Match') || '').split(',').map((s) => s.trim().replace(/^W\//, ''));
  if (sent.includes(etag)) return new Response(null, { status: 304, headers });

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.user_id, u.name, p.created_at, p.thumb
     FROM photos p JOIN users u ON u.id = p.user_id
     ORDER BY p.id DESC LIMIT ?`,
  )
    .bind(LIST_LIMIT)
    .all<PhotoRow>();
  return json({ photos: results.map(toPublic) }, 200, headers);
}

/** 我自己分享过的照片 */
export async function myPhotos(req: Request, env: Env): Promise<Response> {
  const user = await requireUser(req, env);
  const { results } = await env.DB.prepare(
    `SELECT id, user_id, ? AS name, created_at, thumb FROM photos WHERE user_id = ? ORDER BY id DESC`,
  )
    .bind(user.name, user.id)
    .all<PhotoRow>();
  return json({ photos: results.map(toPublic), limit: MAX_PER_USER });
}

export async function uploadPhoto(req: Request, env: Env): Promise<Response> {
  const user = await requireUser(req, env);
  const body = await readJson(req, MAX_FULL_B64 + MAX_THUMB_B64 + 1000);
  if (!isJpegB64(body.full, MAX_FULL_B64) || !isJpegB64(body.thumb, MAX_THUMB_B64)) throw new HttpError(400, 'bad_image');

  // 每人每小时最多上传 60 次
  const limitKey = `up:${user.id}`;
  if (await isLimited(env, limitKey, 60)) throw new HttpError(429, 'too_many');
  const [mine, all] = await env.DB.batch<{ n: number }>([
    env.DB.prepare('SELECT COUNT(*) AS n FROM photos WHERE user_id = ?').bind(user.id),
    env.DB.prepare('SELECT COUNT(*) AS n FROM photos'),
  ]);
  if ((mine.results[0]?.n ?? 0) >= MAX_PER_USER || (all.results[0]?.n ?? 0) >= MAX_TOTAL) {
    throw new HttpError(403, 'limit_reached');
  }
  await bump(env, limitKey, 3600);

  const t = now();
  const [inserted] = await env.DB.batch([
    env.DB.prepare('INSERT INTO photos (user_id, created_at, thumb, full) VALUES (?, ?, ?, ?)').bind(
      user.id,
      t,
      body.thumb,
      body.full,
    ),
    bumpVersion(env),
  ]);
  const id = Number(inserted.meta.last_row_id);
  return json({ photo: toPublic({ id, user_id: user.id, name: user.name, created_at: t, thumb: body.thumb }) }, 201);
}

/** 大图：照片 id 不会复用，内容也不会变，浏览器可以一直缓存 */
export async function getPhoto(env: Env, id: number): Promise<Response> {
  const row = await env.DB.prepare('SELECT full FROM photos WHERE id = ?').bind(id).first<{ full: string }>();
  if (!row) throw new HttpError(404, 'not_found');
  const binary = atob(row.full);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/** 上传者可以删自己的照片，管理员可以删任何一张 */
export async function deletePhoto(req: Request, env: Env, id: number): Promise<Response> {
  const user = await requireUser(req, env);
  const row = await env.DB.prepare('SELECT user_id FROM photos WHERE id = ?').bind(id).first<{ user_id: number }>();
  if (!row) throw new HttpError(404, 'not_found');
  if (row.user_id !== user.id && !user.admin) throw new HttpError(403, 'forbidden');
  await env.DB.batch([env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id), bumpVersion(env)]);
  return json({ ok: true });
}
