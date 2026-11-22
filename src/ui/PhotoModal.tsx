import { useEffect } from 'react';
import type { PhotoItem } from '../gifts';
import { photoName, useLang } from '../i18n';

interface Props {
  photos: PhotoItem[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}

export default function PhotoModal({ photos, index, onChange, onClose }: Props) {
  const photo = photos[index];
  const { t, lang } = useLang();
  const name = photoName(photo, lang);
  const go = (step: number) => onChange((index + step + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!photo) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="polaroid" key={index} onClick={(e) => e.stopPropagation()}>
        <img src={photo.url} alt={name} />
        <div className="polaroid__caption">{name || ' '}</div>
        <button className="icon-btn modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
      </div>
      {photos.length > 1 && (
        <>
          <button className="nav nav--prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={t.prev}>
            ‹
          </button>
          <button className="nav nav--next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={t.next}>
            ›
          </button>
          <div className="counter">{index + 1} / {photos.length}</div>
        </>
      )}
    </div>
  );
}
