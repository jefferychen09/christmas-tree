// Cloudflare Pages Functions 入口：/api/* 的所有请求都交给 server/router.ts
import { handle } from '../../server/router';

export const onRequest: PagesFunction<Env> = ({ request, env }) => handle(request, env);
