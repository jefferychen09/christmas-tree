// 把 MediaPipe 的 wasm 文件从 node_modules 复制到 public/mediapipe/wasm，
// 这样手势识别不用从 jsDelivr 下载（国内访问不稳定）。npm 会在 dev / build 前自动运行它。
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'public/mediapipe/wasm';

if (!existsSync(from)) {
  console.error(`找不到 ${from}，请先运行 npm install`);
  process.exit(1);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`MediaPipe wasm → ${to}`);
