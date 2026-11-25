export type SceneState = 'CHAOS' | 'FORMED';

/** 手势给出的连续控制量（每帧读取，用 ref 共享，避免每帧重新渲染 React） */
export interface GestureMotion {
  yaw: number; // 每帧方位角增量（旋转）
  pitch: number; // 每帧俯仰角增量
  zoom: number; // >0 拉近，<0 拉远
}

// --- 视觉配置（大部分沿用原仓库）---
export const CONFIG = {
  colors: {
    emerald: '#004225',
    gold: '#FFD700',
    silver: '#ECEFF1',
    red: '#D32F2F',
    white: '#FFFFFF',
    warmLight: '#FFD54F',
    lights: ['#FF3030', '#30FF60', '#3070FF', '#FFE030'],
    loveLights: ['#FF4D8D', '#FF9EC4', '#FFD700', '#FFFFFF', '#FF2E63'], // 彩蛋时的彩灯
    borders: ['#FFFAF0', '#F0E68C', '#E6E6FA', '#FFB6C1', '#98FB98', '#87CEFA', '#FFDAB9'],
    giftColors: ['#D32F2F', '#FFD700', '#1976D2', '#2E7D32'],
    ribbonColors: ['#FFD700', '#FFFFFF', '#D32F2F', '#FFD700'],
  },
  counts: {
    foliage: 15000,
    ornaments: 96, // 树上拍立得数量（照片多时最多 maxOrnaments 张）
    maxOrnaments: 150,
    elements: 160, // 小礼盒/彩球/拐杖糖
    lights: 400,
  },
  tree: { height: 22, radius: 9 },
};

/** 在圆锥形树表面上随机取一个点 */
export const treeSurfacePoint = (offset: number, radiusScale = 1) => {
  const h = CONFIG.tree.height;
  const y = Math.random() * h - h / 2;
  const r = CONFIG.tree.radius * (1 - (y + h / 2) / h) * radiusScale + offset;
  const theta = Math.random() * Math.PI * 2;
  return [r * Math.cos(theta), y, r * Math.sin(theta)] as const;
};

/**
 * 沿螺旋线把第 i / n 个卡片均匀铺在树的圆锥面上：
 * 按面积分布（下面周长大，放得多），黄金角错开避免重叠，树尖和树底各留一点空。
 * 返回位置、所在角度，以及从树尖往下的比例 depth（0 = 树尖，1 = 树底）。
 */
export const treeSpiralPoint = (i: number, n: number, offset: number) => {
  const { height: h, radius: R } = CONFIG.tree;
  const s0 = 0.16; // 树尖下面留空（星星和最窄处不挂）
  const s1 = 0.96;
  const u = (i + 0.3 + Math.random() * 0.4) / n;
  const depth = Math.sqrt(s0 * s0 + u * (s1 * s1 - s0 * s0));
  const y = h / 2 - depth * h;
  const theta = i * 2.39996323 + (Math.random() - 0.5) * 0.25;
  const r = R * depth + offset;
  return { pos: [r * Math.cos(theta), y, r * Math.sin(theta)] as const, theta, depth };
};

export const randomInCube = (size: number) =>
  [(Math.random() - 0.5) * size, (Math.random() - 0.5) * size, (Math.random() - 0.5) * size] as const;
