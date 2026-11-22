import type { PhotoItem } from '../gifts';

const MAX_SIDE = 768;

/** 读取用户上传的图片，裁成正方形并缩小，避免几十 MB 的原图拖慢 3D 场景 */
export async function fileToPhoto(file: File): Promise<PhotoItem> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(side, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    out,
    out,
  );
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
