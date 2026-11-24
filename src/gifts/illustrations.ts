// 用 Canvas 2D 现场绘制的圣诞礼品插画（无需任何外部图片，离线可用）
// 每个插画画在 512×512 的画布上，导出为 dataURL 供 3D 贴图和弹窗使用。

type Ctx = CanvasRenderingContext2D;

interface Illustration {
  name: string;
  nameEn: string;
  nameJa: string;
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
    nameJa: 'ミステリーボックス',
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
    nameJa: 'テディベア',
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
    nameJa: 'キャンディケイン',
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
    nameJa: '金のベル',
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
    nameJa: '雪だるま',
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
    nameJa: 'ジンジャーブレッドマン',
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
    nameJa: 'クリスマスの靴下',
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
    nameJa: 'オーナメントボール',
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
    nameJa: 'ホットココア',
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
    nameJa: 'ニットのミトン',
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
    nameJa: 'クリスマスリース',
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
    nameJa: '願い星',
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
  {
    name: '驯鹿',
    nameEn: 'Reindeer',
    nameJa: 'トナカイ',
    bg: ['#3b5f8a', '#101e33'],
    draw(ctx) {
      const fur = '#8d5a33', light = '#c89b6d', dark = '#4e2f17';
      // 鹿角（先画，头会盖住根部）
      ctx.strokeStyle = '#e6c79c'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(205, 150); ctx.quadraticCurveTo(170, 100, 150, 40);
      ctx.moveTo(176, 95); ctx.lineTo(118, 78);
      ctx.moveTo(160, 62); ctx.lineTo(186, 28);
      ctx.moveTo(307, 150); ctx.quadraticCurveTo(342, 100, 362, 40);
      ctx.moveTo(336, 95); ctx.lineTo(394, 78);
      ctx.moveTo(352, 62); ctx.lineTo(326, 28);
      ctx.stroke();
      // 耳朵
      ellipse(ctx, 160, 175, 46, 20, -0.5, fur); ellipse(ctx, 352, 175, 46, 20, 0.5, fur);
      ellipse(ctx, 162, 175, 28, 9, -0.5, light); ellipse(ctx, 350, 175, 28, 9, 0.5, light);
      // 脖子 + 头 + 口鼻
      rrect(ctx, 206, 300, 100, 140, 40, fur);
      ellipse(ctx, 256, 230, 92, 100, 0, fur);
      ellipse(ctx, 256, 292, 62, 46, 0, light);
      // 眼睛、鼻子、嘴、脸颊
      circle(ctx, 222, 215, 12, dark); circle(ctx, 290, 215, 12, dark);
      circle(ctx, 226, 211, 4, '#fff'); circle(ctx, 294, 211, 4, '#fff');
      ellipse(ctx, 256, 272, 24, 18, 0, '#3e2723');
      circle(ctx, 249, 266, 5, 'rgba(255,255,255,0.5)');
      ctx.strokeStyle = dark; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(256, 300, 16, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      circle(ctx, 200, 262, 12, 'rgba(255,138,128,0.45)'); circle(ctx, 312, 262, 12, 'rgba(255,138,128,0.45)');
      // 红项圈 + 金铃铛
      rrect(ctx, 196, 352, 120, 24, 12, '#d32f2f');
      circle(ctx, 256, 392, 22, '#ffca28');
      circle(ctx, 249, 385, 6, 'rgba(255,255,255,0.6)');
      rrect(ctx, 246, 398, 20, 5, 2, '#b8860b');
      sparkle(ctx, 90, 300, 16); sparkle(ctx, 430, 280, 20); sparkle(ctx, 420, 440, 12);
    },
  },
  {
    name: '圣诞帽',
    nameEn: 'Santa Hat',
    nameJa: 'サンタ帽',
    bg: ['#24585e', '#0b2124'],
    draw(ctx) {
      shadow(ctx, 256, 430, 150);
      // 帽身：向右垂下的圆锥
      const red = ctx.createLinearGradient(140, 0, 380, 0);
      red.addColorStop(0, '#b71c1c'); red.addColorStop(0.55, '#e53935'); red.addColorStop(1, '#a31515');
      ctx.beginPath();
      ctx.moveTo(140, 360);
      ctx.bezierCurveTo(150, 230, 210, 130, 300, 115);
      ctx.bezierCurveTo(350, 108, 392, 140, 400, 205);
      ctx.bezierCurveTo(372, 170, 340, 168, 330, 200);
      ctx.bezierCurveTo(345, 250, 370, 310, 372, 360);
      ctx.closePath();
      ctx.fillStyle = red; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(200, 330); ctx.quadraticCurveTo(220, 220, 290, 150); ctx.stroke();
      // 毛绒帽边
      rrect(ctx, 118, 340, 276, 70, 35, '#fafafa');
      for (let i = 0; i < 8; i++) circle(ctx, 138 + i * 34, 346 + (i % 2) * 6, 16, '#ffffff');
      for (let i = 0; i < 8; i++) circle(ctx, 140 + i * 33, 404 - (i % 2) * 5, 14, '#eeeeee');
      // 绒球
      const pom = ctx.createRadialGradient(392, 205, 6, 400, 215, 40);
      pom.addColorStop(0, '#ffffff'); pom.addColorStop(1, '#d9e1ea');
      circle(ctx, 400, 215, 38, pom);
      sparkle(ctx, 100, 140, 20); sparkle(ctx, 200, 70, 14); sparkle(ctx, 440, 330, 14);
    },
  },
  {
    name: '小火车',
    nameEn: 'Toy Train',
    nameJa: 'おもちゃの汽車',
    bg: ['#4a3a6e', '#181026'],
    draw(ctx) {
      // 铁轨
      rrect(ctx, 40, 428, 432, 10, 5, '#8d6e63');
      for (let x = 60; x < 470; x += 42) rrect(ctx, x, 438, 22, 14, 3, '#5d4037');
      // 烟
      circle(ctx, 190, 150, 22, 'rgba(255,255,255,0.75)');
      circle(ctx, 160, 112, 30, 'rgba(255,255,255,0.6)');
      circle(ctx, 120, 70, 36, 'rgba(255,255,255,0.45)');
      // 烟囱
      rrect(ctx, 176, 175, 40, 80, 6, '#37474f');
      rrect(ctx, 166, 168, 60, 18, 6, '#263238');
      // 锅炉
      const boiler = ctx.createLinearGradient(0, 245, 0, 375);
      boiler.addColorStop(0, '#ef5350'); boiler.addColorStop(1, '#b71c1c');
      rrect(ctx, 120, 250, 200, 125, 30, boiler);
      rrect(ctx, 175, 250, 14, 125, 4, '#ffca28'); rrect(ctx, 245, 250, 14, 125, 4, '#ffca28');
      circle(ctx, 120, 300, 18, '#fff59d');
      // 驾驶室
      rrect(ctx, 300, 190, 120, 185, 12, '#2e7d32');
      rrect(ctx, 288, 176, 144, 26, 8, '#1b5e20');
      rrect(ctx, 326, 220, 68, 56, 8, '#fff59d');
      ctx.fillStyle = '#1b5e20'; ctx.fillRect(357, 220, 6, 56);
      // 排障器 + 底盘
      ctx.beginPath(); ctx.moveTo(120, 340); ctx.lineTo(86, 400); ctx.lineTo(132, 400); ctx.closePath();
      ctx.fillStyle = '#ffb300'; ctx.fill();
      rrect(ctx, 110, 370, 320, 22, 8, '#263238');
      // 轮子 + 连杆
      const wheel = (x: number, r: number) => {
        circle(ctx, x, 400, r, '#212121');
        circle(ctx, x, 400, r * 0.55, '#ffca28');
        circle(ctx, x, 400, r * 0.2, '#212121');
      };
      wheel(170, 30); wheel(250, 30); wheel(380, 30);
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(170, 408); ctx.lineTo(250, 408); ctx.stroke();
      sparkle(ctx, 430, 110, 22); sparkle(ctx, 330, 80, 14); sparkle(ctx, 70, 300, 12);
    },
  },
  {
    name: '雪花水晶球',
    nameEn: 'Snow Globe',
    nameJa: 'スノードーム',
    bg: ['#355c4a', '#0f2219'],
    draw(ctx) {
      shadow(ctx, 256, 462, 140);
      // 木底座
      const wood = ctx.createLinearGradient(0, 370, 0, 460);
      wood.addColorStop(0, '#8d5a33'); wood.addColorStop(1, '#4e2f17');
      ctx.beginPath(); ctx.moveTo(150, 375); ctx.lineTo(362, 375); ctx.lineTo(390, 455); ctx.lineTo(122, 455); ctx.closePath();
      ctx.fillStyle = wood; ctx.fill();
      rrect(ctx, 140, 405, 232, 16, 6, '#ffca28');
      // 玻璃球
      const glass = ctx.createRadialGradient(215, 170, 20, 256, 230, 160);
      glass.addColorStop(0, 'rgba(225,245,254,0.9)'); glass.addColorStop(0.7, 'rgba(129,212,250,0.55)'); glass.addColorStop(1, 'rgba(41,121,255,0.55)');
      circle(ctx, 256, 230, 150, glass);
      ctx.save();
      ctx.beginPath(); ctx.arc(256, 230, 150, 0, Math.PI * 2); ctx.clip();
      ellipse(ctx, 256, 360, 170, 60, 0, '#fafafa');
      // 球里的小树
      const tier = (base: number, half: number, h: number, color: string) => {
        ctx.beginPath(); ctx.moveTo(256, base - h); ctx.lineTo(256 + half, base); ctx.lineTo(256 - half, base); ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
      };
      rrect(ctx, 246, 300, 20, 36, 4, '#6d4c41');
      tier(310, 70, 80, '#2e7d32'); tier(262, 56, 72, '#388e3c'); tier(216, 42, 64, '#43a047');
      starPath(ctx, 256, 150, 18, 7); ctx.fillStyle = '#ffd54f'; ctx.fill();
      circle(ctx, 230, 290, 6, '#e53935'); circle(ctx, 284, 250, 6, '#ffca28'); circle(ctx, 240, 220, 5, '#e53935'); circle(ctx, 270, 300, 6, '#42a5f5');
      for (let i = 0; i < 40; i++) circle(ctx, 110 + ((i * 53) % 300), 90 + ((i * 97) % 260), 2 + (i % 3), 'rgba(255,255,255,0.9)');
      ctx.restore();
      // 玻璃高光
      ellipse(ctx, 190, 150, 40, 18, -0.7, 'rgba(255,255,255,0.5)');
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(256, 230, 150, 0, Math.PI * 2); ctx.stroke();
      sparkle(ctx, 80, 110, 18); sparkle(ctx, 440, 130, 22); sparkle(ctx, 450, 400, 12);
    },
  },
  {
    name: '圣诞蜡烛',
    nameEn: 'Christmas Candles',
    nameJa: 'クリスマスキャンドル',
    bg: ['#5a2a1a', '#1e0c06'],
    draw(ctx) {
      const glow = ctx.createRadialGradient(256, 170, 10, 256, 200, 230);
      glow.addColorStop(0, 'rgba(255,213,79,0.45)'); glow.addColorStop(1, 'rgba(255,213,79,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);
      shadow(ctx, 256, 448, 150);
      // 金色托盘
      ellipse(ctx, 256, 432, 160, 30, 0, '#c79100');
      ellipse(ctx, 256, 424, 146, 22, 0, '#ffd54f');
      const candle = (x: number, y0: number, w: number, color: string, shade: string) => {
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, shade); g.addColorStop(0.4, color); g.addColorStop(1, shade);
        rrect(ctx, x, y0, w, 425 - y0, [10, 10, 4, 4], g);
        // 流下来的蜡油
        ellipse(ctx, x + w / 2, y0 + 4, w / 2, 9, 0, color);
        rrect(ctx, x + w * 0.15, y0, 12, 46, 6, color);
        rrect(ctx, x + w * 0.62, y0, 10, 30, 5, color);
        // 灯芯 + 火焰
        const fx = x + w / 2, fy = y0 - 12;
        ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(fx, y0 + 2); ctx.lineTo(fx, fy); ctx.stroke();
        const flame = ctx.createRadialGradient(fx, fy - 14, 2, fx, fy - 18, 30);
        flame.addColorStop(0, '#fffde7'); flame.addColorStop(0.45, '#ffd54f'); flame.addColorStop(1, '#ff6f00');
        ctx.beginPath();
        ctx.moveTo(fx, fy - 56);
        ctx.bezierCurveTo(fx + 22, fy - 28, fx + 18, fy + 2, fx, fy + 2);
        ctx.bezierCurveTo(fx - 18, fy + 2, fx - 22, fy - 28, fx, fy - 56);
        ctx.fillStyle = flame; ctx.fill();
      };
      candle(150, 250, 64, '#e53935', '#b71c1c');
      candle(236, 190, 72, '#fff8e1', '#e6d5b8');
      candle(330, 280, 58, '#43a047', '#2e7d32');
      holly(ctx, 256, 428, 0.9);
      sparkle(ctx, 90, 120, 16); sparkle(ctx, 430, 110, 20); sparkle(ctx, 80, 330, 12);
    },
  },
  {
    name: '姜饼屋',
    nameEn: 'Gingerbread House',
    nameJa: 'お菓子の家',
    bg: ['#6b2a4a', '#260c1a'],
    draw(ctx) {
      const cookie = '#b8652e', dark = '#8d4a1f', icing = '#fafafa';
      ellipse(ctx, 256, 452, 210, 34, 0, '#f5f5f5');
      // 烟囱（屋顶会盖住下半截）
      rrect(ctx, 300, 120, 44, 80, 4, dark);
      rrect(ctx, 294, 112, 56, 18, 6, icing);
      // 墙 + 屋顶
      rrect(ctx, 140, 250, 232, 190, 8, cookie);
      ctx.beginPath(); ctx.moveTo(110, 262); ctx.lineTo(256, 130); ctx.lineTo(402, 262); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
      // 屋檐糖霜
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        circle(ctx, 110 + 146 * t, 262 - 132 * t, 13, icing);
        circle(ctx, 402 - 146 * t, 262 - 132 * t, 13, icing);
      }
      // 屋顶上的软糖
      const gum = ['#e53935', '#43a047', '#fdd835', '#1e88e5'];
      for (let i = 0; i < 4; i++) circle(ctx, 190 + i * 44, 225 - Math.abs(1.5 - i) * 10, 10, gum[i]);
      // 门
      rrect(ctx, 226, 340, 60, 100, [30, 30, 4, 4], '#5d3a1a');
      ctx.strokeStyle = icing; ctx.lineWidth = 6; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.roundRect(226, 340, 60, 100, [30, 30, 4, 4]); ctx.stroke();
      ctx.setLineDash([]);
      circle(ctx, 274, 392, 5, '#ffd54f');
      // 窗
      const win = (x: number) => {
        rrect(ctx, x, 290, 54, 50, 6, '#ffe082');
        ctx.strokeStyle = icing; ctx.lineWidth = 6;
        ctx.strokeRect(x, 290, 54, 50);
        ctx.beginPath(); ctx.moveTo(x + 27, 290); ctx.lineTo(x + 27, 340); ctx.moveTo(x, 315); ctx.lineTo(x + 54, 315); ctx.stroke();
      };
      win(160); win(298);
      for (let x = 152; x < 372; x += 22) circle(ctx, x, 436, 6, icing);
      sparkle(ctx, 90, 120, 18); sparkle(ctx, 430, 100, 16); sparkle(ctx, 440, 360, 12);
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
  nameJa: string;
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
    return { name: item.name, nameEn: item.nameEn, nameJa: item.nameJa, url: canvas.toDataURL('image/jpeg', 0.9) };
  });
  return cache;
}
