import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' 让打包后的 dist 可以放在任意路径下（GitHub Pages、子目录、在线预览）
export default defineConfig({
  base: './',
  plugins: [react()],
})
