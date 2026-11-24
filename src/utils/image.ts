import type { PhotoItem } from '../gifts';

const MAX_SIDE = 768; // 只在自己浏览器里用的照片
const SHARE_SIDE = 720; // 分享到大家的树：点开看的大图
const THUMB_SIDE = 256; // 分享到大家的树：挂在树上的小图

/** 从中间裁成正方形并缩小（透明背景填成白色，转 JPEG 后不会变黑） */
function squareCanvas(bitmap: ImageBitmap, maxSide: number) {
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(side, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
  return canvas;
}

/** 读取用户上传的图片，裁成正方形并缩小，避免几十 MB 的原图拖慢 3D 场景 */
export async function fileToPhoto(file: File): Promise<PhotoItem> {
  const bitmap = await createImageBitmap(file);
  const canvas = squareCanvas(bitmap, MAX_SIDE);
  bitmap.close();
  return {
    url: canvas.toDataURL('image/jpeg', 0.88),
    name: file.name.replace(/\.[^.]+$/, ''),
  };
}

export async function filesToPhotos(files: File[]): Promise<PhotoItem[]> {
  const images = files.filter((f) => f.type.startsWith('image/'));
  const results = await Promise.allSettled(images.map(fileToPhoto));
  return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
}

export interface SharePhoto {
  /** 720px 大图，base64 JPEG（不带 data: 前缀） */
  full: string;
  /** 256px 小图，base64 JPEG */
  thumb: string;
  /** 上传前预览用 */
  preview: string;
}

const jpegB64 = (canvas: HTMLCanvasElement, quality: number) => canvas.toDataURL('image/jpeg', quality).split(',')[1];

/** 准备要分享的照片：大图 + 小图，体积都控制在服务器限制以内 */
export async function fileToShare(file: File): Promise<SharePhoto> {
  const bitmap = await createImageBitmap(file);
  try {
    const big = squareCanvas(bitmap, SHARE_SIDE);
    const small = squareCanvas(bitmap, THUMB_SIDE);
    let full = jpegB64(big, 0.82);
    if (full.length > 900_000) full = jpegB64(big, 0.6); // 噪点特别多的照片再压一次
    const thumb = jpegB64(small, 0.75);
    return { full, thumb, preview: `data:image/jpeg;base64,${thumb}` };
  } finally {
    bitmap.close();
  }
}
