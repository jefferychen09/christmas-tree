import type { SharedPhoto } from '../api';
import { getIllustratedGifts } from './illustrations';

export interface PhotoItem {
  url: string;
  name?: string;
  /** 英文名（内置插画有；自己的图片用文件名） */
  nameEn?: string;
  /** 日文名（内置插画有） */
  nameJa?: string;
  /** 挂在树上用的小图；没有就用 url */
  thumb?: string;
  /** 来自「大家的树」：上传者、时间等 */
  shared?: SharedPhoto;
}

// 你自己的礼品图片：放进 src/assets/gifts/ 文件夹即可自动加载（文件名就是礼品名，例如「小火车.jpg」）
const customGiftModules = import.meta.glob('../assets/gifts/*.{png,jpg,jpeg,webp,gif,PNG,JPG,JPEG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const fileNameToTitle = (path: string) =>
  decodeURIComponent(path.split('/').pop() || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

/** 默认礼品图 = 你放进文件夹的图片 + 自动绘制的插画 */
export function getDefaultGifts(): PhotoItem[] {
  const custom = Object.entries(customGiftModules)
    .sort(([a], [b]) => a.localeCompare(b, 'zh'))
    .map(([path, url]) => ({ url, name: fileNameToTitle(path) }));
  return [...custom, ...getIllustratedGifts()];
}

export const customGiftCount = Object.keys(customGiftModules).length;
