import { adminResetPassword, changePassword, login, logout, me, register } from './auth';
import { corsHeaders, HttpError, json, PREFLIGHT_HEADERS } from './http';
import { deletePhoto, getPhoto, listPhotos, myPhotos, uploadPhoto } from './photos';

/**
 * 接口一览
 *   POST   /api/register              注册 { name, password }
 *   POST   /api/login                 登录 { name, password }
 *   POST   /api/logout                退出
 *   GET    /api/me                    当前用户
 *   POST   /api/password              改密码 { currentPassword, newPassword }
 *   POST   /api/admin/reset-password  管理员重置别人的密码 { name }
 *   GET    /api/photos                大家的照片（不用登录）
 *   POST   /api/photos                分享一张照片 { full, thumb }（base64 JPEG）
 *   GET    /api/me/photos             我分享的照片
 *   GET    /api/photos/:id            大图
 *   DELETE /api/photos/:id            删除照片（上传者或管理员）
 */
async function route(req: Request, env: Env): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const method = req.method;

  if (method === 'POST') {
    if (path === '/api/register') return register(req, env);
    if (path === '/api/login') return login(req, env);
    if (path === '/api/logout') return logout(req, env);
    if (path === '/api/password') return changePassword(req, env);
    if (path === '/api/admin/reset-password') return adminResetPassword(req, env);
    if (path === '/api/photos') return uploadPhoto(req, env);
  }
  if (method === 'GET' || method === 'HEAD') {
    if (path === '/api/me') return me(req, env);
    if (path === '/api/me/photos') return myPhotos(req, env);
    if (path === '/api/photos') return listPhotos(req, env);
  }
  const photo = /^\/api\/photos\/(\d{1,12})$/.exec(path);
  if (photo) {
    const id = Number(photo[1]);
    if (method === 'GET' || method === 'HEAD') return getPhoto(env, id);
    if (method === 'DELETE') return deletePhoto(req, env, id);
  }
  throw new HttpError(404, 'not_found');
}

export async function handle(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(req, env);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors['Access-Control-Allow-Origin'] ? { ...cors, ...PREFLIGHT_HEADERS } : {} });
  }

  let res: Response;
  try {
    res = await route(req, env);
  } catch (err) {
    if (err instanceof HttpError) {
      res = json({ error: err.code }, err.status);
    } else {
      console.error(err);
      res = json({ error: 'server' }, 500);
    }
  }
  for (const [key, value] of Object.entries(cors)) res.headers.set(key, value);
  return res;
}
