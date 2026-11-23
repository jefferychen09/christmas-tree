import type { Lang } from './i18n';

/** 一张贺卡。链接里只放文字，不放照片（照片太大，放不进链接，也不该离开发送者的设备） */
export interface Card {
  to: string;
  msg: string;
  from: string;
  lang: Lang;
}

export const LIMITS = { to: 24, from: 24, msg: 300 } as const;

const HASH_KEY = 'card=';

// UTF-8 → base64url，中文也能放进链接
const encode = (s: string) => {
  let bin = '';
  new TextEncoder().encode(s).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decode = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const cardHash = (card: Card) =>
  HASH_KEY + encode(JSON.stringify({ t: card.to.trim(), m: card.msg.trim(), f: card.from.trim(), l: card.lang }));

/** 生成完整的分享链接。用 # 存放，内容不会发送到服务器 */
// 嵌在别的页面里运行时（例如 claude.ai 在线预览），本页地址别人打不开，构建时用 VITE_SHARE_URL 指定贺卡链接的网址
const SHARE_URL: string | undefined = import.meta.env.VITE_SHARE_URL;
export const cardUrl = (card: Card) => `${SHARE_URL || location.origin + location.pathname}#${cardHash(card)}`;

/** 从当前地址读出贺卡；没有或格式不对时返回 null */
export function readCardFromHash(): Card | null {
  const hash = location.hash.replace(/^#/, '');
  if (!hash.startsWith(HASH_KEY)) return null;
  try {
    const raw = JSON.parse(decode(hash.slice(HASH_KEY.length)));
    const card: Card = {
      to: clip(raw.t, LIMITS.to),
      msg: clip(raw.m, LIMITS.msg),
      from: clip(raw.f, LIMITS.from),
      lang: raw.l === 'zh' ? 'zh' : 'en',
    };
    return card.to && card.msg ? card : null;
  } catch {
    return null;
  }
}
