import { useEffect, useRef } from 'react';
import { useLang } from '../i18n';

const COLORS = ['#ff4d8d', '#ff9ec4', '#ffd700', '#ffffff', '#ff2e63', '#ffb86b'];
const DURATION = 5500;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

/** 🤟 彩蛋：满屏烟花 + 爱心烟花 + 一句祝福（quiet 时不显示文字，比如拆贺卡时）。每次 id 变化播放一次 */
export default function Celebration({ id, quiet = false }: { id: number; quiet?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLang();

  useEffect(() => {
    if (!id) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const burst = (heart: boolean) => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w * (0.15 + Math.random() * 0.7);
      const cy = h * (0.15 + Math.random() * 0.4);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const n = heart ? 90 : 70;
      const power = (heart ? 0.55 : 0.5 + Math.random() * 0.4) * dpr;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        let vx: number;
        let vy: number;
        if (heart) {
          // 心形曲线
          vx = 16 * Math.sin(a) ** 3;
          vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
          vx *= power * 0.32;
          vy *= power * 0.32;
        } else {
          const sp = (4 + Math.random() * 4) * power;
          vx = Math.cos(a) * sp;
          vy = Math.sin(a) * sp;
        }
        particles.push({ x: cx, y: cy, vx, vy, life: 1, color: heart ? '#ff4d8d' : color, size: (heart ? 2.6 : 2.2) * dpr });
      }
    };

    const start = performance.now();
    let last = start;
    let nextBurst = start;
    let count = 0;
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      const elapsed = now - start;
      if (!reduced && elapsed < DURATION - 1500 && now >= nextBurst) {
        burst(count % 3 === 1);
        count++;
        nextBurst = now + 260 + Math.random() * 260;
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.05 * dpr * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 0.012 * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (elapsed < DURATION || particles.length) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [id]);

  return (
    <>
      <canvas ref={canvasRef} className="fireworks" aria-hidden />
      {id > 0 && !quiet && (
        <div className="love" key={id} role="status">
          {t.loveMessage}
        </div>
      )}
    </>
  );
}
