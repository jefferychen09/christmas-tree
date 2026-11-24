/** 「大家的树」后端接口：账号 + 大家分享的照片（Cloudflare Pages Functions + D1，代码在 server/） */

// 在线预览版（claude.ai）连不上我们的服务器，构建时用 VITE_DISABLE_CLOUD=1 关掉登录和大家的树
export const CLOUD_ENABLED = import.meta.env.VITE_DISABLE_CLOUD !== '1';
// GitHub Pages 镜像本身没有后端，构建时用 VITE_API_BASE 指向 Cloudflare 上的网站
const BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

export interface User {
  id: number;
  name: string;
  admin: boolean;
}

export interface SharedPhoto {
  id: number;
  userId: number;
  /** 上传者的用户名 */
  by: string;
  /** 上传时间（秒） */
  at: number;
  /** 256px 小图，base64 JPEG */
  thumb: string;
}

/** code 对应 i18n 里 errors 的键 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
  ) {
    super(code);
  }
}

// ---------------- 登录状态（存在浏览器里，下次打开还是登录着） ----------------
const TOKEN_KEY = 'christmas-tree-token';
const USER_KEY = 'christmas-tree-user';
let memory: { token: string | null; user: User | null } = { token: null, user: null };

export function loadSession(): { token: string; user: User } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null;
    if (token && user) memory = { token, user };
  } catch {
    /* 隐私模式等拿不到 localStorage：只在这次打开期间保持登录 */
  }
  return memory.token && memory.user ? { token: memory.token, user: memory.user } : null;
}

export function saveSession(token: string | null, user: User | null) {
  memory = { token, user };
  try {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* 同上 */
  }
}

// ---------------- 请求 ----------------
async function call<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (auth && memory.token) headers.set('Authorization', `Bearer ${memory.token}`);
  if (rest.body) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...rest, headers });
  } catch {
    throw new ApiError('network');
  }
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new ApiError(data?.error || 'server', res.status);
  return data as T;
}

const post = (body: unknown, auth = true): RequestInit & { auth?: boolean } => ({
  method: 'POST',
  body: JSON.stringify(body),
  auth,
});

type Session = { token: string; user: User };

export const api = {
  register: (name: string, password: string) => call<Session>('/api/register', post({ name, password }, false)),
  login: (name: string, password: string) => call<Session>('/api/login', post({ name, password }, false)),
  logout: () => call<{ ok: true }>('/api/logout', { method: 'POST' }),
  me: () => call<{ user: User }>('/api/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: true }>('/api/password', post({ currentPassword, newPassword })),
  resetPassword: (name: string) => call<{ name: string; password: string }>('/api/admin/reset-password', post({ name })),
  // 不带登录信息，跨域时也是「简单请求」；no-cache：每次都问服务器有没有新照片，没有就用缓存
  photos: () => call<{ photos: SharedPhoto[] }>('/api/photos', { auth: false, cache: 'no-cache' }),
  myPhotos: () => call<{ photos: SharedPhoto[]; limit: number }>('/api/me/photos'),
  upload: (full: string, thumb: string) => call<{ photo: SharedPhoto }>('/api/photos', post({ full, thumb })),
  remove: (id: number) => call<{ ok: true }>(`/api/photos/${id}`, { method: 'DELETE' }),
};

export const photoUrl = (id: number) => `${BASE}/api/photos/${id}`;
export const thumbSrc = (p: SharedPhoto) => `data:image/jpeg;base64,${p.thumb}`;

// 和服务器的规则一致，先在页面上提示，少跑一趟请求
export const NAME_RE = /^[\p{L}\p{M}\p{N}_.-]+(?: [\p{L}\p{M}\p{N}_.-]+)*$/u;
export const normalizeName = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ');
export const nameOk = (s: string) => {
  const name = normalizeName(s);
  const length = [...name].length;
  return length >= 2 && length <= 20 && NAME_RE.test(name);
};
export const passwordOk = (s: string) => [...s].length >= 8 && [...s].length <= 128;
