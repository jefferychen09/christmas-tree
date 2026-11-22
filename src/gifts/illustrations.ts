// 用 Canvas 2D 现场绘制的圣诞礼品插画（无需任何外部图片，离线可用）
// 每个插画画在 512×512 的画布上，导出为 dataURL 供 3D 贴图和弹窗使用。

type Ctx = CanvasRenderingContext2D;

interface Illustration {
  name: string;
  nameEn: string;
  bg: [string, string]; // 背景径向渐变：中心色、边缘色
  draw: (ctx: Ctx) => void;
}

const S = 512;

// ---------- 小工具 ----------
const circle = (ctx: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
};

const ellipse = (ctx: Ctx, x: number, y: number, rx: number, ry: number, rot: number, fill: string) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
};

const rrect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[], fill: string | CanvasGradient) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
};

const starPath = (ctx: Ctx, cx: number, cy: number, outer: number, inner: number, points = 5, rot = -Math.PI / 2) => {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const sparkle = (ctx: Ctx, x: number, y: number, r: number, color = 'rgba(255,240,200,0.9)') => {
  starPath(ctx, x, y, r, r * 0.25, 4, 0);
  ctx.fillStyle = color;
  ctx.fill();
};

const shadow = (ctx: Ctx, x: number, y: number, rx: number) => {
  ellipse(ctx, x, y, rx, rx * 0.16, 0, 'rgba(0,0,0,0.25)');
};

const holly = (ctx: Ctx, x: number, y: number, scale = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ellipse(ctx, -26, 0, 30, 13, -0.35, '#2e7d32');
  ellipse(ctx, 26, 0, 30, 13, 0.35, '#388e3c');
  ctx.strokeStyle = '#1b5e20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-50, 8); ctx.lineTo(-4, -2);
  ctx.moveTo(50, 8); ctx.lineTo(4, -2);
  ctx.stroke();
  circle(ctx, -8, -8, 10, '#d32f2f');
  circle(ctx, 9, -6, 10, '#c62828');
  circle(ctx, 0, 8, 10, '#e53935');
  circle(ctx, -11, -11, 3, 'rgba(255,255,255,0.6)');
  ctx.restore();
};

// ---------- 各个礼品 ----------
const illustrations: Illustration[] = [
  {
    name: '神秘礼盒',
    nameEn: 'Mystery Box',
    bg: ['#2f6b4f', '#123326'],
    draw(ctx) {
      shadow(ctx, 256, 438, 140);
      const body = ctx.createLinearGradient(146, 0, 366, 0);
      body.addColorStop(0, '#b71c1c'); body.addColorStop(0.5, '#e53935'); body.addColorStop(1, '#a31515');
      rrect(ctx, 146, 250, 220, 185, 10, body);
      const lid = ctx.createLinearGradient(0, 205, 0, 262);
      lid.addColorStop(0, '#ef5350'); lid.addColorStop(1, '#c62828');
      rrect(ctx, 130, 208, 252, 56, 10, lid);
      const gold = ctx.createLinearGradient(0, 200, 0, 440);
      gold.addColorStop(0, '#ffe082'); gold.addColorStop(1, '#ffb300');
      rrect(ctx, 238, 208, 36, 227, 4, gold);
      rrect(ctx, 146, 320, 220, 30, 4, gold);
      // 蝴蝶结
      ctx.save();
      ctx.translate(256, 205);
      ellipse(ctx, -52, -26, 56, 30, -0.45, '#ffca28');
      ellipse(ctx, 52, -26, 56, 30, 0.45, '#ffca28');
      ellipse(ctx, -50, -27, 30, 14, -0.45, '#ff8f00');
      ellipse(ctx, 50, -27, 30, 14, 0.45, '#ff8f00');
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-48, 48); ctx.lineTo(-24, 44); ctx.lineTo(-6, 6);
      ctx.moveTo(10, 0); ctx.lineTo(48, 48); ctx.lineTo(24, 44); ctx.lineTo(6, 6);
      ctx.fillStyle = '#ffb300';
      ctx.fill();
      circle(ctx, 0, -10, 22, '#ffd54f');
      ctx.restore();
      sparkle(ctx, 110, 150, 18); sparkle(ctx, 400, 120, 22); sparkle(ctx, 410, 300, 12);
    },
  },
  {
    name: '泰迪熊',
    nameEn: 'Teddy Bear',
    bg: ['#7a3b52', '#2c1220'],
    draw(ctx) {
      const fur = '#a1673a', light = '#d7a86e', dark = '#5d3a1a';
      shadow(ctx, 256, 455, 130);
      // 脚
      circle(ctx, 185, 425, 42, fur); circle(ctx, 327, 425, 42, fur);
      circle(ctx, 185, 428, 24, light); circle(ctx, 327, 428, 24, light);
      // 身体
      ellipse(ctx, 256, 345, 105, 100, 0, fur);
      ellipse(ctx, 256, 360, 62, 62, 0, light);
      // 手臂
      ellipse(ctx, 160, 320, 34, 62, 0.6, fur);
      ellipse(ctx, 352, 320, 34, 62, -0.6, fur);
      // 耳朵
      circle(ctx, 180, 105, 40, fur); circle(ctx, 332, 105, 40, fur);
      circle(ctx, 180, 105, 22, light); circle(ctx, 332, 105, 22, light);
      // 头
      circle(ctx, 256, 180, 96, fur);
      ellipse(ctx, 256, 218, 46, 36, 0, light);
      ellipse(ctx, 256, 200, 17, 12, 0, dark);
      circle(ctx, 220, 165, 11, dark); circle(ctx, 292, 165, 11, dark);
      circle(ctx, 223, 162, 4, '#fff'); circle(ctx, 295, 162, 4, '#fff');
      ctx.strokeStyle = dark; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(256, 212); ctx.lineTo(256, 228);
      ctx.arc(244, 228, 12, 0, Math.PI * 0.8);
      ctx.moveTo(256, 228); ctx.arc(268, 228, 12, Math.PI, Math.PI * 0.2, true);
      ctx.stroke();
      // 领结
      ctx.save(); ctx.translate(256, 270);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-44, -22); ctx.lineTo(-44, 22); ctx.closePath();
      ctx.moveTo(0, 0); ctx.lineTo(44, -22); ctx.lineTo(44, 22); ctx.closePath();
      ctx.fillStyle = '#d32f2f'; ctx.fill();
      circle(ctx, 0, 0, 12, '#b71c1c');
      ctx.restore();
      sparkle(ctx, 90, 220, 16); sparkle(ctx, 430, 210, 20);
    },
  },
  {
    name: '拐杖糖',
    nameEn: 'Candy Cane',
    bg: ['#1d4e6b', '#0a1d2b'],
    draw(ctx) {
      ctx.save();
      ctx.translate(30, 20);
      ctx.rotate(0.18);
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(280, 440);
        ctx.lineTo(280, 190);
        ctx.arc(215, 190, 65, 0, Math.PI, true);
        ctx.lineTo(150, 245);
      };
      ctx.lineCap = 'round';
      path(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 62; ctx.stroke();
      path(); ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 52; ctx.stroke();
      ctx.lineCap = 'butt';
      path(); ctx.strokeStyle = '#e53935'; ctx.setLineDash([22, 24]); ctx.lineWidth = 52; ctx.stroke();
      path(); ctx.strokeStyle = '#43a047'; ctx.lineDashOffset = -26; ctx.setLineDash([6, 40]); ctx.lineWidth = 52; ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      path(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 10;
      ctx.translate(-12, -4); ctx.stroke();
      ctx.restore();
      holly(ctx, 330, 280, 1.1);
      sparkle(ctx, 110, 110, 20); sparkle(ctx, 420, 140, 14); sparkle(ctx, 120, 400, 14);
    },
  },
  {
    name: '金色铃铛',
    nameEn: 'Golden Bell',
    bg: ['#7b1f1f', '#2a0a0a'],
    draw(ctx) {
      const gold = ctx.createLinearGradient(150, 0, 362, 0);
      gold.addColorStop(0, '#c79100'); gold.addColorStop(0.45, '#ffe57f'); gold.addColorStop(1, '#b8860b');
      ctx.beginPath();
      ctx.moveTo(256, 150);
      ctx.bezierCurveTo(175, 150, 165, 235, 165, 300);
      ctx.quadraticCurveTo(160, 345, 128, 372);
      ctx.lineTo(384, 372);
      ctx.quadraticCurveTo(352, 345, 347, 300);
      ctx.bezierCurveTo(347, 235, 337, 150, 256, 150);
      ctx.fillStyle = gold; ctx.fill();
      rrect(ctx, 120, 362, 272, 26, 13, '#d4a017');
      circle(ctx, 256, 405, 24, '#c79100');
      circle(ctx, 248, 398, 7, 'rgba(255,255,255,0.6)');
      ellipse(ctx, 205, 250, 14, 50, 0.15, 'rgba(255,255,255,0.35)');
      // 顶部挂环 + 红丝带
      ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(256, 138, 18, 0, Math.PI * 2); ctx.stroke();
      ellipse(ctx, 215, 118, 42, 20, -0.4, '#e53935');
      ellipse(ctx, 297, 118, 42, 20, 0.4, '#e53935');
      circle(ctx, 256, 125, 14, '#c62828');
      holly(ctx, 256, 160, 0.9);
      sparkle(ctx, 110, 180, 18); sparkle(ctx, 410, 230, 16); sparkle(ctx, 400, 420, 12);
    },
  },
  {
    name: '小雪人',
    nameEn: 'Snowman',
    bg: ['#2b4a7a', '#0d1830'],
    draw(ctx) {
      shadow(ctx, 256, 470, 120);
      const snow = (x: number, y: number, r: number) => {
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd8e6');
        circle(ctx, x, y, r, g);
      };
      snow(256, 385, 100);
      snow(256, 255, 76);
      snow(256, 150, 58);
      // 扣子
      circle(ctx, 256, 235, 8, '#263238'); circle(ctx, 256, 268, 8, '#263238'); circle(ctx, 256, 350, 9, '#263238');
      // 眼睛 + 胡萝卜鼻子 + 嘴
      circle(ctx, 236, 140, 7, '#263238'); circle(ctx, 276, 140, 7, '#263238');
      ctx.beginPath(); ctx.moveTo(256, 152); ctx.lineTo(312, 165); ctx.lineTo(256, 166); ctx.closePath();
      ctx.fillStyle = '#ff7043'; ctx.fill();
      for (let i = 0; i < 5; i++) circle(ctx, 232 + i * 12, 182 + Math.sin((i / 4) * Math.PI) * 6, 3.5, '#263238');
      // 围巾
      rrect(ctx, 194, 196, 124, 26, 13, '#e53935');
      rrect(ctx, 280, 205, 28, 72, 10, '#c62828');
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) ctx.fillRect(208 + i * 28, 196, 8, 26);
      // 帽子
      rrect(ctx, 200, 92, 112, 14, 6, '#212121');
      rrect(ctx, 220, 30, 72, 68, 6, '#2b2b2b');
      ctx.fillStyle = '#d32f2f'; ctx.fillRect(220, 80, 72, 12);
      // 树枝手臂
      ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(186, 250); ctx.lineTo(110, 200); ctx.moveTo(130, 213); ctx.lineTo(112, 230);
      ctx.moveTo(326, 250); ctx.lineTo(402, 196); ctx.moveTo(384, 209); ctx.lineTo(400, 228);
      ctx.stroke();
      for (let i = 0; i < 30; i++) circle(ctx, (i * 137) % S, (i * 89) % 300, 2 + (i % 3), 'rgba(255,255,255,0.7)');
    },
  },
  {
    name: '姜饼人',
    nameEn: 'Gingerbread Man',
    bg: ['#3d5a2a', '#15210e'],
    draw(ctx) {
      const cookie = '#b8652e';
      ctx.lineCap = 'round';
      ctx.strokeStyle = cookie; ctx.lineWidth = 64;
      ctx.beginPath();
      ctx.moveTo(256, 250); ctx.lineTo(148, 225);
      ctx.moveTo(256, 250); ctx.lineTo(364, 225);
      ctx.moveTo(240, 300); ctx.lineTo(192, 425);
      ctx.moveTo(272, 300); ctx.lineTo(320, 425);
      ctx.stroke();
      rrect(ctx, 196, 205, 120, 130, 40, cookie);
      circle(ctx, 256, 150, 70, cookie);
      // 糖霜
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
      const zig = (x: number, y: number, w: number, rot: number) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) { const px = -w / 2 + (w / 6) * i; const py = i % 2 ? 7 : -7; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke(); ctx.restore();
      };
      zig(160, 228, 44, 1.35); zig(352, 228, 44, -1.35);
      zig(202, 400, 48, 0.4); zig(310, 400, 48, -0.4);
      circle(ctx, 232, 138, 9, '#3e2723'); circle(ctx, 280, 138, 9, '#3e2723');
      circle(ctx, 218, 165, 10, 'rgba(255,120,120,0.55)'); circle(ctx, 294, 165, 10, 'rgba(255,120,120,0.55)');
      ctx.beginPath(); ctx.arc(256, 160, 26, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      circle(ctx, 256, 235, 11, '#e53935'); circle(ctx, 256, 270, 11, '#43a047'); circle(ctx, 256, 305, 11, '#fdd835');
      sparkle(ctx, 100, 120, 18); sparkle(ctx, 420, 110, 14); sparkle(ctx, 420, 380, 18);
    },
  },
  {
    name: '圣诞袜',
    nameEn: 'Stocking',
    bg: ['#2d5d63', '#0e2427'],
    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(200, 150);
      ctx.lineTo(320, 150);
      ctx.lineTo(320, 320);
      ctx.bezierCurveTo(320, 365, 300, 385, 268, 402);
      ctx.lineTo(190, 442);
      ctx.bezierCurveTo(135, 470, 92, 420, 122, 385);
      ctx.bezierCurveTo(140, 362, 175, 345, 200, 325);
      ctx.closePath();
      ctx.fillStyle = '#d32f2f'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#2e7d32';
      for (let y = 190; y < 460; y += 60) ctx.fillRect(0, y, S, 20);
      ctx.fillStyle = '#fff';
      for (let y = 210; y < 460; y += 60) for (let x = 90; x < 340; x += 26) circle(ctx, x + ((y / 60) % 2) * 13, y + 30, 4, '#fff');
      ellipse(ctx, 140, 425, 45, 40, 0, '#f5f5f5');
      ctx.restore();
      // 毛绒袜口
      rrect(ctx, 182, 92, 156, 72, 30, '#fafafa');
      for (let i = 0; i < 6; i++) circle(ctx, 196 + i * 26, 96 + (i % 2) * 6, 15, '#ffffff');
      for (let i = 0; i < 6; i++) circle(ctx, 196 + i * 26, 160 - (i % 2) * 6, 13, '#eeeeee');
      // 挂绳
      ctx.strokeStyle = '#ffca28'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(320, 80, 20, 0, Math.PI * 2); ctx.stroke();
      sparkle(ctx, 400, 160, 20); sparkle(ctx, 410, 330, 14); sparkle(ctx, 100, 200, 16);
    },
  },
  {
    name: '圣诞彩球',
    nameEn: 'Bauble',
    bg: ['#4a2a6e', '#160b24'],
    draw(ctx) {
      ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(256, 20); ctx.lineTo(256, 112); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(256, 112, 16, 0, Math.PI * 2); ctx.stroke();
      const g = ctx.createRadialGradient(205, 230, 20, 256, 300, 150);
      g.addColorStop(0, '#80d8ff'); g.addColorStop(0.5, '#1e88e5'); g.addColorStop(1, '#0d2c6b');
      circle(ctx, 256, 300, 148, g);
      ctx.save();
      ctx.beginPath(); ctx.arc(256, 300, 148, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(100, 270, 312, 18);
      ctx.fillRect(100, 330, 312, 10);
      for (let i = 0; i < 9; i++) { starPath(ctx, 120 + i * 34, 245, 10, 4); ctx.fill(); }
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 9; i++) circle(ctx, 138 + i * 30, 362, 5, '#e3f2fd');
      ctx.restore();
      ellipse(ctx, 195, 225, 42, 22, -0.7, 'rgba(255,255,255,0.45)');
      const cap = ctx.createLinearGradient(218, 0, 294, 0);
      cap.addColorStop(0, '#b8860b'); cap.addColorStop(0.5, '#ffe57f'); cap.addColorStop(1, '#b8860b');
      rrect(ctx, 220, 125, 72, 40, 6, cap);
      sparkle(ctx, 90, 140, 18); sparkle(ctx, 420, 170, 22); sparkle(ctx, 430, 430, 14); sparkle(ctx, 80, 420, 12);
    },
  },
  {
    name: '热可可',
    nameEn: 'Hot Cocoa',
    bg: ['#6b3e26', '#24130a'],
    draw(ctx) {
      shadow(ctx, 245, 440, 125);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const x = 200 + i * 45;
        ctx.beginPath(); ctx.moveTo(x, 190);
        ctx.bezierCurveTo(x - 25, 160, x + 25, 140, x, 105);
        ctx.stroke();
      }
      ctx.strokeStyle = '#c62828'; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.arc(352, 315, 52, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      rrect(ctx, 140, 210, 210, 225, 28, '#d32f2f');
      ellipse(ctx, 245, 214, 105, 22, 0, '#b71c1c');
      ellipse(ctx, 245, 218, 92, 16, 0, '#5d3a1a');
      rrect(ctx, 192, 200, 30, 24, 6, '#fff');
      rrect(ctx, 236, 196, 30, 24, 6, '#fce4ec');
      rrect(ctx, 272, 204, 28, 22, 6, '#fff');
      // 杯身雪花
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
      const flake = (x: number, y: number, r: number) => {
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath(); ctx.moveTo(x - r * Math.cos(a), y - r * Math.sin(a)); ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); ctx.stroke();
        }
      };
      flake(245, 320, 38); flake(180, 390, 16); flake(310, 270, 14);
      ctx.fillStyle = '#fff';
      for (let x = 160; x < 340; x += 22) circle(ctx, x, 420, 4, '#fff');
      sparkle(ctx, 90, 130, 16); sparkle(ctx, 430, 130, 20);
    },
  },
  {
    name: '毛线手套',
    nameEn: 'Knitted Mitten',
    bg: ['#7a2a3a', '#2a0b13'],
    draw(ctx) {
      ctx.save();
      ctx.translate(256, 256); ctx.rotate(-0.12); ctx.translate(-256, -256);
      ellipse(ctx, 182, 270, 34, 64, -0.55, '#2e7d32');
      rrect(ctx, 192, 110, 150, 270, [80, 80, 30, 30], '#388e3c');
      ctx.save();
      ctx.beginPath(); ctx.roundRect(192, 110, 150, 270, [80, 80, 30, 30]); ctx.clip();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(192 + i * 25, 250); ctx.lineTo(205 + i * 25, 236); ctx.lineTo(218 + i * 25, 250); ctx.lineTo(205 + i * 25, 264); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#d32f2f'; ctx.fillRect(192, 285, 150, 12); ctx.fillRect(192, 205, 150, 12);
      ctx.restore();
      rrect(ctx, 180, 368, 174, 74, 18, '#fafafa');
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 5;
      for (let x = 196; x < 350; x += 16) { ctx.beginPath(); ctx.moveTo(x, 376); ctx.lineTo(x, 434); ctx.stroke(); }
      ctx.restore();
      circle(ctx, 330, 420, 22, '#fff'); circle(ctx, 350, 440, 18, '#f5f5f5');
      sparkle(ctx, 110, 140, 18); sparkle(ctx, 420, 150, 16); sparkle(ctx, 420, 320, 12);
    },
  },
  {
    name: '圣诞花环',
    nameEn: 'Wreath',
    bg: ['#6e1c1c', '#260808'],
    draw(ctx) {
      const greens = ['#1b5e20', '#2e7d32', '#388e3c', '#43a047'];
      for (let i = 0; i < 70; i++) {
        const a = (i / 70) * Math.PI * 2;
        const r = 130 + ((i * 37) % 30) - 15;
        ellipse(ctx, 256 + r * Math.cos(a), 256 + r * Math.sin(a), 34, 16, a + 0.9, greens[i % 4]);
      }
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        circle(ctx, 256 + 132 * Math.cos(a), 256 + 132 * Math.sin(a), 11, i % 3 === 0 ? '#ffd54f' : '#e53935');
      }
      ctx.save(); ctx.translate(256, 395);
      ellipse(ctx, -48, -6, 50, 28, -0.3, '#d32f2f');
      ellipse(ctx, 48, -6, 50, 28, 0.3, '#d32f2f');
      ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-40, 80); ctx.lineTo(-14, 70); ctx.lineTo(4, 10);
      ctx.moveTo(8, 4); ctx.lineTo(40, 80); ctx.lineTo(14, 70); ctx.lineTo(-4, 10);
      ctx.fillStyle = '#b71c1c'; ctx.fill();
      circle(ctx, 0, 0, 18, '#c62828');
      ctx.restore();
      sparkle(ctx, 256, 256, 26); sparkle(ctx, 80, 90, 14); sparkle(ctx, 440, 90, 18);
    },
  },
  {
    name: '许愿星',
    nameEn: 'Wishing Star',
    bg: ['#1f2f6b', '#080d26'],
    draw(ctx) {
      for (let i = 0; i < 40; i++) circle(ctx, (i * 131 + 17) % S, (i * 211 + 41) % S, 1.5 + (i % 3), 'rgba(255,255,255,0.6)');
      const glow = ctx.createRadialGradient(256, 256, 20, 256, 256, 220);
      glow.addColorStop(0, 'rgba(255,224,130,0.55)'); glow.addColorStop(1, 'rgba(255,224,130,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);
      const g = ctx.createLinearGradient(130, 120, 380, 400);
      g.addColorStop(0, '#fff59d'); g.addColorStop(0.5, '#ffca28'); g.addColorStop(1, '#ff8f00');
      starPath(ctx, 256, 270, 160, 68);
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff8e1'; ctx.stroke();
      circle(ctx, 222, 265, 10, '#5d4037'); circle(ctx, 290, 265, 10, '#5d4037');
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(256, 285, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      circle(ctx, 205, 292, 12, 'rgba(255,112,67,0.5)'); circle(ctx, 307, 292, 12, 'rgba(255,112,67,0.5)');
      sparkle(ctx, 100, 120, 22); sparkle(ctx, 420, 110, 16); sparkle(ctx, 410, 420, 20); sparkle(ctx, 90, 410, 14);
    },
  },
];

const drawBackground = (ctx: Ctx, [inner, outer]: [string, string]) => {
  const g = ctx.createRadialGradient(256, 230, 30, 256, 256, 380);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // 雪点
  for (let i = 0; i < 45; i++) {
    const x = (i * 173 + 29) % S;
    const y = (i * 97 + 61) % S;
    circle(ctx, x, y, 1 + (i % 4) * 0.8, `rgba(255,255,255,${0.15 + (i % 5) * 0.06})`);
  }
};

export interface DrawnGift {
  name: string;
  nameEn: string;
  url: string;
}

let cache: DrawnGift[] | null = null;

/** 生成全部礼品插画（只生成一次） */
export function getIllustratedGifts(): DrawnGift[] {
  if (cache) return cache;
  cache = illustrations.map((item) => {
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    drawBackground(ctx, item.bg);
    ctx.save();
    item.draw(ctx);
    ctx.restore();
    return { name: item.name, nameEn: item.nameEn, url: canvas.toDataURL('image/jpeg', 0.9) };
  });
  return cache;
}
