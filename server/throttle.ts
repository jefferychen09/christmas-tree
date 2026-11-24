import { sha256Hex } from './crypto';
import { now } from './http';

/** 在时间窗口内已经达到上限了吗 */
export async function isLimited(env: Env, key: string, max: number): Promise<boolean> {
  const row = await env.DB.prepare('SELECT count FROM throttle WHERE key = ? AND reset_at > ?')
    .bind(key, now())
    .first<{ count: number }>();
  return !!row && row.count >= max;
}

/** 计一次；窗口过期后从 1 重新开始 */
export async function bump(env: Env, key: string, windowSeconds: number): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO throttle (key, count, reset_at) VALUES (?1, 1, ?2 + ?3)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN reset_at <= ?2 THEN 1 ELSE count + 1 END,
       reset_at = CASE WHEN reset_at <= ?2 THEN ?2 + ?3 ELSE reset_at END`,
  )
    .bind(key, now(), windowSeconds)
    .run();
  // 偶尔顺手清掉早就过期的记录，表不会越积越大
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM throttle WHERE reset_at < ?').bind(now()).run();
}

export async function clearLimit(env: Env, key: string): Promise<void> {
  await env.DB.prepare('DELETE FROM throttle WHERE key = ?').bind(key).run();
}

/** 访客 IP 的哈希（只用于限流，不存原始 IP） */
export async function ipKey(req: Request): Promise<string> {
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  return (await sha256Hex(`christmas-tree:${ip}`)).slice(0, 20);
}
