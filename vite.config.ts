import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' 让打包后的 dist 可以放在任意路径下（GitHub Pages、子目录、在线预览）
export default defineConfig({
  base: './',
  plugins: [react()],
  // 本地开发：/api 转给 `npm run dev:api` 起的 Cloudflare 本地服务（账号、大家的树）
  server: { proxy: { '/api': 'http://127.0.0.1:8788' } },
})
