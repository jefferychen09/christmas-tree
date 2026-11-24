/** 接口出错时抛出，最外层统一转成 { error: 'code' }，前端按 code 显示对应语言的提示 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

/** 读 JSON 请求体；超过 maxBytes 直接拒绝 */
export async function readJson(req: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (Number(req.headers.get('Content-Length') || 0) > maxBytes) throw new HttpError(413, 'too_large');
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large');
  try {
    const data: unknown = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    /* 落到下面统一报错 */
  }
  throw new HttpError(400, 'bad_request');
}

/** GitHub Pages 镜像、本地开发等其他网址调用接口时需要的 CORS 头 */
export function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env.CORS_ORIGINS || '').split(',').map((s) => s.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

export const PREFLIGHT_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const now = () => Math.floor(Date.now() / 1000);
